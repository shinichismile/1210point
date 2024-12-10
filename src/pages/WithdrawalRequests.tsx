import React, { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useWithdrawalStore } from '../stores/withdrawalStore';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, X, AlertCircle } from 'lucide-react';
import type { WithdrawalRequest } from '../types';

const withdrawalSchema = z.object({
  amount: z.number()
    .min(1000, '最低出金額は1,000Pです')
    .max(1000000, '出金額が上限を超えています'),
  paymentMethod: z.enum(['bank', 'crypto', 'paypay'], {
    required_error: '出金方法を選択してください',
  }),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function WithdrawalRequests() {
  const user = useAuthStore(state => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');
  
  const {
    requests,
    addRequest,
    updateStatus,
    getRequestsByWorkerId,
    getPendingRequests,
  } = useWithdrawalStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 1000,
      paymentMethod: 'bank',
    },
  });

  const selectedPaymentMethod = watch('paymentMethod');

  const handleWithdraw = async (data: WithdrawalForm) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const profile = user.profile;
      if (!profile) {
        throw new Error('プロフィール情報が設定されていません');
      }

      let paymentDetails: WithdrawalRequest['paymentDetails'] = {};

      switch (data.paymentMethod) {
        case 'bank':
          if (!profile.bankInfo?.bankName || !profile.bankInfo?.accountNumber) {
            throw new Error('銀行口座情報を設定してください');
          }
          paymentDetails.bankInfo = profile.bankInfo;
          break;
        case 'crypto':
          if (!profile.cryptoAddress) {
            throw new Error('仮想通貨受け取りアドレスを設定してください');
          }
          paymentDetails.cryptoAddress = profile.cryptoAddress;
          break;
        case 'paypay':
          if (!profile.payPayId) {
            throw new Error('PayPay IDを設定してください');
          }
          paymentDetails.payPayId = profile.payPayId;
          break;
      }

      addRequest({
        workerId: user.id,
        workerName: user.name,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDetails,
      });

      toast.success('出金申請を受け付けました');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '出金申請に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = (request: WithdrawalRequest, newStatus: WithdrawalRequest['status']) => {
    if (!user) return;

    updateStatus(request.id, newStatus, user.id, user.name, adminComment);
    setSelectedRequest(null);
    setAdminComment('');
    toast.success('申請のステータスを更新しました');
  };

  const displayedRequests = user?.role === 'admin' ? getPendingRequests() : getRequestsByWorkerId(user?.id || '');

  const getPaymentMethodHelp = () => {
    if (!user?.profile) return '';

    switch (selectedPaymentMethod) {
      case 'bank':
        return user.profile.bankInfo ? 
          `${user.profile.bankInfo.bankName} ${user.profile.bankInfo.branchName} ${user.profile.bankInfo.accountType} ${user.profile.bankInfo.accountNumber}` :
          '銀行口座情報が未設定です';
      case 'crypto':
        return user.profile.cryptoAddress || '仮想通貨アドレスが未設定です';
      case 'paypay':
        return user.profile.payPayId || 'PayPay IDが未設定です';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {user?.role === 'worker' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">新規出金申請</h2>
          <form onSubmit={handleSubmit(handleWithdraw)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">出金金額</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    {...register('amount', { valueAsNumber: true })}
                    className="form-input pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">P</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="form-error">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">最低出金額: 1,000P</p>
              </div>

              <div>
                <label className="form-label">出金方法</label>
                <select
                  {...register('paymentMethod')}
                  className="form-input"
                >
                  <option value="bank">銀行振込</option>
                  <option value="crypto">仮想通貨</option>
                  <option value="paypay">PayPay</option>
                </select>
                {errors.paymentMethod && (
                  <p className="form-error">{errors.paymentMethod.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">{getPaymentMethodHelp()}</p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? '処理中...' : '出金を申請する'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {user?.role === 'admin' ? '出金申請一覧' : '出金履歴'}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申請日時
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請者
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出金方法
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 6 : 4} className="px-6 py-4 text-center text-gray-500">
                    {user?.role === 'admin' ? '新規の申請はありません' : '履歴はありません'}
                  </td>
                </tr>
              ) : (
                displayedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(request.timestamp), 'yyyy年M月d日 HH:mm', { locale: ja })}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.workerName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.amount.toLocaleString()} P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.paymentMethod === 'bank' && '銀行振込'}
                      {request.paymentMethod === 'crypto' && '仮想通貨'}
                      {request.paymentMethod === 'paypay' && 'PayPay'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : request.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {{
                          pending: '申請中',
                          processing: '処理中',
                          completed: '完了',
                          rejected: '却下',
                        }[request.status]}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <AlertCircle className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">出金申請の詳細</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">申請者</p>
                  <p className="mt-1">{selectedRequest.workerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">申請日時</p>
                  <p className="mt-1">
                    {format(new Date(selectedRequest.timestamp), 'yyyy年M月d日 HH:mm', { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">金額</p>
                  <p className="mt-1">{selectedRequest.amount.toLocaleString()} P</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">出金方法</p>
                  <p className="mt-1">
                    {selectedRequest.paymentMethod === 'bank' && '銀行振込'}
                    {selectedRequest.paymentMethod === 'crypto' && '仮想通貨'}
                    {selectedRequest.paymentMethod === 'paypay' && 'PayPay'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">出金先情報</p>
                {selectedRequest.paymentMethod === 'bank' && selectedRequest.paymentDetails.bankInfo && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>銀行名: {selectedRequest.paymentDetails.bankInfo.bankName}</p>
                    <p>支店名: {selectedRequest.paymentDetails.bankInfo.branchName}</p>
                    <p>口座種別: {selectedRequest.paymentDetails.bankInfo.accountType}</p>
                    <p>口座番号: {selectedRequest.paymentDetails.bankInfo.accountNumber}</p>
                    <p>口座名義: {selectedRequest.paymentDetails.bankInfo.accountHolder}</p>
                  </div>
                )}
                {selectedRequest.paymentMethod === 'crypto' && selectedRequest.paymentDetails.cryptoAddress && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>仮想通貨アドレス: {selectedRequest.paymentDetails.cryptoAddress}</p>
                  </div>
                )}
                {selectedRequest.paymentMethod === 'paypay' && selectedRequest.paymentDetails.payPayId && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>PayPay ID: {selectedRequest.paymentDetails.payPayId}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  管理者コメント
                </label>
                <textarea
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="form-input"
                  placeholder="承認・却下理由などを入力"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  閉じる
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest, 'rejected')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  却下
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest, 'completed')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  承認
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}