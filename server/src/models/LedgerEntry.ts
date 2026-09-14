import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  type: { 
    type: String, 
    enum: ['STARTING_CHIPS', 'TRANSFER', 'BET', 'POT_CONTRIBUTION', 'POT_PAYOUT', 'REFUND', 'ADJUSTMENT', 'BLIND'], 
    required: true 
  },
  amount: { type: Number, required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Index for querying room ledger efficiently
ledgerEntrySchema.index({ roomId: 1, createdAt: 1 });

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
