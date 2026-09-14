import { z } from 'zod';

export const createRoomSchema = z.object({
  playerLimit: z.number().min(2).max(10).optional(),
  startingChips: z.number().min(100).optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().length(5),
});

export const transferSchema = z.object({
  toUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  amount: z.number().int().positive().max(100000000),
});

export const potContributeSchema = z.object({
  amount: z.number().int().positive().max(100000000),
});


