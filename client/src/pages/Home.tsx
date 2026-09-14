import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useRoomStore } from '../stores/useRoomStore';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home = () => {
  const { user, logout } = useAuthStore();
  const { createRoom, joinRoom, error, isLoading } = useRoomStore();
  const navigate = useNavigate();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [playerLimit, setPlayerLimit] = useState(9);
  const [startingChips, setStartingChips] = useState(10000);
  const [activeTab, setActiveTab] = useState<'JOIN' | 'CREATE'>('JOIN');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = await createRoom({ playerLimit, startingChips });
      navigate(`/room/${code}`);
    } catch (_err) {}
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput) return;
    try {
      await joinRoom(roomCodeInput.toUpperCase());
      navigate(`/room/${roomCodeInput.toUpperCase()}`);
    } catch (_err) {}
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent-glow rounded-full blur-[150px] pointer-events-none opacity-20" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-highlight rounded-full blur-[120px] pointer-events-none opacity-10" />

      {/* Header */}
      <header className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 border border-accent/30 rounded-full flex items-center justify-center shadow-glow">
            <span className="text-white font-black font-mono text-xl leading-none">P</span>
          </div>
          <h1 className="text-xl font-bold tracking-[0.3em] text-white font-mono uppercase">
            POKAP
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-muted text-xs font-bold tracking-[0.2em] uppercase hidden md:flex items-center gap-3 font-mono">
            OPERATOR <span className="text-white bg-surface-2 px-3 py-1 rounded-full">{user?.username}</span>
          </span>
          <button 
            onClick={logout} 
            className="text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest font-mono flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>DISCONNECT</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-4xl mx-auto mt-12 md:mt-0">
        
        {/* Spatial Navigation */}
        <div className="flex gap-12 mb-16 font-mono text-sm tracking-[0.3em] uppercase">
          <button 
            onClick={() => setActiveTab('JOIN')}
            className={`transition-all duration-300 ${activeTab === 'JOIN' ? 'text-accent font-bold text-glow scale-110' : 'text-muted hover:text-white'}`}
          >
            JOIN
          </button>
          <button 
            onClick={() => setActiveTab('CREATE')}
            className={`transition-all duration-300 ${activeTab === 'CREATE' ? 'text-accent font-bold text-glow scale-110' : 'text-muted hover:text-white'}`}
          >
            CREATE
          </button>
        </div>

        {error && (
          <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} className="mb-8 text-danger text-xs font-bold uppercase tracking-widest border border-danger/30 rounded-full px-6 py-2 bg-danger/10 backdrop-blur-md">
            ERROR: {error}
          </motion.div>
        )}

        <div className="w-full relative min-h-[400px] flex items-center justify-center">
          {activeTab === 'JOIN' ? (
            <motion.form 
              key="join"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onSubmit={handleJoinRoom} 
              className="w-full max-w-md flex flex-col items-center gap-12"
            >
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono tracking-widest mb-4">JOIN SESSION</h2>
                <p className="text-muted text-sm tracking-widest uppercase font-mono">ENTER SECURE ROOM CODE</p>
              </div>

              <div className="w-full relative">
                <input 
                  type="text" 
                  maxLength={10} 
                  value={roomCodeInput} 
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 5);
                    setRoomCodeInput(sanitized);
                  }} 
                  placeholder="     " 
                  className={`w-full bg-transparent border-b-2 ${roomCodeInput.length === 5 ? 'border-accent text-glow shadow-glow-sm' : 'border-border'} pb-4 text-center font-black text-6xl tracking-[0.5em] focus:outline-none transition-all duration-500 text-white font-mono placeholder:text-muted/10 uppercase`}
                />
              </div>

              <button 
                disabled={isLoading || roomCodeInput.length < 5} 
                type="submit" 
                className="group relative overflow-hidden bg-transparent border border-accent/50 text-accent hover:text-white hover:bg-accent/10 hover:border-accent disabled:opacity-30 disabled:hover:bg-transparent rounded-full px-12 py-4 font-bold tracking-widest uppercase transition-all duration-500 font-mono"
              >
                <span className="relative z-10 flex items-center gap-3">
                  INITIATE CONNECTION
                </span>
                <div className="absolute inset-0 bg-accent-glow opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="create"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onSubmit={handleCreateRoom} 
              className="w-full max-w-lg flex flex-col items-center gap-12"
            >
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono tracking-widest mb-4">CREATE SESSION</h2>
                <p className="text-muted text-sm tracking-widest uppercase font-mono">INITIALIZE NEW EVENT</p>
              </div>

              <div className="flex flex-col md:flex-row gap-12 w-full justify-center text-center">
                 <div className="flex flex-col items-center gap-4 group">
                   <label className="text-xs font-bold text-accent uppercase tracking-[0.2em] font-mono group-hover:text-glow transition-all">STARTING CHIPS</label>
                   <input 
                     type="number" min="100" step="100"
                     value={startingChips} 
                     onChange={(e) => setStartingChips(parseInt(e.target.value))} 
                     className="w-32 bg-transparent text-4xl font-black text-center text-white font-mono focus:outline-none border-b-2 border-transparent focus:border-accent pb-2 transition-all" 
                   />
                 </div>
                 <div className="flex flex-col items-center gap-4 group">
                   <label className="text-xs font-bold text-accent uppercase tracking-[0.2em] font-mono group-hover:text-glow transition-all">PLAYERS MAX</label>
                   <input 
                     type="number" min="2" max="10" 
                     value={playerLimit} 
                     onChange={(e) => setPlayerLimit(parseInt(e.target.value))} 
                     className="w-24 bg-transparent text-4xl font-black text-center text-white font-mono focus:outline-none border-b-2 border-transparent focus:border-accent pb-2 transition-all" 
                   />
                 </div>
              </div>
              
              <button 
                disabled={isLoading} 
                type="submit" 
                className="group relative overflow-hidden bg-accent hover:bg-accent-bright text-white rounded-full px-12 py-5 font-bold text-lg tracking-widest uppercase transition-all duration-500 font-mono shadow-glow hover:shadow-[0_0_40px_var(--accent-glow)] hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-3">
                  LAUNCH EVENT
                </span>
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
};

