import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useRoomStore } from '../stores/useRoomStore';
import { socket } from '../socket/socket';
import { toast } from 'react-toastify';
import { ArrowLeft, Trophy, ArrowRight } from 'lucide-react';
import { ConnectionOverlay } from '../components/shared/ConnectionOverlay';
import { motion } from 'framer-motion';

// HUD Components
import { SpatialPot } from '../components/hud/SpatialPot';
import { OrbitPlayerNode } from '../components/hud/OrbitPlayerNode';
import { ChipVisualizer } from '../components/hud/ChipVisualizer';

// Immersive Sheets
import { TransferSheet } from '../components/hud/TransferSheet';
import { ContributeSheet } from '../components/hud/ContributeSheet';
import { PayoutSheet } from '../components/hud/PayoutSheet';

export const Room = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    room, players, pot, connectionStatus,
    fetchRoomState, setRoomState, setPotState, leaveRoom, 
    startGame, fetchLedger, contributeToPot, transferChips, settlePot,
    setConnectionStatus, error, isLoading 
  } = useRoomStore();

  const [sheet, setSheet] = useState<'TRANSFER' | 'POT' | 'PAYOUT' | null>(null);

  useEffect(() => {
    if (roomCode) {
      fetchRoomState(roomCode).then(() => {
        fetchLedger(roomCode);
        socket.emit('room:join', roomCode);
        setConnectionStatus(socket.connected ? 'CONNECTED' : 'RECONNECTING');
      }).catch(() => {
        toast.error('FAILED TO LOAD ROOM STATE');
      });
    }

    const handleConnect = () => {
      setConnectionStatus('CONNECTED');
      if (roomCode) {
        socket.emit('room:join', roomCode);
        fetchRoomState(roomCode);
      }
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setConnectionStatus('DISCONNECTED');
      } else {
        setConnectionStatus('RECONNECTING');
      }
    };

    const handleRoomState = (data: any) => {
      setRoomState(data.room, data.players, data.pot);
    };

    const handleGameStarted = () => {
      if (roomCode) fetchLedger(roomCode);
    };

    const handleTransfer = () => {
      if (roomCode) fetchLedger(roomCode);
    };

    const handlePotUpdate = (potData: any) => {
      setPotState(potData);
      if (roomCode) fetchLedger(roomCode);
    };

    const handleError = (err: any) => toast.error(err.message || 'SYSTEM ERROR');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:state', handleRoomState);
    socket.on('room:gameStarted', handleGameStarted);
    socket.on('room:transfer', handleTransfer);
    socket.on('room:potUpdate', handlePotUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:state', handleRoomState);
      socket.off('room:gameStarted', handleGameStarted);
      socket.off('room:transfer', handleTransfer);
      socket.off('room:potUpdate', handlePotUpdate);
      socket.off('error', handleError);
    };
  }, [roomCode, fetchRoomState, setRoomState, setPotState, fetchLedger, setConnectionStatus]);

  const handleStartGame = async () => {
    if (roomCode) {
      try {
        await startGame(roomCode);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'FAILED TO START GAME');
      }
    }
  };

  const handleTransferChips = async (toUserId: string, amount: number) => {
    if (roomCode) await transferChips(roomCode, toUserId, amount);
  };

  const handleContribute = async (amount: number) => {
    if (roomCode) await contributeToPot(roomCode, amount);
  };

  const handleAwardPot = async (winnerUserId: string) => {
    if (roomCode) await settlePot(roomCode, [winnerUserId], false);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const isHost = room?.hostId?._id === user?._id;
  const currentPlayer = players.find(p => p.userId._id === user?._id);
  const otherPlayers = players.filter(p => p.userId._id !== user?._id);
  const maxPlayers = room?.settings?.playerLimit || 9;

  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text bg-background font-mono relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent-glow rounded-full blur-[150px] pointer-events-none opacity-20" />
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6 shadow-glow" />
        <p className="text-white font-bold tracking-widest uppercase text-xs">SYNCHRONIZING SYSTEM</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text bg-background font-mono p-4">
        <p className="text-danger mb-8 font-bold tracking-widest uppercase text-center text-lg">{error || 'ROOM NOT FOUND'}</p>
        <button onClick={() => navigate('/')} className="bg-transparent border border-danger text-danger rounded-full px-8 py-4 font-bold w-full max-w-xs uppercase tracking-widest text-sm transition-all hover:bg-danger/10">
          RETURN TO SYSTEM
        </button>
      </div>
    );
  }

  // --- WAITING ROOM ---
  if (room.state === 'WAITING') {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden">
        <ConnectionOverlay status={connectionStatus} />
        
        {/* Spatial Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent-glow rounded-full blur-[150px] pointer-events-none opacity-20" />

        <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black text-white font-mono tracking-widest mb-4 drop-shadow-[0_0_20px_var(--accent-glow)]">READY?</h1>
            <p className="text-accent text-sm md:text-lg tracking-[0.4em] uppercase font-bold font-mono">ROOM {room.roomCode}</p>
          </div>
          
          <div className="relative w-full max-w-2xl h-[300px] flex items-center justify-center">
            {/* Players arranged spatially */}
            {players.map((p, i) => {
              const angle = (i * 360) / maxPlayers;
              const radius = 120;
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  className="absolute top-1/2 left-1/2"
                  style={{ marginLeft: '-1.5rem', marginTop: '-1.5rem' }}
                >
                  <OrbitPlayerNode username={p.userId.username} balance={p.balance} status="online" isHost={room.hostId._id === p.userId._id} />
                </motion.div>
              );
            })}
            
            {/* Empty slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => {
              const idx = players.length + i;
              const angle = (idx * 360) / maxPlayers;
              const radius = 120;
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <motion.div
                  key={`empty-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3, x, y }}
                  className="absolute top-1/2 left-1/2"
                  style={{ marginLeft: '-1.5rem', marginTop: '-1.5rem' }}
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-muted flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-muted" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-16 text-center font-mono">
            <p className="text-muted tracking-[0.3em] font-bold text-xs uppercase mb-8">{players.length} / {maxPlayers} PLAYERS</p>
            {isHost && (
              <button onClick={handleStartGame} disabled={isLoading} className="bg-accent hover:bg-accent-bright text-white rounded-full px-12 py-5 font-bold tracking-[0.2em] uppercase transition-all shadow-glow hover:shadow-[0_0_40px_var(--accent-glow)] hover:-translate-y-1">
                START SESSION
              </button>
            )}
            {!isHost && (
              <div className="px-8 py-4 border border-border rounded-full text-muted tracking-widest text-xs uppercase bg-surface/50">
                AWAITING HOST...
              </div>
            )}
          </div>
        </div>

        <button onClick={handleLeave} className="absolute top-6 left-6 text-muted hover:text-white transition-colors p-2 rounded-full hover:bg-surface flex items-center justify-center z-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // --- LIVE SESSION ---
  return (
    <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden font-sans select-none">
      <ConnectionOverlay status={connectionStatus} />

      {/* Floating Header & Actions */}
      <div className="absolute top-6 left-6 md:left-12 z-40 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={handleLeave} className="text-muted hover:text-white transition-colors p-2 rounded-full hover:bg-surface/50 backdrop-blur-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col font-mono bg-surface/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-border">
            <span className="text-[9px] font-bold text-accent uppercase tracking-[0.3em]">LIVE SESSION</span>
            <span className="text-white text-xs font-bold uppercase tracking-widest">ROOM {room.roomCode}</span>
          </div>
        </div>

        {/* Action Buttons directly accessible */}
        <div className="flex flex-col items-start gap-3 pl-2">
          {isHost && (
            <button onClick={() => setSheet('PAYOUT')} className="flex items-center gap-3 bg-surface/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-success/30 hover:bg-success/20 transition-all group shadow-glow-sm">
              <Trophy className="w-4 h-4 text-success" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">PAYOUT POT</span>
            </button>
          )}
          
          <button onClick={() => setSheet('TRANSFER')} className="flex items-center gap-3 bg-surface/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-border hover:border-white/30 transition-all group">
            <ArrowRight className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">TRANSFER CHIPS</span>
          </button>
          
          <button onClick={() => setSheet('POT')} className="flex items-center gap-3 bg-surface/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-accent/30 hover:bg-accent/20 transition-all group shadow-glow-sm">
            <div className="w-4 h-4 rounded-full border-[1.5px] border-accent flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">ADD TO POT</span>
          </button>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[1200px] max-h-[1200px] bg-void pointer-events-none opacity-80" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-glow rounded-full blur-[150px] pointer-events-none opacity-10" />

      {/* Spatial HUD Canvas */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10 w-full max-w-[1400px] mx-auto p-4 pt-24 pb-32">
        
        {/* Center: The Pot and other players */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          <div className="w-full h-[400px] md:h-[500px] relative">
            <SpatialPot 
              amount={pot?.totalAmount || 0} 
              contributions={pot?.contributions?.map((c: any) => ({
                userId: c.userId?._id || c.userId,
                username: c.userId?.username || 'UNKNOWN',
                amount: c.amount
              })) || []} 
            />
          </div>

          {/* Player Grid (Non-orbiting layout for mobile/desktop flexibility) */}
          <div className="flex flex-wrap justify-center gap-8 mt-4 md:mt-8 relative z-20">
            {otherPlayers.map(p => (
              <OrbitPlayerNode key={p._id} username={p.userId.username} balance={p.balance} status={p.status as any} isHost={room.hostId._id === p.userId._id} />
            ))}
          </div>
        </div>

        {/* Current User Hero Element */}
        <div className="w-full md:w-[400px] mt-12 md:mt-0 flex flex-col items-center justify-end md:justify-center shrink-0">
          <div className="text-center mb-2 font-mono">
            <span className="text-xs font-bold text-muted uppercase tracking-[0.4em]">YOUR STACK</span>
          </div>
          <ChipVisualizer amount={currentPlayer?.balance || 0} />
        </div>

      </div>

      {/* Sheets */}
      {sheet === 'TRANSFER' && (
        <TransferSheet 
          players={players.map(p => ({ _id: p.userId._id, username: p.userId.username }))}
          currentUserId={currentPlayer?.userId._id}
          maxAmount={currentPlayer?.balance || 0}
          onTransfer={handleTransferChips}
          onClose={() => setSheet(null)}
        />
      )}
      
      {sheet === 'POT' && (
        <ContributeSheet 
          maxAmount={currentPlayer?.balance || 0}
          onContribute={handleContribute}
          onClose={() => setSheet(null)}
        />
      )}
      
      {sheet === 'PAYOUT' && isHost && (
        <PayoutSheet 
          players={players.map(p => ({ _id: p.userId._id, username: p.userId.username }))}
          potAmount={pot?.totalAmount || 0}
          onPayout={handleAwardPot}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
};
