import { motion, AnimatePresence } from 'framer-motion';

interface Contribution {
  userId: string;
  username: string;
  amount: number;
}

interface SpatialPotProps {
  amount: number;
  contributions: Contribution[];
}

export const SpatialPot = ({ amount, contributions }: SpatialPotProps) => {
  return (
    <div className="relative flex items-center justify-center w-full h-[400px]">
      {/* Central Pot Object - Casino Table Shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <motion.div 
          key={`pot-${amount}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-[280px] md:w-[420px] h-[140px] md:h-[200px] rounded-[100px] border-[4px] border-border/80 flex flex-col items-center justify-center bg-surface-2/60 backdrop-blur-md shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Inner Betting Line */}
          <div className="absolute inset-4 md:inset-6 rounded-[100px] border-[1.5px] border-accent/40 opacity-70" />
          
          {/* Subtle felt texture/glow */}
          <div className="absolute inset-0 bg-accent-glow blur-[80px] opacity-10 pointer-events-none" />
          
          <div className="text-center relative z-10">
            <div className="text-accent text-[10px] tracking-[0.4em] font-bold uppercase font-mono mb-1 md:mb-2">MAIN POT</div>
            <div className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter drop-shadow-xl text-glow">
              {amount.toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Orbiting Contributions */}
      <AnimatePresence>
        {contributions.length > 0 && contributions.map((c, i) => {
          const angle = (i * 360) / contributions.length;
          
          // Elliptical math for the wide table
          const radiusX = window.innerWidth < 768 ? 160 : 250;
          const radiusY = window.innerWidth < 768 ? 100 : 140;
          
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radiusX;
          const y = Math.sin(rad) * radiusY;

          return (
            <motion.div
              key={c.userId}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x, y }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-1/2 left-1/2 flex flex-col items-center z-20"
              style={{ marginLeft: '-3rem', marginTop: '-1.5rem' }}
            >
              <div className="flex flex-col items-center group">
                <span className="text-[10px] font-bold text-muted uppercase font-mono tracking-widest bg-background/80 px-2 rounded-full mb-1">{c.username}</span>
                <div className="bg-surface border border-accent/40 px-4 py-1.5 rounded-full text-white font-mono font-black text-xs shadow-[0_0_15px_var(--accent-glow)]">
                  +{c.amount.toLocaleString()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
