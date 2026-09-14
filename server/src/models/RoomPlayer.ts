import mongoose from 'mongoose';

const roomPlayerSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  connectionState: { type: String, enum: ['CONNECTED', 'DISCONNECTED'], default: 'CONNECTED' },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

roomPlayerSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export const RoomPlayer = mongoose.model('RoomPlayer', roomPlayerSchema);
