import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ChipVisualizerProps {
  amount: number;
}

export const ChipVisualizer = ({ amount }: ChipVisualizerProps) => {
  const [prevAmount, setPrevAmount] = useState(amount);

  useEffect(() => {
    if (amount !== prevAmount) {
      setPrevAmount(amount);
    }
  }, [amount, prevAmount]);

  // Determine how many visual rings to show based on amount magnitude
  const rings = Math.min(Math.max(Math.floor(Math.log10(amount || 1)), 1), 6);

  return (
    <div className="relative flex flex-col items-center justify-center">

      <div className="text-center relative z-10 mt-8 mb-4">
        <div className="relative flex items-center justify-center">
          <motion.div 
            key={amount}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter text-glow"
          >
            {amount.toLocaleString()}
          </motion.div>
          
          {/* Removed Floating Diff Indicator as requested */}
        </div>
        <div className="text-accent text-sm tracking-[0.3em] uppercase font-bold mt-2 font-mono">CHIPS</div>
      </div>

      {/* Abstract Stack Visualization */}
      <div className="relative w-48 h-12 flex flex-col items-center justify-end perspective-1000 mt-4">
        {Array.from({ length: rings }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: -i * 8, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="absolute w-32 h-8 rounded-[50%] border-2 border-accent/40 bg-surface/50 backdrop-blur-sm shadow-[0_0_15px_var(--accent-glow)]"
            style={{ 
              zIndex: 10 - i,
              width: `${100 - (i * 10)}%`
            }}
          />
        ))}
      </div>
    </div>
  );
};
