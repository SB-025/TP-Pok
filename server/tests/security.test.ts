import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/User';
import { Room } from '../src/models/Room';
import { RoomPlayer } from '../src/models/RoomPlayer';
import { app } from '../src/index';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { transferChips } from '../src/services/transferService';

let mongoServer: MongoMemoryReplSet;
let user1: any, user2: any, user3: any;
let token1: string, token2: string, token3: string;
let roomId: string;
let roomCode: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  user1 = await User.create({ username: 'secHost', passwordHash: 'hash' });
  user2 = await User.create({ username: 'secP2', passwordHash: 'hash' });
  user3 = await User.create({ username: 'secP3', passwordHash: 'hash' });

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

  // Start game
  await request(app).post(`/api/rooms/${roomCode}/start`).set('Authorization', `Bearer ${token1}`);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const getBalances = async () => {
  const p1 = await RoomPlayer.findOne({ userId: user1._id });
  const p2 = await RoomPlayer.findOne({ userId: user2._id });
  const p3 = await RoomPlayer.findOne({ userId: user3._id });
  return [p1?.balance || 0, p2?.balance || 0, p3?.balance || 0];
};

describe('Security Audit: Chips & Concurrency', () => {
  it('prevents race conditions with concurrent double-spend transfers', async () => {
    // p1 has 1000 chips. Attempts to send 1000 chips to p2, 100 times simultaneously.
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .post(`/api/rooms/${roomCode}/transfer`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ toUserId: user2._id, amount: 1000 })
      );
    }
    
    await Promise.all(promises);

    const [b1, b2, b3] = await getBalances();
    
    // Exact balance sum must remain 3000
    expect(b1 + b2 + b3).toBe(3000);
    // p1 cannot drop below 0
    expect(b1).toBeGreaterThanOrEqual(0);
    // p2 can only receive 1000 max since p1 only had 1000
    expect(b2).toBeLessThanOrEqual(2000);
  });

  it('rejects negative, float, and excessively large transfer amounts', async () => {
    const invalidAmounts = [-500, 0, 1.5, 1e21, NaN];
    
    for (const amount of invalidAmounts) {
      const res = await request(app)
        .post(`/api/rooms/${roomCode}/transfer`)
        .set('Authorization', `Bearer ${token2}`) // p2 has ~2000 chips now
        .send({ toUserId: user1._id, amount });
        
      expect(res.status).toBe(400);
    }
    
    const [b1, b2, b3] = await getBalances();
    // Verify no chips moved
    expect(b1 + b2 + b3).toBe(3000);
  });
});
