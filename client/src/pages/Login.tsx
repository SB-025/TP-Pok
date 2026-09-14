import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import { motion } from 'framer-motion';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, { _id: data._id, username: data.username });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-accent-glow rounded-full blur-[150px] pointer-events-none opacity-20" />

      {/* Header */}
      <header className="flex justify-between items-center relative z-10 w-full">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 border border-accent/30 rounded-full flex items-center justify-center shadow-glow">
            <span className="text-white font-black font-mono text-xl leading-none">P</span>
          </div>
          <h1 className="text-xl font-bold tracking-[0.3em] text-white font-mono uppercase">
            POKAP
          </h1>
        </div>
        <div className="text-accent text-xs font-bold tracking-[0.2em] uppercase font-mono bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
          SYSTEM_AUTH
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center relative z-10 w-full mt-12 md:mt-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md flex flex-col items-center gap-12"
        >
          
          <div className="text-center">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-4 font-mono">ACCESS SYSTEM</h2>
            <p className="text-muted text-sm font-mono tracking-widest uppercase">ENTER CREDENTIALS</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger text-xs font-bold uppercase tracking-widest border border-danger/30 rounded-full px-6 py-2 bg-danger/10 text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <form className="w-full flex flex-col gap-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-center gap-3 group">
                <label className="text-xs font-bold text-accent uppercase tracking-[0.2em] font-mono group-focus-within:text-glow transition-all">USERNAME</label>
                <input
                  type="text"
                  required
                  className="w-full bg-transparent text-2xl md:text-3xl font-black text-center text-white font-mono focus:outline-none border-b-2 border-border focus:border-accent pb-3 transition-all placeholder:text-muted/20"
                  placeholder="ID_STRING"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <label className="text-xs font-bold text-accent uppercase tracking-[0.2em] font-mono group-focus-within:text-glow transition-all">PASSWORD</label>
                <input
                  type="password"
                  required
                  className="w-full bg-transparent text-2xl md:text-3xl font-black text-center text-white font-mono focus:outline-none border-b-2 border-border focus:border-accent pb-3 transition-all placeholder:text-muted/20"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative overflow-hidden bg-accent hover:bg-accent-bright text-white rounded-full py-5 w-full font-bold text-lg tracking-[0.2em] uppercase transition-all duration-500 font-mono shadow-glow hover:shadow-[0_0_40px_var(--accent-glow)] hover:-translate-y-1 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE'}
              </span>
            </button>
          </form>
          
          <div className="text-center font-mono text-xs text-muted tracking-widest uppercase">
            NO ACCESS? <Link to="/register" className="text-white hover:text-accent transition-colors ml-2 font-bold border-b border-transparent hover:border-accent">REGISTER</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
