import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionOverlay = ({ status }: { status: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' }) => {
  return (
    <AnimatePresence>
      {status !== 'CONNECTED' && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none w-full max-w-sm px-4"
        >
          <div className="bg-surface-2/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 w-full flex items-center gap-4 relative overflow-hidden pointer-events-auto">
            <div className={`absolute top-0 left-0 w-1 h-full ${status === 'DISCONNECTED' ? 'bg-danger' : 'bg-accent'}`} />
            
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border">
              {status === 'DISCONNECTED' ? (
                <WifiOff className="w-5 h-5 text-danger" />
              ) : (
                <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-white uppercase tracking-widest font-mono truncate">
                {status === 'DISCONNECTED' ? 'SYSTEM DISCONNECTED' : 'RECONNECTING...'}
              </h2>
              <p className="text-muted text-[10px] tracking-widest uppercase mt-0.5 font-mono truncate">
                {status === 'DISCONNECTED' 
                  ? 'MANUAL REFRESH REQUIRED' 
                  : 'RESTORING CONNECTION'}
              </p>
            </div>
            
            {status === 'DISCONNECTED' && (
              <button 
                onClick={() => window.location.reload()}
                className="shrink-0 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/50 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
              >
                RELOAD
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
