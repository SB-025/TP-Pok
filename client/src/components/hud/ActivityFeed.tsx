import { motion, AnimatePresence } from 'framer-motion';

interface LedgerEntry {
  _id: string;
  type: 'TRANSFER' | 'CONTRIBUTION' | 'PAYOUT';
  senderId?: { _id: string; username: string } | null;
  receiverId?: { _id: string; username: string } | null;
  amount: number;
  createdAt: string;
}

interface ActivityFeedProps {
  transactions: LedgerEntry[];
}

export const ActivityFeed = ({ transactions }: ActivityFeedProps) => {
  // Only show the last 5 transactions in the live feed
  const recent = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="absolute top-20 left-6 md:left-12 w-64 pointer-events-none z-30 hidden md:flex flex-col gap-3">
      <div className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] font-mono mb-2">LIVE ACTIVITY</div>
      
      <AnimatePresence initial={false}>
        {recent.map((t) => (
          <motion.div
            key={t._id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-surface/40 backdrop-blur-md border border-border rounded-xl p-3 flex flex-col font-mono relative overflow-hidden"
          >
            {/* Subtle left border glow based on type */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              t.type === 'CONTRIBUTION' ? 'bg-accent shadow-[0_0_10px_var(--accent)]' :
              t.type === 'PAYOUT' ? 'bg-success shadow-[0_0_10px_var(--success)]' :
              'bg-accent-highlight'
            }`} />
            
            <div className="flex justify-between items-center mb-1 pl-2">
              <span className="text-[10px] text-muted tracking-widest">{t.type}</span>
              <span className="text-white font-bold text-sm">{t.amount.toLocaleString()}</span>
            </div>
            
            <div className="text-xs text-text-secondary pl-2">
              {t.type === 'CONTRIBUTION' && (
                <span><span className="font-bold text-white">{t.senderId?.username}</span> joined pot</span>
              )}
              {t.type === 'PAYOUT' && (
                <span>pot awarded to <span className="font-bold text-white">{t.receiverId?.username}</span></span>
              )}
              {t.type === 'TRANSFER' && (
                <span><span className="font-bold text-white">{t.senderId?.username}</span> → {t.receiverId?.username}</span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
