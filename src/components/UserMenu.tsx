import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function UserMenu() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <img
          className="h-9 w-9 rounded-full ring-2 ring-indigo-600/20"
          src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
          alt="プロフィール"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          <span className="text-xs text-gray-500">
            {user?.role === 'admin' ? '管理者' : 'ワーカー'}
          </span>
        </div>
      </div>
      <button
        onClick={logout}
        className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md
                   text-sm font-medium text-gray-700 bg-white hover:bg-red-50 
                   hover:text-red-600 hover:border-red-200 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        type="button"
      >
        <LogOut className="h-4 w-4 mr-2" />
        ログアウト
      </button>
    </div>
  );
}