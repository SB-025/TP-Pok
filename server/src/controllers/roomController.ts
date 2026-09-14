import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { RoomPlayer } from '../models/RoomPlayer';
import { LedgerEntry } from '../models/LedgerEntry';
import { Pot } from '../models/Pot';
import { createRoomSchema, joinRoomSchema } from '../validators/roomValidator';
import { transferChips } from '../services/transferService';
import { contributeToPot, settlePot } from '../services/potService';
import { io } from '../index';
import mongoose from 'mongoose';
import crypto from 'crypto';

const generateRoomCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const settings = createRoomSchema.parse(req.body);
    
    let roomCode = generateRoomCode();
    while (await Room.findOne({ roomCode })) {
      roomCode = generateRoomCode();
    }

    const room = await Room.create({
      roomCode,
      hostId: userId,
      settings: {
        playerLimit: settings.playerLimit || 9,
        startingChips: settings.startingChips || 1000,
      }
    });

    await RoomPlayer.create({
      roomId: room._id,
      userId,
      balance: 0,
      status: 'ACTIVE',
      connectionState: 'DISCONNECTED'
    });

    res.status(201).json(room);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    res.status(400).json({ message: error.message || 'Error creating room' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { roomCode } = joinRoomSchema.parse(req.body);

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.state !== 'WAITING') {
      return res.status(400).json({ message: 'Room is already playing' });
    }

    const existingPlayer = await RoomPlayer.findOne({ roomId: room._id, userId });
    if (existingPlayer) {
      return res.status(200).json(room);
    }

    const playerCount = await RoomPlayer.countDocuments({ roomId: room._id, status: 'ACTIVE' });
    const playerLimit = room.settings?.playerLimit ?? 9;
    if (playerCount >= playerLimit) {
      return res.status(400).json({ message: 'Room is full' });
    }

    await RoomPlayer.create({
      roomId: room._id,
      userId,
      balance: 0,
      status: 'ACTIVE',
      connectionState: 'DISCONNECTED'
    });

    res.status(200).json(room);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    res.status(400).json({ message: error.message || 'Error joining room' });
  }
};

export const getRoomState = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.roomCode;
    const room = await Room.findOne({ roomCode }).populate('hostId', 'username');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
    const pot = await Pot.findOne({ roomId: room._id, status: { $in: ['OPEN', 'LOCKED'] } });
    
    res.json({ room, players, pot });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const startGame = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = (req as any).user.id;
    const roomCode = req.params.roomCode;
    
    const room = await Room.findOne({ roomCode }).session(session);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.hostId.toString() !== userId) {
      throw new Error('Only the host can start the game');
    }
    if (room.state !== 'WAITING') {
      throw new Error('Game already started');
    }

    const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).session(session);
    if (players.length < 2) {
      // Allow 1 player for testing/development if needed, but requirements imply multiple players.
      // We will allow 2+ players.
      throw new Error('Not enough players');
    }

    room.state = 'PLAYING';
    await room.save({ session });

    const startingChips = room.settings?.startingChips || 1000;

    for (const player of players) {
      player.balance = startingChips;
      await player.save({ session });
      
      await LedgerEntry.create([{
        roomId: room._id,
        type: 'STARTING_CHIPS',
        amount: startingChips,
        toUserId: player.userId,
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Create initial pot outside of transaction for simplicity or inside. We already committed, so outside is fine.
    const pot = new Pot({ roomId: room._id, status: 'OPEN', totalAmount: 0, contributions: [] });
    await pot.save();

    const updatedPlayers = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
    await room.populate('hostId', 'username');
    io.to(roomCode).emit('room:state', { room, players: updatedPlayers, pot });
    io.to(roomCode).emit('room:gameStarted');

    res.json({ message: 'Game started' });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

export const getLedger = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.roomCode;
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const userId = (req as any).user.id;
    const player = await RoomPlayer.findOne({ roomId: room._id, userId });
    if (!player) return res.status(403).json({ message: 'Not a player in this room' });

    const ledger = await LedgerEntry.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .populate('fromUserId', 'username')
      .populate('toUserId', 'username');

    res.json(ledger);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const transfer = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.roomCode;
    const { toUserId, amount } = req.body;
    const fromUserId = (req as any).user.id;

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await transferChips(room._id.toString(), fromUserId, toUserId, amount);

    const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
    await room.populate('hostId', 'username');
    io.to(roomCode).emit('room:state', { room, players });
    io.to(roomCode).emit('room:transfer', { fromUserId, toUserId, amount });

    res.json({ message: 'Transfer successful' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const contributePot = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.roomCode;
    const { amount } = req.body;
    const userId = (req as any).user.id;

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const pot = await contributeToPot(room._id.toString(), userId, amount);

    const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
    await room.populate('hostId', 'username');
    io.to(roomCode).emit('room:state', { room, players, pot });
    io.to(roomCode).emit('room:potUpdate', pot);

    res.json({ message: 'Contribution successful', pot });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const settlePotController = async (req: Request, res: Response) => {
  try {
    const roomCode = req.params.roomCode;
    const { winnerUserIds, isRefund } = req.body;
    const hostUserId = (req as any).user.id;

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const newPot = await settlePot(room._id.toString(), hostUserId, winnerUserIds, isRefund);

    const players = await RoomPlayer.find({ roomId: room._id, status: 'ACTIVE' }).populate('userId', 'username');
    await room.populate('hostId', 'username');
    io.to(roomCode).emit('room:state', { room, players, pot: newPot });
    io.to(roomCode).emit('room:potUpdate', newPot);

    res.json({ message: 'Pot settled', pot: newPot });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

