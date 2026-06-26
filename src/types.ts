/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  clientName: string;
  email: string;
  reference: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  date: string;
  settlementStatus: 'settled' | 'processing' | 'unsettled';
  settlementTxHash?: string;
}

export interface DashboardStats {
  totalVolume: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  averageAmount: number;
}
