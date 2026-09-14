import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, X } from 'lucide-react';

interface ContributeSheetProps {
  maxAmount: number;
  onContribute: (amount: number) => Promise<void>;
  onClose: () => void;
}

export const ContributeSheet = ({ maxAmount, onContribute, onClose }: ContributeSheetProps) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = (add: number) => {
    const current = parseInt(amountStr || '0', 10);
    setAmountStr(Math.min(current + add, maxAmount).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (amount <= 0 || amount > maxAmount) return;

    setIsSubmitting(true);
    try {
      await onContribute(amount);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

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
        <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-accent-glow rounded-full blur-[100px] pointer-events-none opacity-20" />
        
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] font-mono">CONTRIBUTE TO POT</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-white rounded-full hover:bg-white/5 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col gap-12 relative justify-center">
          
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono text-center">CONTRIBUTION AMOUNT</label>
            
            <input
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full bg-transparent text-6xl md:text-8xl font-black text-center text-white font-mono focus:outline-none border-b-2 border-border focus:border-accent pb-2 transition-all placeholder:text-muted/10"
              placeholder="0"
              autoFocus
            />

            <div className="flex justify-center gap-3 mt-8">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="px-4 py-2 rounded-full border border-border hover:border-accent/50 text-muted hover:text-white font-mono text-xs font-bold transition-all hover:bg-white/5"
                >
                  +{val >= 1000 ? `${val/1000}K` : val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr(maxAmount.toString())}
                className="px-4 py-2 rounded-full border border-accent/30 text-accent font-mono text-xs font-bold transition-all hover:bg-accent hover:text-white shadow-glow-sm"
              >
                ALL IN
              </button>
            </div>
          </div>

          <div className="mt-12">
            <button
              type="submit"
              disabled={isSubmitting || !amountStr || parseInt(amountStr) <= 0 || parseInt(amountStr) > maxAmount}
              className="w-full bg-accent hover:bg-accent-bright disabled:bg-surface-2 disabled:text-muted disabled:border disabled:border-border text-white rounded-full py-6 font-bold text-xl tracking-[0.2em] uppercase transition-all duration-500 font-mono shadow-glow disabled:shadow-none hover:shadow-[0_0_40px_var(--accent-glow)] flex items-center justify-center gap-4 group"
            >
              <span>{isSubmitting ? 'PROCESSING...' : 'PUSH TO POT'}</span>
              {!isSubmitting && <ArrowUp className="w-6 h-6 group-hover:-translate-y-2 transition-transform" />}
            </button>
          </div>
          
        </form>
      </motion.div>
    </motion.div>
  );
};
