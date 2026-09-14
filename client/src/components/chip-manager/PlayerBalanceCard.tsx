import { useState } from 'react';
import { TransferModal } from './TransferModal';
import { ContributeModal } from './ContributeModal';

interface PlayerBalanceCardProps {
  player: any;
  isCurrentUser: boolean;
  onTransfer: (toUserId: string, amount: number) => Promise<void>;
  onContribute: (amount: number) => Promise<void>;
  allPlayers: any[];
  isHero?: boolean;
}

export const PlayerBalanceCard = ({ player, isCurrentUser, onTransfer, onContribute, allPlayers, isHero = false }: PlayerBalanceCardProps) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  if (isHero) {
    return (
      <>
        <div className="bg-surface/80 backdrop-blur-md border border-border rounded-3xl p-8 relative overflow-hidden group shadow-xl">
          <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-accent-glow rounded-full blur-[80px] pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-700" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full shadow-glow-sm ${player.connectionState === 'CONNECTED' ? 'bg-success' : 'bg-danger'}`} title={player.connectionState} />
                <h3 className="font-bold text-lg text-white uppercase tracking-widest font-sans">
                  {player.userId.username}
                </h3>
              </div>
              <p className={`text-6xl md:text-7xl font-black font-mono tracking-tight ${player.balance > 0 ? 'text-white' : 'text-danger'}`}>
                {player.balance.toLocaleString()} 
              </p>
              <span className="text-sm font-bold text-accent uppercase tracking-widest font-mono mt-1 block">CHIPS</span>
            </div>
            
            {isCurrentUser && player.balance > 0 && (
              <div className="flex sm:flex-col gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <button 
                  onClick={() => setIsContributeModalOpen(true)}
                  className="flex-1 sm:flex-none bg-accent hover:bg-accent-bright text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-glow hover:shadow-[0_0_20px_var(--accent-glow)] hover:-translate-y-0.5"
                >
                  ADD TO POT
                </button>
                <button 
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex-1 sm:flex-none bg-surface-2 border border-border hover:border-accent hover:bg-surface-2/80 text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                >
                  TRANSFER
                </button>
              </div>
            )}
          </div>
        </div>

        <TransferModal 
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onTransfer={onTransfer}
          allPlayers={allPlayers}
          currentUserBalance={player.balance}
          currentUserId={player.userId._id}
        />
        <ContributeModal 
          isOpen={isContributeModalOpen}
          onClose={() => setIsContributeModalOpen(false)}
          onContribute={onContribute}
          currentUserBalance={player.balance}
        />
      </>
    );
  }

  // Standard List View
  return (
    <div className={`p-5 rounded-2xl border transition-all ${isCurrentUser ? 'bg-surface-2/50 border-accent/30' : 'bg-surface/50 border-border hover:border-border-strong hover:bg-surface'}`}>
      <div className="flex justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${player.connectionState === 'CONNECTED' ? 'bg-success' : 'bg-danger'}`} title={player.connectionState} />
            <h3 className="font-bold text-sm text-text-secondary uppercase tracking-widest font-sans truncate max-w-[120px] sm:max-w-[200px]">
              {player.userId.username}
            </h3>
          </div>
          <p className={`text-2xl font-black font-mono ${player.balance > 0 ? 'text-white' : 'text-danger'}`}>
            {player.balance.toLocaleString()} <span className="text-[10px] font-bold text-muted tracking-widest">CHIPS</span>
          </p>
        </div>
      </div>
    </div>
  );
};
