import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/User';
import { Room } from '../src/models/Room';
import { RoomPlayer } from '../src/models/RoomPlayer';
import { Pot } from '../src/models/Pot';
import { app } from '../src/index';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryReplSet;
let user1: any, user2: any, user3: any;
let token1: string, token2: string, token3: string;
let roomId: string;
let roomCode: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  user1 = await User.create({ username: 'potHost', passwordHash: 'hash' });
  user2 = await User.create({ username: 'potP2', passwordHash: 'hash' });
  user3 = await User.create({ username: 'potP3', passwordHash: 'hash' });

  token1 = jwt.sign({ id: user1._id }, process.env.JWT_SECRET || 'secret');
  token2 = jwt.sign({ id: user2._id }, process.env.JWT_SECRET || 'secret');
  token3 = jwt.sign({ id: user3._id }, process.env.JWT_SECRET || 'secret');

  const res = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${token1}`)
    .send({ playerLimit: 5, startingChips: 1000 });
  
  roomId = res.body._id;
  roomCode = res.body.roomCode;

  await request(app).post('/api/rooms/join').set('Authorization', `Bearer ${token2}`).send({ roomCode });
  await request(app).post('/api/rooms/join').set('Authorization', `Bearer ${token3}`).send({ roomCode });

  // Start game to allocate chips
  await request(app).post(`/api/rooms/${roomCode}/start`).set('Authorization', `Bearer ${token1}`);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const getChipTotal = async () => {
  const players = await RoomPlayer.find({ roomId });
  const pots = await Pot.find({ roomId, status: { $in: ['OPEN', 'LOCKED'] } });
  const playerSum = players.reduce((acc, p) => acc + p.balance, 0);
  const potSum = pots.reduce((acc, p) => acc + p.totalAmount, 0);
  return { playerSum, potSum, total: playerSum + potSum };
};

describe('Phase 5: Pot System', () => {
  it('initializes an empty pot on game start', async () => {
    const pot = await Pot.findOne({ roomId, status: 'OPEN' });
    expect(pot).toBeDefined();
    expect(pot?.totalAmount).toBe(0);
    
    const { total } = await getChipTotal();
    expect(total).toBe(3000); // 3 players * 1000
  });

  it('allows players to contribute to the pot', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomCode}/pot/contribute`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: 100 });
    
    expect(res.status).toBe(200);
    expect(res.body.pot.totalAmount).toBe(100);

    const player2 = await RoomPlayer.findOne({ roomId, userId: user2._id });
    expect(player2?.balance).toBe(900);

    const { total } = await getChipTotal();
    expect(total).toBe(3000); // Conservation Invariant
  });

  it('rejects invalid contributions', async () => {
    const res1 = await request(app)
      .post(`/api/rooms/${roomCode}/pot/contribute`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: -50 });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post(`/api/rooms/${roomCode}/pot/contribute`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: 0 });
    expect(res2.status).toBe(400);

    const res3 = await request(app)
      .post(`/api/rooms/${roomCode}/pot/contribute`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: 50.5 });
    expect(res3.status).toBe(400);

    const res4 = await request(app)
      .post(`/api/rooms/${roomCode}/pot/contribute`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ amount: 2000 }); // Exceeds 900
    expect(res4.status).toBe(400);
  });

  it('settles pot with multiple winners', async () => {
    // Both user1 and user3 contribute
    await request(app).post(`/api/rooms/${roomCode}/pot/contribute`).set('Authorization', `Bearer ${token1}`).send({ amount: 200 });
    await request(app).post(`/api/rooms/${roomCode}/pot/contribute`).set('Authorization', `Bearer ${token3}`).send({ amount: 100 });

    // Pot is now 100 + 200 + 100 = 400
    const potBefore = await Pot.findOne({ roomId, status: 'OPEN' });
    expect(potBefore?.totalAmount).toBe(400);

    const res = await request(app)
      .post(`/api/rooms/${roomCode}/pot/settle`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ winnerUserIds: [user1._id.toString(), user3._id.toString()], isRefund: false });

    expect(res.status).toBe(200);

    const settledPot = await Pot.findById(potBefore?._id);
    expect(settledPot?.status).toBe('SETTLED');

    // Winner payouts: 400 / 2 = 200 each
    // p1 had 1000 - 200 = 800. Receives 200 -> 1000
    // p3 had 1000 - 100 = 900. Receives 200 -> 1100
    // p2 had 900 (contributed 100 earlier). 900 + 0 -> 900
    const p1 = await RoomPlayer.findOne({ roomId, userId: user1._id });
    const p2 = await RoomPlayer.findOne({ roomId, userId: user2._id });
    const p3 = await RoomPlayer.findOne({ roomId, userId: user3._id });

    expect(p1?.balance).toBe(1000);
    expect(p2?.balance).toBe(900);
    expect(p3?.balance).toBe(1100);

    const { total } = await getChipTotal();
    expect(total).toBe(3000);
  });

  it('refunds pot perfectly', async () => {
    // Contribute again
    await request(app).post(`/api/rooms/${roomCode}/pot/contribute`).set('Authorization', `Bearer ${token1}`).send({ amount: 50 });
    await request(app).post(`/api/rooms/${roomCode}/pot/contribute`).set('Authorization', `Bearer ${token2}`).send({ amount: 150 });
    await request(app).post(`/api/rooms/${roomCode}/pot/contribute`).set('Authorization', `Bearer ${token3}`).send({ amount: 250 });

    // Refund
    const res = await request(app)
      .post(`/api/rooms/${roomCode}/pot/settle`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ winnerUserIds: [], isRefund: true });

    expect(res.status).toBe(200);

    // Balances should be exactly what they were before these latest contributions
    const p1 = await RoomPlayer.findOne({ roomId, userId: user1._id });
    const p2 = await RoomPlayer.findOne({ roomId, userId: user2._id });
    const p3 = await RoomPlayer.findOne({ roomId, userId: user3._id });

    expect(p1?.balance).toBe(1000);
    expect(p2?.balance).toBe(900);
    expect(p3?.balance).toBe(1100);

    const { total } = await getChipTotal();
    expect(total).toBe(3000);
  });

  it('prevents non-host from settling pot', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomCode}/pot/settle`)
      .set('Authorization', `Bearer ${token2}`) // not host
      .send({ winnerUserIds: [user2._id.toString()], isRefund: false });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only the host can settle the pot');
  });
});
