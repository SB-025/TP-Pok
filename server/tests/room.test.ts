import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/index';
import { User } from '../src/models/User';
import { Room } from '../src/models/Room';
import { RoomPlayer } from '../src/models/RoomPlayer';
import jwt from 'jsonwebtoken';
import { socketAuthMiddleware } from '../src/sockets/socketAuth';
import { registerRoomSockets } from '../src/sockets/roomSockets';

let mongoServer: MongoMemoryServer;
let ioServer: Server;
let port: number;

let user1: any;
let user2: any;
let user3: any;
let token1: string;
let token2: string;
let token3: string;

let roomCode: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  user1 = await User.create({ username: 'host', passwordHash: 'hash' });
  user2 = await User.create({ username: 'player2', passwordHash: 'hash' });
  user3 = await User.create({ username: 'player3', passwordHash: 'hash' });
  
  token1 = jwt.sign({ id: user1._id }, process.env.JWT_SECRET || 'secret');
  token2 = jwt.sign({ id: user2._id }, process.env.JWT_SECRET || 'secret');
  token3 = jwt.sign({ id: user3._id }, process.env.JWT_SECRET || 'secret');

  const httpServer = createServer(app);
  ioServer = new Server(httpServer);
  ioServer.use(socketAuthMiddleware);
  ioServer.on('connection', (socket) => {
    registerRoomSockets(ioServer, socket);
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      resolve();
    });
  });
});

afterAll(async () => {
  ioServer.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Room REST API', () => {
  it('should create a room and set user as host', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token1}`)
      .send({ playerLimit: 2, startingChips: 1000 });
      
    expect(res.status).toBe(201);
    expect(res.body.roomCode).toBeDefined();
    expect(res.body.roomCode.length).toBe(5);
    expect(res.body.hostId).toBe(user1._id.toString());
    
    roomCode = res.body.roomCode;
    
    const player = await RoomPlayer.findOne({ roomId: res.body._id, userId: user1._id });
    expect(player).toBeDefined();
    expect(player?.balance).toBe(0);
  });

  it('should join an existing room', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ roomCode });
      
    expect(res.status).toBe(200);
    expect(res.body.roomCode).toBe(roomCode);
  });

  it('should prevent joining a full room', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token3}`)
      .send({ roomCode });
      
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Room is full');
  });

  it('should return 200 for duplicate membership without erroring', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ roomCode });
      
    expect(res.status).toBe(200);
  });

  it('should fail joining an invalid room', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${token3}`)
      .send({ roomCode: 'XXXXX' });
      
    expect(res.status).toBe(404);
  });
});

describe('Room Socket Realtime Events', () => {
  let client1: ClientSocket;
  let client2: ClientSocket;

  beforeAll(async () => {
    client1 = Client(`http://localhost:${port}`, { auth: { token: token1 }, transports: ['websocket'] });
    client2 = Client(`http://localhost:${port}`, { auth: { token: token2 }, transports: ['websocket'] });
    
    await Promise.all([
      new Promise<void>(resolve => client1.on('connect', resolve)),
      new Promise<void>(resolve => client2.on('connect', resolve))
    ]);
  });

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
  });

  it('should sync state and broadcast playerJoined when joining socket room', async () => {
    return new Promise<void>((resolve) => {
      client1.emit('room:join', roomCode);
      
      client1.on('room:state', (data) => {
        expect(data.room.roomCode).toBe(roomCode);
        expect(data.players.length).toBeGreaterThanOrEqual(1);
        client1.off('room:state');
        
        client2.emit('room:join', roomCode);
      });

      client1.on('room:playerJoined', (data) => {
        expect(data.username).toBe('player2');
        client1.off('room:playerJoined');
        resolve();
      });
    });
  });

  it('should handle disconnect and reconnect correctly', async () => {
    return new Promise<void>((resolve) => {
      client2.disconnect();
      
      client1.on('room:state', (data) => {
        const p2 = data.players.find((p: any) => p.userId.username === 'player2');
        if (p2 && p2.connectionState === 'DISCONNECTED') {
          client1.off('room:state');
          
          client2 = Client(`http://localhost:${port}`, { auth: { token: token2 }, transports: ['websocket'] });
          client2.on('connect', () => {
            client2.emit('room:join', roomCode);
          });

          client1.on('room:state', (reconnectData) => {
            const p2re = reconnectData.players.find((p: any) => p.userId.username === 'player2');
            if (p2re && p2re.connectionState === 'CONNECTED') {
              client1.off('room:state');
              resolve();
            }
          });
        }
      });
    });
  });
  
  it('should broadcast playerLeft when leaving', async () => {
    return new Promise<void>((resolve) => {
      client2.emit('room:leave', roomCode);
      
      client1.on('room:playerLeft', (data) => {
        expect(data.userId).toBe(user2._id.toString());
        client1.off('room:playerLeft');
        resolve();
      });
    });
  });
});
