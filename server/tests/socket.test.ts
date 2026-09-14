import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User';
import { socketAuthMiddleware } from '../src/sockets/socketAuth';

let mongoServer: MongoMemoryServer;
let io: Server;
let serverSocket: any;
let clientSocket: ClientSocket;
let port: number;
let testToken: string;
let testUserId: string;

beforeAll(async () => {
  // DB Setup
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Setup User and Token
  const user = await User.create({ username: 'socketuser', passwordHash: 'hash' });
  testUserId = user._id.toString();
  testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET || 'secret');

  // Server setup
  const httpServer = createServer();
  io = new Server(httpServer);
  io.use(socketAuthMiddleware);
  io.on('connection', (socket) => {
    serverSocket = socket;
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      resolve();
    });
  });
});

afterAll(async () => {
  io.close();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Socket.IO Authentication', () => {
  it('should connect successfully with valid token', async () => {
    return new Promise<void>((resolve) => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: testToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        expect(serverSocket.data.user.id).toBe(testUserId);
        expect(serverSocket.data.user.username).toBe('socketuser');
        clientSocket.disconnect();
        resolve();
      });
    });
  });

  it('should reject connection without token', async () => {
    return new Promise<void>((resolve) => {
      const unauthClient = Client(`http://localhost:${port}`, { transports: ['websocket'] });
      unauthClient.on('connect_error', (err) => {
        expect(err).toBeDefined();
        unauthClient.disconnect();
        resolve();
      });
    });
  });

  it('should reject connection with invalid token', async () => {
    return new Promise<void>((resolve) => {
      const invalidClient = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid_token' },
        transports: ['websocket']
      });
      invalidClient.on('connect_error', (err) => {
        expect(err).toBeDefined();
        invalidClient.disconnect();
        resolve();
      });
    });
  });
});
