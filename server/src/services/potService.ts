import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomPlayer } from '../models/RoomPlayer';
import { LedgerEntry } from '../models/LedgerEntry';
import { Pot } from '../models/Pot';

export const contributeToPot = async (roomId: string, userId: string, amount: number) => {
  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Contribution amount must be a positive integer');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const room = await Room.findById(roomId).session(session);
    if (!room) throw new Error('Room not found');
    if (room.state !== 'PLAYING') throw new Error('Game is not playing');

    const player = await RoomPlayer.findOne({ roomId, userId }).session(session);
    if (!player || player.status !== 'ACTIVE') {
      throw new Error('Player is not active in this room');
    }

    if (player.balance < amount) {
      throw new Error('Insufficient balance');
    }

    let pot = await Pot.findOne({ roomId, status: 'OPEN' }).session(session);
    if (!pot) {
      pot = new Pot({ roomId, status: 'OPEN', totalAmount: 0, contributions: [] });
    }

    // Debit player
    player.balance -= amount;
    await player.save({ session });

    // Update Pot
    pot.totalAmount += amount;
    const existingContributionIndex = pot.contributions.findIndex(c => c.userId.toString() === userId);
    if (existingContributionIndex >= 0) {
      pot.contributions[existingContributionIndex].amount += amount;
    } else {
      pot.contributions.push({ userId: new mongoose.Types.ObjectId(userId), amount });
    }
    await pot.save({ session });

    // Ledger Entry
    await LedgerEntry.create([{
      roomId,
      fromUserId: userId,
      type: 'POT_CONTRIBUTION',
      amount,
      metadata: { potId: pot._id }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return pot;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const settlePot = async (roomId: string, hostUserId: string, winnerUserIds: string[], isRefund: boolean) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const room = await Room.findById(roomId).session(session);
    if (!room) throw new Error('Room not found');
    
    if (room.hostId.toString() !== hostUserId) {
      throw new Error('Only the host can settle the pot');
    }

    const pot = await Pot.findOne({ roomId, status: { $in: ['OPEN', 'LOCKED'] } }).session(session);
    if (!pot) throw new Error('No open pot to settle');

    if (pot.totalAmount === 0) {
      pot.status = 'SETTLED';
      pot.settledAt = new Date();
      await pot.save({ session });
      await session.commitTransaction();
      session.endSession();
      return pot;
    }

    if (isRefund) {
      pot.status = 'REFUNDED';
      for (const contribution of pot.contributions) {
        if (contribution.amount > 0) {
          const player = await RoomPlayer.findOne({ roomId, userId: contribution.userId }).session(session);
          if (player) {
            player.balance += contribution.amount;
            await player.save({ session });
            
            await LedgerEntry.create([{
              roomId,
              toUserId: contribution.userId,
              type: 'REFUND',
              amount: contribution.amount,
              metadata: { potId: pot._id }
            }], { session });
          }
        }
      }
    } else {
      pot.status = 'SETTLED';
      if (!winnerUserIds || winnerUserIds.length === 0) {
        throw new Error('Winner user IDs are required to settle the pot');
      }

      // Distribute evenly, ignore fractions for MVP or handle them. 
      // For simplicity, handle remainders by giving them to the first winner(s)
      const basePayout = Math.floor(pot.totalAmount / winnerUserIds.length);
      let remainder = pot.totalAmount % winnerUserIds.length;

      for (let i = 0; i < winnerUserIds.length; i++) {
        const winnerId = winnerUserIds[i];
        let payout = basePayout;
        if (remainder > 0) {
          payout += 1;
          remainder -= 1;
        }

        if (payout > 0) {
          const player = await RoomPlayer.findOne({ roomId, userId: winnerId }).session(session);
          if (player) {
            player.balance += payout;
            await player.save({ session });
            
            await LedgerEntry.create([{
              roomId,
              toUserId: winnerId,
              type: 'POT_PAYOUT',
              amount: payout,
              metadata: { potId: pot._id }
            }], { session });
          }
        }
      }
    }

    pot.settledAt = new Date();
    await pot.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Create a new empty pot automatically for the next hand
    const nextPot = new Pot({ roomId, status: 'OPEN', totalAmount: 0, contributions: [] });
    await nextPot.save();

    return nextPot; // Or return the settled pot, but usually UI wants the active one
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
