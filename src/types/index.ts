export interface User {
  id: string;
  loginId: string;
  name: string;
  email: string;
  role: 'worker' | 'admin';
  points: number;
  avatarUrl?: string;
  profile?: UserProfile;
  lastLogin?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  totalEarned: number;
}

export interface UserProfile {
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  bankInfo?: {
    bankName: string;
    branchName: string;
    accountType: '普通' | '当座';
    accountNumber: string;
    accountHolder: string;
  };
  cryptoAddress?: string;
  payPayId?: string;
}

export interface PointTransaction {
  id: string;
  workerId: string;
  workerName: string;
  adminId: string;
  adminName: string;
  amount: number;
  type: 'add' | 'subtract';
  timestamp: string;
  reason: string;
}

export interface WithdrawalRequest {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  paymentMethod: 'bank' | 'crypto' | 'paypay';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  timestamp: string;
  paymentDetails: {
    bankInfo?: {
      bankName: string;
      branchName: string;
      accountType: string;
      accountNumber: string;
      accountHolder: string;
    };
    cryptoAddress?: string;
    payPayId?: string;
  };
  adminComment?: string;
  processedAt?: string;
  processedBy?: {
    id: string;
    name: string;
  };
}

export interface StorageOptions {
  expires?: number;
}

export interface AuthCredentials {
  [key: string]: string;
}