import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WithdrawalRequest } from '../types';
import { storage } from '../utils/browserUtils';

interface WithdrawalState {
  requests: WithdrawalRequest[];
  addRequest: (request: Omit<WithdrawalRequest, 'id' | 'timestamp' | 'status'>) => void;
  updateStatus: (
    id: string,
    status: WithdrawalRequest['status'],
    adminId: string,
    adminName: string,
    comment?: string
  ) => void;
  getRequestsByWorkerId: (workerId: string) => WithdrawalRequest[];
  getPendingRequests: () => WithdrawalRequest[];
  clearRequests: () => void;
}

export const useWithdrawalStore = create<WithdrawalState>()(
  persist(
    (set, get) => ({
      requests: [],
      
      addRequest: (request) =>
        set((state) => ({
          requests: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              status: 'pending',
              ...request,
            },
            ...state.requests,
          ],
        })),
      
      updateStatus: (id, status, adminId, adminName, comment) =>
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status,
                  adminComment: comment,
                  processedAt: new Date().toISOString(),
                  processedBy: {
                    id: adminId,
                    name: adminName,
                  },
                }
              : request
          ),
        })),
      
      getRequestsByWorkerId: (workerId) =>
        get().requests.filter((request) => request.workerId === workerId),
      
      getPendingRequests: () =>
        get().requests.filter((request) => request.status === 'pending'),
      
      clearRequests: () => set({ requests: [] }),
    }),
    {
      name: 'withdrawal-storage',
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