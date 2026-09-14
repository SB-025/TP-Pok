import { create } from 'zustand';
import { api } from '../services/api';
import { socket } from '../socket/socket';

interface Player {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  status: string;
  connectionState: string;
  balance: number;
}

interface RoomData {
  _id: string;
  roomCode: string;
  hostId: {
    _id: string;
    username: string;
  };
  state: string;
  settings: {
    playerLimit: number;
    startingChips: number;
  };
}

export interface PotData {
  _id: string;
  roomId: string;
  status: string;
  totalAmount: number;
  contributions: { userId: string; amount: number }[];
}


export interface LedgerEntryData {
  _id: string;
  type: string;
  amount: number;
  fromUserId?: { _id: string; username: string };
  toUserId?: { _id: string; username: string };
  createdAt: string;
}

interface RoomState {
  room: RoomData | null;
  players: Player[];
  pot: PotData | null;

  ledger: LedgerEntryData[];
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
  isLoading: boolean;
  error: string | null;
  createRoom: (settings: { playerLimit: number; startingChips: number }) => Promise<string>;
  joinRoom: (roomCode: string) => Promise<void>;
  fetchRoomState: (roomCode: string) => Promise<void>;
  setRoomState: (room: RoomData, players: Player[], pot?: PotData) => void;
  setPotState: (pot: PotData) => void;
  leaveRoom: () => void;
  clearError: () => void;
  startGame: (roomCode: string) => Promise<void>;
  transferChips: (roomCode: string, toUserId: string, amount: number) => Promise<void>;
  fetchLedger: (roomCode: string) => Promise<void>;
  contributeToPot: (roomCode: string, amount: number) => Promise<void>;
  settlePot: (roomCode: string, winnerUserIds: string[], isRefund: boolean) => Promise<void>;

  setConnectionStatus: (status: 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED') => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  players: [],
  pot: null,

  ledger: [],
  connectionStatus: 'CONNECTED',
  isLoading: false,
  error: null,

  createRoom: async (settings) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/rooms', settings);
      set({ isLoading: false });
      return data.roomCode;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to create room' });
      throw err;
    }
  },

  joinRoom: async (roomCode) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/rooms/join', { roomCode });
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to join room' });
      throw err;
    }
  },

  fetchRoomState: async (roomCode) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/rooms/${roomCode}`);
      set({ room: data.room, players: data.players, pot: data.pot, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to fetch room' });
      throw err;
    }
  },

  setRoomState: (room, players, pot) => {
    set((state) => ({ room, players, pot: pot !== undefined ? pot : state.pot }));
  },

  setPotState: (pot) => {
    set({ pot });
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  leaveRoom: () => {
    const { room } = get();
    if (room) {
      socket.emit('room:leave', room.roomCode);
    }
    set({ room: null, players: [], error: null });
  },

  clearError: () => set({ error: null }),

  startGame: async (roomCode) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/rooms/${roomCode}/start`);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to start game' });
      throw err;
    }
  },

  transferChips: async (roomCode, toUserId, amount) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/rooms/${roomCode}/transfer`, { toUserId, amount });
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to transfer chips' });
      throw err;
    }
  },

  fetchLedger: async (roomCode) => {
    try {
      const { data } = await api.get(`/rooms/${roomCode}/ledger`);
      set({ ledger: data });
    } catch (err: any) {
      console.error('Failed to fetch ledger', err);
    }
  },

  contributeToPot: async (roomCode, amount) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/rooms/${roomCode}/pot/contribute`, { amount });
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to contribute' });
      throw err;
    }
  },

  settlePot: async (roomCode, winnerUserIds, isRefund) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/rooms/${roomCode}/pot/settle`, { winnerUserIds, isRefund });
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to settle pot' });
      throw err;
    }
  },


}));
