import mongoose from 'mongoose';

const potSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  status: { type: String, enum: ['OPEN', 'LOCKED', 'SETTLED', 'REFUNDED'], default: 'OPEN' },
  totalAmount: { type: Number, default: 0 },
  contributions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }
  }],
  settledAt: { type: Date }
}, { timestamps: true });

potSchema.index({ roomId: 1, status: 1 });

export const Pot = mongoose.model('Pot', potSchema);
