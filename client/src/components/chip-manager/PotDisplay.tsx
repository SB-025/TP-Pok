import { useState } from 'react';
import { toast } from 'react-toastify';
import type { PotData } from '../../stores/useRoomStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

interface PotDisplayProps {
  pot: PotData | null;
  isHost: boolean;
  onAward: (winnerUserId: string) => Promise<void>;
  allPlayers: any[];
}

export const PotDisplay = ({ pot, isHost, onAward, allPlayers }: PotDisplayProps) => {
  const [winnerId, setWinnerId] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  if (!pot || pot.status !== 'OPEN') {
    return (
      <div className="bg-surface/50 border border-border rounded-3xl p-8 flex flex-col items-center justify-center h-[300px] font-sans">
        <Coins className="w-12 h-12 text-muted/30 mb-4" />
        <p className="text-muted font-bold tracking-widest uppercase text-sm">NO ACTIVE POT</p>
      </div>
    );
  }

  const handleAward = async () => {
    if (!winnerId) return toast.error('SELECT A WINNER');
    setIsAwarding(true);
    try {
      await onAward(winnerId);
      setWinnerId('');
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <motion.div 
      layout
      className="bg-surface/80 backdrop-blur-md border border-border rounded-3xl p-8 relative overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 right-0 w-full h-1 bg-accent" />
      <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-accent-glow rounded-full blur-[60px] opacity-30 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4 relative z-10">
        <h2 className="text-white font-bold uppercase tracking-widest text-sm font-sans flex items-center gap-2">
          <Coins className="w-4 h-4 text-accent" /> CURRENT POT
        </h2>
        <span className="text-accent text-xs font-bold uppercase tracking-widest bg-accent-glow/20 px-3 py-1 rounded-full border border-accent/20">ACTIVE</span>
      </div>
      
      <div className="text-center mb-10 relative z-10">
        <motion.p 
          key={pot.totalAmount}
          initial={{ scale: 1.1, color: "var(--accent-bright)" }}
          animate={{ scale: 1, color: "var(--text)" }}
          className="text-6xl md:text-7xl font-black text-white font-mono tracking-tight"
        >
          {pot.totalAmount.toLocaleString()}
        </motion.p>
        <p className="text-accent font-bold tracking-widest mt-2 text-sm uppercase font-mono">CHIPS</p>
      </div>

      <div className="mb-8 relative z-10">
        <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 font-mono">CONTRIBUTIONS</h4>
        {pot.contributions.length === 0 ? (
          <p className="text-muted/40 text-xs font-bold tracking-widest uppercase text-center py-4 bg-surface-2/30 rounded-xl">NO CONTRIBUTIONS YET</p>
        ) : (
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {pot.contributions.map((c, i) => {
                const pName = allPlayers.find(p => p.userId._id === c.userId)?.userId.username || 'UNKNOWN';
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between items-center text-xs font-bold uppercase tracking-widest bg-surface-2/50 px-4 py-3 rounded-xl border border-border"
                  >
                    <span className="text-text-secondary">
                      <span className="text-muted/50 mr-3 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                      {pName}
                    </span>
                    <span className="text-accent font-mono">+{c.amount.toLocaleString()}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isHost && (
        <div className="flex flex-col gap-4 pt-6 border-t border-border mt-auto relative z-10">
          <label className="text-xs font-bold text-muted uppercase tracking-widest font-mono">HOST ACTION: AWARD POT</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="flex-1 bg-surface-2 border border-border text-white rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-accent appearance-none font-sans"
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
            >
              <option value="" disabled>SELECT WINNER...</option>
              {allPlayers.map(p => (
                <option key={p.userId._id} value={p.userId._id}>{p.userId.username}</option>
              ))}
            </select>
            <button 
              onClick={handleAward}
              disabled={isAwarding || !winnerId}
              className="bg-accent hover:bg-accent-bright text-white rounded-xl disabled:opacity-50 px-8 py-3 font-bold text-sm uppercase tracking-widest transition-all font-sans shadow-glow hover:shadow-[0_0_20px_var(--accent-glow)]"
            >
              AWARD
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
