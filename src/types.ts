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

export interface PaymentRequest {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  expiryDate?: string;
  status: "draft" | "sent" | "opened" | "unpaid" | "pending_payment" | "paid" | "failed" | "expired" | "cancelled";
  paymentLink: string;
  createdAt: string;
  openedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
}
