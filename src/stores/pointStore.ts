import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PointTransaction } from '../types';
import { storage } from '../utils/browserUtils';

interface PointState {
  transactions: PointTransaction[];
  addTransaction: (transaction: Omit<PointTransaction, 'id' | 'timestamp'>) => void;
  clearTransactions: () => void;
}

export const usePointStore = create<PointState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              ...transaction,
            },
            ...state.transactions,
          ],
        })),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'point-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.get(name);
          return value === null ? null : value;
        },
        setItem: (name, value) => {
          storage.set(name, value);
        },
        removeItem: (name) => {
          storage.remove(name);
        },
      })),
      version: 1,
    }
  )
);