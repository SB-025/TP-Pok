import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['WAITING', 'PLAYING', 'FINISHED'], default: 'WAITING' },
  settings: {
    playerLimit: { type: Number, default: 9, max: 10, min: 2 },
    startingChips: { type: Number, default: 1000 },
  }
}, { timestamps: true });

export const Room = mongoose.model('Room', roomSchema);
