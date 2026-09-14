import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContribute: (amount: number) => Promise<void>;
  currentUserBalance: number;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({ isOpen, onClose, onContribute, currentUserBalance }) => {
  const [amount, setAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);

  const parsedAmount = parseInt(amount) || 0;
  const newBalance = currentUserBalance - parsedAmount;

  const handleConfirm = async () => {
    if (parsedAmount <= 0) return;
    setIsContributing(true);
    try {
      await onContribute(parsedAmount);
      setAmount('');
      onClose();
    } finally {
      setIsContributing(false);
    }
  };

  const handleQuickAdd = (val: number) => {
    const current = parseInt(amount) || 0;
    setAmount((current + val).toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ADD TO POT">
      <div className="space-y-6 font-mono">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">YOUR BALANCE</label>
          <div className="text-xl font-bold text-white">{currentUserBalance.toLocaleString()} CHIPS</div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">AMOUNT</label>
          <input 
            type="number" 
            className="w-full bg-surface-2 border border-border text-white rounded-xl px-4 py-4 outline-none focus:border-accent focus:shadow-glow text-3xl font-bold font-mono transition-all placeholder:text-muted/30"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={currentUserBalance}
            placeholder="0"
          />
          <div className="flex gap-2 mt-3 font-sans">
            {[100, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAdd(val)}
                className="flex-1 bg-surface-2 border border-border rounded-lg py-2 text-xs font-bold text-text-secondary hover:text-white hover:border-accent transition-colors"
              >
                +{val >= 1000 ? `${val/1000}K` : val}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-between items-end">
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">AFTER CONTRIBUTION</div>
            <div className={`text-2xl font-bold ${newBalance < 0 ? 'text-danger' : 'text-white'}`}>
              {newBalance.toLocaleString()} <span className="text-sm font-sans text-muted">CHIPS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 border border-border rounded-xl text-white px-4 py-4 font-bold hover:bg-surface-2 transition-colors font-sans"
          >
            CANCEL
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isContributing || parsedAmount <= 0 || newBalance < 0}
            className="flex-1 bg-accent text-white rounded-xl px-4 py-4 font-bold hover:bg-accent-bright disabled:opacity-50 disabled:hover:bg-accent transition-all font-sans shadow-glow hover:-translate-y-0.5 hover:shadow-[0_0_25px_var(--accent-glow)]"
          >
            ADD TO POT
          </button>
        </div>
      </div>
    </Modal>
  );
};
