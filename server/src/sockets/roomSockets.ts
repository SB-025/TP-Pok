import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';
import { RoomPlayer } from '../models/RoomPlayer';

export const registerRoomSockets = (io: Server, socket: Socket) => {
  const userId = socket.data.user.id;

  socket.on('room:join', async (roomCode: string) => {
    try {
      const room = await Room.findOne({ roomCode }).populate('hostId', 'username');
      if (!room) return socket.emit('error', { message: 'Room not found' });

      // Find the player entry
      const player = await RoomPlayer.findOne({ roomId: room._id, userId });
      if (!player || player.status !== 'ACTIVE') {
        return socket.emit('error', { message: 'Not an active player in this room' });
      }

      // Update connection state
      player.connectionState = 'CONNECTED';
      await player.save();

      // Join socket room
      socket.join(roomCode);

      // Broadcast to others
      socket.to(roomCode).emit('room:playerJoined', { userId, username: socket.data.user.username });

      // Send current state
      const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
      io.to(roomCode).emit('room:state', { room, players });

    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('room:leave', async (roomCode: string) => {
    try {
      const room = await Room.findOne({ roomCode }).populate('hostId', 'username');
      if (!room) return;

      const player = await RoomPlayer.findOne({ roomId: room._id, userId });
      if (player) {
        player.status = 'INACTIVE';
        player.connectionState = 'DISCONNECTED';
        await player.save();

        socket.leave(roomCode);
        socket.to(roomCode).emit('room:playerLeft', { userId });
        
        const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
        io.to(roomCode).emit('room:state', { room, players });
      }
    } catch (error: any) {
      console.error(error);
    }
  });

  socket.on('disconnecting', async () => {
    for (const roomCode of socket.rooms) {
      if (roomCode !== socket.id) {
        try {
          const room = await Room.findOne({ roomCode }).populate('hostId', 'username');
          if (room) {
            await RoomPlayer.updateOne(
              { roomId: room._id, userId },
              { connectionState: 'DISCONNECTED' }
            );
            
            const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
            io.to(roomCode).emit('room:state', { room, players });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    }
  });
};
