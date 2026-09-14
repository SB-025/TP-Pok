import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/User';
import { Room } from '../src/models/Room';
import { RoomPlayer } from '../src/models/RoomPlayer';
import { LedgerEntry } from '../src/models/LedgerEntry';
import { transferChips } from '../src/services/transferService';
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

  user1 = await User.create({ username: 'chipHost', passwordHash: 'hash' });
  user2 = await User.create({ username: 'chipP2', passwordHash: 'hash' });
  user3 = await User.create({ username: 'chipP3', passwordHash: 'hash' });

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
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 4: Chip Allocation and Ledger', () => {
  it('players should start with 0 balance before game starts', async () => {
    const players = await RoomPlayer.find({ roomId });
    for (const p of players) {
      expect(p.balance).toBe(0);
    }
  });

  it('host can start game and allocate chips exactly once', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomCode}/start`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);

    const players = await RoomPlayer.find({ roomId });
    for (const p of players) {
      expect(p.balance).toBe(1000);
    }

    const ledgers = await LedgerEntry.find({ roomId, type: 'STARTING_CHIPS' });
    expect(ledgers.length).toBe(3);
    for (const l of ledgers) {
      expect(l.amount).toBe(1000);
    }
  });

  it('cannot start game again', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomCode}/start`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Game already started');
  });

  it('can transfer chips and maintain conservation invariant', async () => {
    await transferChips(roomId, user1._id.toString(), user2._id.toString(), 200);

    const p1 = await RoomPlayer.findOne({ roomId, userId: user1._id });
    const p2 = await RoomPlayer.findOne({ roomId, userId: user2._id });

    expect(p1?.balance).toBe(800);
    expect(p2?.balance).toBe(1200);

    const ledger = await LedgerEntry.findOne({ roomId, type: 'TRANSFER' });
    expect(ledger?.amount).toBe(200);

    // Assert Conservation Invariant: Sum of balances == Total Chips Issued
    const players = await RoomPlayer.find({ roomId });
    const sumBalances = players.reduce((acc, p) => acc + p.balance, 0);
    expect(sumBalances).toBe(3000); // 3 * 1000
  });

  it('prevents concurrent transfers from exceeding balance', async () => {
    const transferAmount = 500;
    
    const promises = [
      transferChips(roomId, user2._id.toString(), user3._id.toString(), transferAmount),
      transferChips(roomId, user2._id.toString(), user3._id.toString(), transferAmount),
      transferChips(roomId, user2._id.toString(), user3._id.toString(), transferAmount)
    ];

    await Promise.allSettled(promises);
    
    const p2 = await RoomPlayer.findOne({ roomId, userId: user2._id });
    const p3 = await RoomPlayer.findOne({ roomId, userId: user3._id });

    expect(p2?.balance).toBeGreaterThanOrEqual(0);

    const players = await RoomPlayer.find({ roomId });
    const sumBalances = players.reduce((acc, p) => acc + p.balance, 0);
    expect(sumBalances).toBe(3000);
  });

  it('prevents non-host from starting game', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token2}`)
      .send({ playerLimit: 2, startingChips: 1000 });
    const newRoomCode = res.body.roomCode;
    
    const startRes = await request(app)
      .post(`/api/rooms/${newRoomCode}/start`)
      .set('Authorization', `Bearer ${token1}`);
    expect(startRes.status).toBe(400);
    expect(startRes.body.message).toBe('Only the host can start the game');
  });

  it('rejects negative, zero, and decimal amounts', async () => {
    await expect(transferChips(roomId, user1._id.toString(), user2._id.toString(), -100))
      .rejects.toThrow('Transfer amount must be a positive integer');
    await expect(transferChips(roomId, user1._id.toString(), user2._id.toString(), 0))
      .rejects.toThrow('Transfer amount must be a positive integer');
    await expect(transferChips(roomId, user1._id.toString(), user2._id.toString(), 50.5))
      .rejects.toThrow('Transfer amount must be a positive integer');
  });

  it('rejects transfer if recipient is not in the same room', async () => {
    const user4 = await User.create({ username: 'chipP4', passwordHash: 'hash' });
    await expect(transferChips(roomId, user1._id.toString(), user4._id.toString(), 100))
      .rejects.toThrow('Recipient is not an active player in this room');
  });
});
