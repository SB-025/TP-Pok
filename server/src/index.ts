import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import roomRoutes from './routes/roomRoutes';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { globalApiLimiter } from './middleware/rateLimitMiddleware';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

// Connect to MongoDB only if not in test mode, to let tests handle their own DB.
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

export const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api', globalApiLimiter);
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
  res.send('PokAp API is running...');
});

// Catch 404
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

// Error handling
app.use(errorHandler);

import { socketAuthMiddleware } from './sockets/socketAuth';
import { registerRoomSockets } from './sockets/roomSockets';

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.data.user.username}`);
  
  registerRoomSockets(io, socket);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
