import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, Trophy, X } from 'lucide-react';

interface FloatingActionMenuProps {
  onAddPot: () => void;
  onTransfer: () => void;
  onPayout: () => void;
  isHost: boolean;
}

export const FloatingActionMenu = ({ onAddPot, onTransfer, onPayout, isHost }: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 md:right-12 md:bottom-12 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex flex-col gap-3 mb-4 items-end"
          >
            {isHost && (
              <button onClick={() => { setIsOpen(false); onPayout(); }} className="flex items-center gap-4 group">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">PAYOUT POT</span>
                <div className="w-12 h-12 rounded-full bg-success/20 text-success border border-success flex items-center justify-center hover:bg-success hover:text-white transition-all shadow-[0_0_15px_var(--success)]">
                  <Trophy className="w-5 h-5" />
                </div>
              </button>
            )}
            
            <button onClick={() => { setIsOpen(false); onTransfer(); }} className="flex items-center gap-4 group">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">TRANSFER CHIPS</span>
              <div className="w-12 h-12 rounded-full bg-surface text-text border border-border flex items-center justify-center hover:border-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
            
            <button onClick={() => { setIsOpen(false); onAddPot(); }} className="flex items-center gap-4 group">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">ADD TO POT</span>
              <div className="w-12 h-12 rounded-full bg-accent/20 text-accent border border-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-glow">
                <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                  <div className="w-1 h-1 bg-current rounded-full" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center shadow-glow hover:shadow-[0_0_40px_var(--accent-glow)] transition-all hover:-translate-y-1 z-10"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
        </motion.div>
      </button>
    </div>
  );
};
