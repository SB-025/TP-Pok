import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomPlayer } from '../models/RoomPlayer';
import { LedgerEntry } from '../models/LedgerEntry';

export const transferChips = async (
  roomId: string,
  fromUserId: string,
  toUserId: string,
  amount: number
) => {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Transfer amount must be a positive integer');
  }
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer chips to yourself');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.state !== 'PLAYING') {
      throw new Error('Game is not active');
    }

    const fromPlayer = await RoomPlayer.findOne({ roomId, userId: fromUserId }).session(session);
    if (!fromPlayer || fromPlayer.status !== 'ACTIVE') {
      throw new Error('Sender is not an active player in this room');
    }

    const toPlayer = await RoomPlayer.findOne({ roomId, userId: toUserId }).session(session);
    if (!toPlayer || toPlayer.status !== 'ACTIVE') {
      throw new Error('Recipient is not an active player in this room');
    }

    if (fromPlayer.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Perform atomic updates
    fromPlayer.balance -= amount;
    toPlayer.balance += amount;

    await fromPlayer.save({ session });
    await toPlayer.save({ session });

    await LedgerEntry.create([{
      roomId,
      type: 'TRANSFER',
      amount,
      fromUserId,
      toUserId,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return {
      fromPlayerBalance: fromPlayer.balance,
      toPlayerBalance: toPlayer.balance
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
