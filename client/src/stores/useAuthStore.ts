import { create } from 'zustand';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

interface User {
  _id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: sessionStorage.getItem('token'),
  isAuthenticated: !!sessionStorage.getItem('token'),
  isLoading: true,

  login: (token, user) => {
    sessionStorage.setItem('token', token);
    connectSocket(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      connectSocket(token);
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch (_error) {
      sessionStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
