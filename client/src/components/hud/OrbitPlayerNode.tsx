import { motion } from 'framer-motion';

interface OrbitPlayerNodeProps {
  username: string;
  balance: number;
  status: 'online' | 'offline';
  isHost?: boolean;
}

export const OrbitPlayerNode = ({ username, balance, status, isHost }: OrbitPlayerNodeProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center group relative"
    >
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-accent-glow rounded-full blur-[20px] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
      
      <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-glow-sm relative z-10 ${status === 'online' ? 'border-accent/50 bg-surface/80' : 'border-border bg-surface-2 opacity-50'}`}>
        <span className="font-mono font-black text-lg text-white">
          {username.substring(0, 2).toUpperCase()}
        </span>
        
        {/* Status Dot */}
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${status === 'online' ? 'bg-success shadow-[0_0_10px_var(--success)]' : 'bg-muted'}`} />
        
        {isHost && (
          <div className="absolute -top-2 bg-accent text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-white shadow-glow">
            HOST
          </div>
        )}
      </div>

      <div className="mt-3 text-center z-10">
        <div className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono mb-0.5">
          {username}
        </div>
        <div className="font-mono font-bold text-sm text-white">
          {balance.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
};
