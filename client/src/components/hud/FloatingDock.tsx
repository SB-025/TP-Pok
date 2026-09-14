import { motion } from 'framer-motion';
import { Home, Users, Activity, Settings } from 'lucide-react';

interface FloatingDockProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

export const FloatingDock = ({ activeTab, onTabSelect }: FloatingDockProps) => {
  const tabs = [
    { id: 'hud', icon: Home },
    { id: 'players', icon: Users },
    { id: 'activity', icon: Activity },
    { id: 'settings', icon: Settings }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-2 p-2 rounded-full bg-surface/60 backdrop-blur-xl border border-accent/20 shadow-glow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabSelect(t.id)}
            className={`relative p-4 rounded-full transition-all duration-300 ${
              activeTab === t.id ? 'text-white' : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === t.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-accent/20 rounded-full border border-accent/50 shadow-glow"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <t.icon className="w-5 h-5 relative z-10" />
          </button>
        ))}
      </div>
    </div>
  );
};
