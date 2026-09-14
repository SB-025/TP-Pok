import type { LedgerEntryData } from '../../stores/useRoomStore';
import { ArrowRight, DollarSign, Plus, Download, Info, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LedgerPanel = ({ ledger }: { ledger: LedgerEntryData[] }) => {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="bg-surface/50 backdrop-blur-md border border-border rounded-3xl p-8 flex flex-col h-[400px] font-sans shadow-xl">
        <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6 border-b border-border pb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" /> ACTIVITY
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-muted/40">
          <Activity className="w-8 h-8 mb-3" />
          <p className="font-bold tracking-widest text-xs uppercase font-mono">NO TRANSACTIONS YET</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/80 backdrop-blur-md border border-border rounded-3xl p-8 flex flex-col h-[400px] font-sans shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-2 h-full bg-accent/20" />
      <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-6 border-b border-border pb-4 flex items-center gap-2 relative z-10">
        <Activity className="w-4 h-4 text-accent" /> ACTIVITY TIMELINE
      </h3>
      <div className="flex-1 overflow-y-auto space-y-5 pr-4 custom-scrollbar relative z-10">
        <AnimatePresence>
          {ledger.map((entry, index) => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={entry._id} 
              className="flex gap-4 items-start relative group"
            >
              {/* Timeline Line */}
              <div className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-border group-last:hidden" />
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border shadow-glow-sm ${
                entry.type === 'STARTING_CHIPS' ? 'bg-surface-2 border-accent text-accent' :
                entry.type === 'TRANSFER' ? 'bg-surface-2 border-accent-bright text-accent-bright' :
                entry.type === 'POT_CONTRIBUTION' ? 'bg-surface-2 border-accent text-accent' :
                entry.type === 'POT_PAYOUT' ? 'bg-accent text-white border-accent' :
                'bg-surface-2 border-muted text-muted'
              }`}>
                {entry.type === 'STARTING_CHIPS' ? <Download className="w-4 h-4" /> :
                 entry.type === 'TRANSFER' ? <ArrowRight className="w-4 h-4" /> :
                 entry.type === 'POT_CONTRIBUTION' ? <Plus className="w-4 h-4" /> :
                 entry.type === 'POT_PAYOUT' ? <DollarSign className="w-4 h-4" /> :
                 <Info className="w-4 h-4" />}
              </div>
              
              <div className="flex-1 min-w-0 pt-1 pb-2">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-muted/70 text-[10px] font-bold tracking-widest font-mono">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="font-black text-white text-sm font-mono">
                    {entry.amount > 0 && entry.type !== 'POT_PAYOUT' ? '+' : ''}{entry.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest truncate font-mono">
                  {entry.type === 'STARTING_CHIPS' && 'STARTING CHIPS'}
                  {entry.type === 'TRANSFER' && <><span className="text-muted">{entry.fromUserId?.username}</span> → <span className="text-white">{entry.toUserId?.username}</span></>}
                  {entry.type === 'POT_CONTRIBUTION' && <><span className="text-muted">{entry.fromUserId?.username}</span> → <span className="text-accent">POT</span></>}
                  {entry.type === 'POT_PAYOUT' && <><span className="text-muted">POT →</span> <span className="text-white">{entry.toUserId?.username}</span></>}
                  {entry.type === 'POT_REFUND' && 'POT REFUNDED'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
