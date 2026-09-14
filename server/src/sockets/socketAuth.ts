import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    
    const user = await User.findById(decoded.id).select('_id username');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.data.user = {
      id: user._id.toString(),
      username: user.username
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    next(new Error('Authentication error: Invalid token'));
  }
};
