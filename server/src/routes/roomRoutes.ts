import express from 'express';
import { createRoom, joinRoom, getRoomState, startGame, getLedger, transfer, contributePot, settlePotController } from '../controllers/roomController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { actionLimiter } from '../middleware/rateLimitMiddleware';
import { createRoomSchema, joinRoomSchema, transferSchema, potContributeSchema } from '../validators/roomValidator';

const router = express.Router();

router.post('/', protect, validate(createRoomSchema), createRoom);
router.post('/join', protect, validate(joinRoomSchema), joinRoom);
router.get('/:roomCode', protect, getRoomState);
router.post('/:roomCode/start', protect, startGame);
router.get('/:roomCode/ledger', protect, getLedger);
router.post('/:roomCode/transfer', protect, actionLimiter, validate(transferSchema), transfer);
router.post('/:roomCode/pot/contribute', protect, actionLimiter, validate(potContributeSchema), contributePot);
router.post('/:roomCode/pot/settle', protect, settlePotController);

export default router;
