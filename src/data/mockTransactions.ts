/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, TransactionStatus } from '../types';
import { dbService, DBPayment } from '../lib/supabase';

// Map DBPayment to Transaction type
function mapDBPaymentToTransaction(p: DBPayment): Transaction {
  let mappedStatus: TransactionStatus = 'pending';
  if (p.payment_status === 'paid') mappedStatus = 'paid';
  if (p.payment_status === 'failed' || p.payment_status === 'cancelled') mappedStatus = 'failed';
  if (p.payment_status === 'refunded') mappedStatus = 'refunded';

  let mappedSettlement: Transaction['settlementStatus'] = 'unsettled';
  if (p.settlement_status === 'settled') mappedSettlement = 'settled';
  if (p.settlement_status === 'awaiting settlement') mappedSettlement = 'unsettled';
  if (p.settlement_status === 'settlement failed') mappedSettlement = 'unsettled';
  if (p.settlement_status === 'manual review') mappedSettlement = 'processing';

  return {
    id: p.id,
    clientName: p.client_name,
    email: p.client_email,
    reference: p.payment_reference,
    amount: p.amount,
    currency: p.currency,
    status: mappedStatus,
    date: p.created_at,
    settlementStatus: mappedSettlement,
    settlementTxHash: p.provider_payment_id || undefined
  };
}

export function getTransactions(): Transaction[] {
  // Sync reading
  let stored = null;
  try {
    stored = typeof window !== 'undefined' ? localStorage.getItem('ticketone_db_payments_v2') : null;
  } catch (e) {
    console.warn("localStorage.getItem blocked, using in-memory:", e);
  }
  if (!stored) {
    // Generate placeholder items
    return [];
  }
  try {
    const list: DBPayment[] = JSON.parse(stored);
    return list.map(mapDBPaymentToTransaction);
  } catch (e) {
    console.warn("Parsing payments cache error, fallback to empty list:", e);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  // Overridden as database uses real unified DBPayment models
}

export function addNewTransaction(newTx: Omit<Transaction, 'id' | 'date' | 'settlementStatus' | 'settlementTxHash'>): Transaction {
  const dateStr = new Date().toISOString();
  
  // High-value transactions settle with proper status mapping
  const payment_status = newTx.status as DBPayment['payment_status'];
  const settlement_status = (newTx.status === 'paid' ? 'settled' : 'awaiting settlement') as DBPayment['settlement_status'];

  const pModel: Omit<DBPayment, 'id' | 'created_at' | 'updated_at'> = {
    client_name: newTx.clientName,
    client_email: newTx.email,
    client_phone: '',
    payment_reference: newTx.reference,
    invoice_reference: newTx.reference,
    amount: newTx.amount,
    currency: newTx.currency,
    payment_provider: 'Ticketone Node Secure',
    provider_payment_id: `ch_` + Math.random().toString(36).substring(2, 12),
    provider_checkout_url: `https://checkout.ticketone.advisory/pay/` + Math.random().toString(36).substring(2, 6),
    payment_status,
    settlement_status,
    payment_method: 'Premium Card Hold',
    description: 'Advisory Retainer Fee Settlement'
  };

  // Trigger non-blocking async save
  dbService.addPayment(pModel).catch(e => {
    console.error("Async addPayment database saving failed:", e);
  });

  // Return mapped immediate Transaction
  const mapped: Transaction = {
    id: `TX-${Math.floor(10000 + Math.random() * 90000)}-${newTx.clientName.substring(0, 2).toUpperCase()}`,
    clientName: newTx.clientName,
    email: newTx.email,
    reference: newTx.reference,
    amount: newTx.amount,
    currency: newTx.currency,
    status: newTx.status,
    date: dateStr,
    settlementStatus: newTx.status === 'paid' ? 'settled' : 'unsettled',
    settlementTxHash: pModel.provider_payment_id
  };

  return mapped;
}

export function updateTransactionStatus(id: string, status: Transaction['status']): Transaction[] {
  // Update back-office status directly
  const payment_status = status as DBPayment['payment_status'];
  const settlement_status = (status === 'paid' ? 'settled' : 'awaiting settlement') as DBPayment['settlement_status'];
  
  dbService.updatePaymentStatus(id, payment_status, settlement_status).catch(e => {
    console.error("Async update status database saving failed:", e);
  });

  return getTransactions();
}
