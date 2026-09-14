import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

interface Player {
  _id: string;
  username: string;
}

interface PayoutSheetProps {
  players: Player[];
  potAmount: number;
  onPayout: (winnerId: string) => Promise<void>;
  onClose: () => void;
}

export const PayoutSheet = ({ players, potAmount, onPayout, onClose }: PayoutSheetProps) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    setIsSubmitting(true);
    try {
      await onPayout(selectedPlayerId);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const selectedPlayer = players.find(p => p._id === selectedPlayerId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-background/80 backdrop-blur-md"
    >
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full h-[90vh] md:h-auto max-w-2xl bg-surface border-t md:border border-border rounded-t-3xl md:rounded-3xl relative z-10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-success/20 rounded-full blur-[100px] pointer-events-none opacity-50" />
        
        <div className="flex justify-between items-center p-6 border-b border-border/50 relative z-10">
          <h2 className="text-sm font-bold text-success uppercase tracking-[0.3em] font-mono">AWARD POT</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-white rounded-full hover:bg-white/5 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col gap-12 relative z-10 justify-center">
          
          <div className="text-center">
            <div className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] font-mono mb-2">POT AMOUNT</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {potAmount.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-success uppercase tracking-widest font-mono text-center">SELECT RECIPIENT</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map(p => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedPlayerId(p._id)}
                  className={`py-6 px-3 rounded-2xl border transition-all duration-300 ${
                    selectedPlayerId === p._id 
                      ? 'border-success bg-success/20 text-white shadow-[0_0_15px_var(--success)] scale-105' 
                      : 'border-border bg-surface-2 text-muted hover:border-success/50 hover:bg-white/5'
                  }`}
                >
                  <span className="font-mono text-sm tracking-widest uppercase font-bold block truncate">{p.username}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting || !selectedPlayerId}
              className="w-full bg-success hover:bg-[#059669] disabled:bg-surface-2 disabled:text-muted disabled:border disabled:border-border text-white rounded-full py-6 font-bold text-xl tracking-[0.2em] uppercase transition-all duration-500 font-mono shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:shadow-none flex items-center justify-center gap-4 group"
            >
              <span>{isSubmitting ? 'PROCESSING...' : 'AWARD POT'}</span>
              {!isSubmitting && <Trophy className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>
            {selectedPlayer && (
              <p className="text-center font-mono text-xs text-muted mt-4 uppercase tracking-widest">
                <span className="text-success">{selectedPlayer.username}</span> WILL RECEIVE {potAmount.toLocaleString()} CHIPS
              </p>
            )}
          </div>
          
        </form>
      </motion.div>
    </motion.div>
  );
};
