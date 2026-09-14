import { PlayerBalanceCard } from './PlayerBalanceCard';
import { PotDisplay } from './PotDisplay';
import { LedgerPanel } from '../shared/LedgerPanel';
import type { PotData, LedgerEntryData } from '../../stores/useRoomStore';
import { motion } from 'framer-motion';

interface ChipManagerProps {
  players: any[];
  pot: PotData | null;
  ledger: LedgerEntryData[];
  currentUserId: string;
  isHost: boolean;
  onTransfer: (toUserId: string, amount: number) => Promise<void>;
  onContribute: (amount: number) => Promise<void>;
  onAwardPot: (winnerUserId: string) => Promise<void>;
}

export const ChipManager = ({
  players, pot, ledger, currentUserId, isHost,
  onTransfer, onContribute, onAwardPot
}: ChipManagerProps) => {
  // Find current user's player data to feature at the top
  const currentUserPlayer = players.find(p => p.userId._id === currentUserId);
  const otherPlayers = players.filter(p => p.userId._id !== currentUserId);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col xl:flex-row gap-8 lg:gap-12 pb-24 lg:pb-8">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Hero Current User Balance */}
        {currentUserPlayer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 font-mono ml-2">YOUR BALANCE</h2>
            <PlayerBalanceCard 
              player={currentUserPlayer}
              isCurrentUser={true}
              onTransfer={onTransfer}
              onContribute={onContribute}
              allPlayers={players}
              isHero={true}
            />
          </motion.div>
        )}

        {/* Other Players List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-2 font-mono ml-2 mt-4">TABLE PLAYERS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherPlayers.map((player) => (
              <PlayerBalanceCard 
                key={player.userId._id}
                player={player}
                isCurrentUser={false}
                onTransfer={onTransfer}
                onContribute={onContribute}
                allPlayers={players}
              />
            ))}
          </div>
        </motion.div>

      </div>

      {/* Right Sidebar: Pot & Activity */}
      <div className="w-full xl:w-[450px] flex flex-col gap-8 shrink-0">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PotDisplay 
            pot={pot} 
            isHost={isHost} 
            onAward={onAwardPot} 
            allPlayers={players} 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1"
        >
          <LedgerPanel ledger={ledger} />
        </motion.div>
      </div>

    </div>
  );
};
