import { Outlet, Link, useLocation } from 'react-router-dom';
import { TrendingUp, Wallet, History, FileBarChart2, UserCircle, Users, Bell } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useWithdrawalStore } from '../stores/withdrawalStore';
import clsx from 'clsx';
import UserMenu from './UserMenu';

export default function Layout() {
  const location = useLocation();
  const { user, customIcon } = useAuthStore();
  const pendingRequests = useWithdrawalStore((state) => 
    state.requests.filter((r) => r.status === 'pending').length
  );

  const navigation = [
    { name: 'ダッシュボード', href: user?.role === 'admin' ? '/admin' : '/', icon: TrendingUp },
    { name: '出金申請', href: '/withdrawals', icon: Wallet },
    { name: 'ポイント履歴', href: '/history', icon: History },
    { name: 'レポート', href: '/reports', icon: FileBarChart2 },
    { name: 'プロフィール', href: '/profile', icon: UserCircle },
    ...(user?.role === 'admin' ? [{ name: 'ワーカー一覧', href: '/workers', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <nav className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              {customIcon ? (
                <img 
                  src={customIcon} 
                  alt="カスタムアイコン" 
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              )}
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                pointmoney
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && pendingRequests > 0 && (
                <Link
                  to="/withdrawals"
                  className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {pendingRequests}
                  </span>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                location.pathname === item.href
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.name}
            </Link>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}