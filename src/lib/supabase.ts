/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Transaction, TransactionStatus, PaymentRequest } from '../types';

// Environment variables for Supabase integration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize real Supabase client if credentials are provided, otherwise null.
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Dual-Engine Local Storage cache system to ensure a fully functional preview
// but prepared to swap instantly to live tables when Supabase parameters are set.
const STORAGE_PAYMENTS_KEY = 'ticketone_db_payments_v2';
const STORAGE_REQUESTS_KEY = 'ticketone_db_requests_v2';
const STORAGE_NOTES_KEY = 'ticketone_db_notes_v2';
const STORAGE_TICKETONE_REQUESTS_KEY = 'ticketone_payment_requests';

export interface DBPayment {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  payment_reference: string;
  invoice_reference?: string;
  amount: number;
  currency: string;
  payment_provider: string;
  provider_payment_id?: string;
  provider_checkout_url?: string;
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  settlement_status: 'awaiting settlement' | 'settled' | 'settlement failed' | 'manual review';
  payment_method: string;
  description?: string;
  created_at: string;
  paid_at?: string;
  settled_at?: string;
  updated_at: string;
  settlement_asset?: string;
  settlement_network?: string;
  settlement_label?: string;
  settlement_address?: string;
}

export interface DBPaymentRequest {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  payment_link: string;
  status: 'unpaid' | 'paid' | 'expired' | 'cancelled';
  expires_at?: string;
  created_at: string;
  paid_at?: string;
}

export interface DBAdminNote {
  id: string;
  payment_id: string;
  admin_name: string;
  note: string;
  created_at: string;
}

// Default Seed Data
const DEFAULT_PAYMENTS: DBPayment[] = [
  {
    id: "94021000-0000-0000-0000-000000000001",
    client_name: "Arthur Wellesley",
    client_email: "a.wellesley@paramountgp.co",
    client_phone: "+44 7911 123456",
    payment_reference: "INV-2026-089A",
    invoice_reference: "INV-2026-089A",
    amount: 35000,
    currency: "USD",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2L8k",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/94021",
    payment_status: "paid",
    settlement_status: "settled",
    payment_method: "Premium Card Hold",
    description: "Executive Tax Advisory Retainer - Q2",
    created_at: "2026-06-22T14:30:00Z",
    paid_at: "2026-06-22T14:35:00Z",
    settled_at: "2026-06-22T15:00:00Z",
    updated_at: "2026-06-22T15:00:00Z"
  },
  {
    id: "48902000-0000-0000-0000-000000000002",
    client_name: "Dame Beatrice Vance",
    client_email: "beatrice@vanceadvisory.com",
    client_phone: "+44 20 7946 0958",
    payment_reference: "INV-2026-091B",
    invoice_reference: "INV-2026-091B",
    amount: 15000,
    currency: "GBP",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2L9x",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/48902",
    payment_status: "paid",
    settlement_status: "settled",
    payment_method: "Bank Wire Transfer",
    description: "Sovereign Inheritance Estate Audit Plan",
    created_at: "2026-06-20T09:15:00Z",
    paid_at: "2026-06-20T09:30:00Z",
    settled_at: "2026-06-20T11:45:00Z",
    updated_at: "2026-06-20T11:45:00Z"
  },
  {
    id: "11029000-0000-0000-0000-000000000003",
    client_name: "Dr. Julian Sterling",
    client_email: "j.sterling@biotechventures.eu",
    client_phone: "+49 89 2424 2424",
    payment_reference: "INV-2026-102C",
    invoice_reference: "INV-2026-102C",
    amount: 50000,
    currency: "EUR",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2M0y",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/11029",
    payment_status: "paid",
    settlement_status: "settled",
    payment_method: "Premium Card Hold",
    description: "Biotech Mergers & Acquisitions Advisory fee",
    created_at: "2026-06-19T17:45:00Z",
    paid_at: "2026-06-19T17:50:00Z",
    settled_at: "2026-06-19T19:20:00Z",
    updated_at: "2026-06-19T19:20:00Z"
  },
  {
    id: "87201000-0000-0000-0000-000000000004",
    client_name: "Marcus Vance",
    client_email: "marcus.vance@vanceadvisory.com",
    client_phone: "+1 (555) 019-2834",
    payment_reference: "INV-2026-104A",
    invoice_reference: "INV-2026-104A",
    amount: 7500,
    currency: "USD",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2N1z",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/87201",
    payment_status: "pending",
    settlement_status: "awaiting settlement",
    payment_method: "Premium Card Hold",
    description: "Asset Management Consultation Retainer",
    created_at: "2026-06-23T05:20:00Z",
    updated_at: "2026-06-23T05:20:00Z"
  },
  {
    id: "30911000-0000-0000-0000-000000000005",
    client_name: "Sofia Lindstrom",
    client_email: "lindstrom@heritage-trusts.ch",
    client_phone: "+41 44 123 4567",
    payment_reference: "INV-2026-105F",
    invoice_reference: "INV-2026-105F",
    amount: 120000,
    currency: "CHF",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2O2w",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/30911",
    payment_status: "paid",
    settlement_status: "settled",
    payment_method: "Bank Wire Transfer",
    description: "Private Placement Escrow Service Retainer",
    created_at: "2026-06-15T11:10:00Z",
    paid_at: "2026-06-15T11:15:00Z",
    settled_at: "2026-06-15T13:00:00Z",
    updated_at: "2026-06-15T13:00:00Z"
  },
  {
    id: "20288000-0000-0000-0000-000000000006",
    client_name: "Helena Rostova",
    client_email: "h.rostova@rostova-partners.com",
    client_phone: "+357 25 123456",
    payment_reference: "INV-2026-107X",
    invoice_reference: "INV-2026-107X",
    amount: 25000,
    currency: "USD",
    payment_provider: "Ticketone Node Secure",
    provider_payment_id: "ch_3M2h6cK9Z0d2P3q",
    provider_checkout_url: "https://checkout.ticketone.advisory/pay/20288",
    payment_status: "failed",
    settlement_status: "settlement failed",
    payment_method: "Premium Card Hold",
    description: "Cyprus Offshore Structuring Legal Retainer",
    created_at: "2026-06-21T18:05:00Z",
    updated_at: "2026-06-21T18:05:00Z"
  }
];

const DEFAULT_REQUESTS: DBPaymentRequest[] = [
  {
    id: "req_1",
    client_name: "Count Philippe de Montaigne",
    client_email: "montaigne@bordeauxadvisors.com",
    amount: 45000,
    currency: "EUR",
    reference: "INV-2026-112B",
    description: "Structured Sovereign Bond Portfolios Placement Setup Fee",
    payment_link: "https://ticketone.advisory/pay/INV-2026-112B",
    status: "unpaid",
    expires_at: "2026-07-30T10:00:00Z",
    created_at: "2026-06-22T09:00:00Z"
  },
  {
    id: "req_2",
    client_name: "Elena Petrova",
    client_email: "petrova@vienna-holdings.at",
    amount: 15000,
    currency: "EUR",
    reference: "INV-2026-115C",
    description: "Vienna Real Estate Escrow Guarantee Advisory Retainer",
    payment_link: "https://ticketone.advisory/pay/INV-2026-115C",
    status: "paid",
    expires_at: "2026-06-24T18:00:00Z",
    created_at: "2026-06-21T10:30:00Z",
    paid_at: "2026-06-22T12:15:00Z"
  }
];

export const DEFAULT_NEW_REQUESTS: PaymentRequest[] = [
  {
    id: "req_new_1",
    token: "e93ab7e2-127b-40f4-8c8f-9a1b80c39f1c",
    clientName: "Count Philippe de Montaigne",
    clientEmail: "montaigne@bordeauxadvisors.com",
    amount: 45000,
    currency: "EUR",
    reference: "TCK-2026-0001",
    description: "Structured Sovereign Bond Portfolios Placement Setup Fee",
    paymentLink: `${window.location.origin}/pay/e93ab7e2-127b-40f4-8c8f-9a1b80c39f1c`,
    status: "sent",
    expiryDate: "2026-07-30",
    createdAt: "2026-06-22T09:00:00Z"
  },
  {
    id: "req_new_2",
    token: "a84f32c9-635e-49b8-aa34-129b68c9832a",
    clientName: "Elena Petrova",
    clientEmail: "petrova@vienna-holdings.at",
    amount: 15000,
    currency: "EUR",
    reference: "TCK-2026-0002",
    description: "Vienna Real Estate Escrow Guarantee Advisory Retainer",
    paymentLink: `${window.location.origin}/pay/a84f32c9-635e-49b8-aa34-129b68c9832a`,
    status: "paid",
    expiryDate: "2026-06-24",
    createdAt: "2026-06-21T10:30:00Z",
    paidAt: "2026-06-22T12:15:00Z"
  }
];

const DEFAULT_NOTES: DBAdminNote[] = [
  {
    id: "note_1",
    payment_id: "87201000-0000-0000-0000-000000000004",
    admin_name: "Senior Advisory Controller",
    note: "Client flagged that wire initiation is from a Swiss entity name. Awaiting verification matching invoice credentials.",
    created_at: "2026-06-23T06:00:00Z"
  },
  {
    id: "note_2",
    payment_id: "20288000-0000-0000-0000-000000000006",
    admin_name: "Senior Advisory Controller",
    note: "Card hold failed due to 3D-Secure timeout. Advised client to whitelists Ticketone payment provider node or process via wire.",
    created_at: "2026-06-21T18:30:00Z"
  }
];

// Master database helper service utilizing either Supabase OR local storage
export const dbService = {
  // --- PAYMENTS ---
  async getPayments(): Promise<DBPayment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getPayments error, using local fallback:', error);
      } else if (data) {
        return data as DBPayment[];
      }
    }
    
    // Local Storage fallback engine
    try {
      const stored = localStorage.getItem(STORAGE_PAYMENTS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(DEFAULT_PAYMENTS));
        return DEFAULT_PAYMENTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse payments from localStorage:", e);
      return DEFAULT_PAYMENTS;
    }
  },

  async savePayments(payments: DBPayment[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
    } catch (e) {
      console.warn("Failed to write payments to localStorage:", e);
    }
  },

  async addPayment(payment: Omit<DBPayment, 'id' | 'created_at' | 'updated_at'>): Promise<DBPayment> {
    const newId = `TX-${Math.floor(10000 + Math.random() * 90000)}-${payment.client_name.substring(0,2).toUpperCase()}`;
    const now = new Date().toISOString();
    const fullPayment: DBPayment = {
      ...payment,
      id: newId,
      created_at: now,
      updated_at: now
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          client_name: payment.client_name,
          client_email: payment.client_email,
          client_phone: payment.client_phone,
          payment_reference: payment.payment_reference,
          invoice_reference: payment.invoice_reference,
          amount: payment.amount,
          currency: payment.currency,
          payment_provider: payment.payment_provider,
          provider_payment_id: payment.provider_payment_id,
          provider_checkout_url: payment.provider_checkout_url,
          payment_status: payment.payment_status,
          settlement_status: payment.settlement_status,
          payment_method: payment.payment_method,
          description: payment.description,
          paid_at: payment.paid_at,
          settled_at: payment.settled_at,
          settlement_asset: payment.settlement_asset,
          settlement_network: payment.settlement_network,
          settlement_label: payment.settlement_label,
          settlement_address: payment.settlement_address
        }])
        .select();
      if (!error && data && data.length > 0) {
        return data[0] as DBPayment;
      }
      console.error('Supabase addPayment error, writing to local fallback:', error);
    }

    const current = await this.getPayments();
    current.unshift(fullPayment);
    await this.savePayments(current);
    return fullPayment;
  },

  async updatePaymentStatus(id: string, payment_status: DBPayment['payment_status'], settlement_status: DBPayment['settlement_status']): Promise<DBPayment[]> {
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase
        .from('payments')
        .update({ 
          payment_status, 
          settlement_status, 
          updated_at: now,
          paid_at: payment_status === 'paid' ? now : undefined,
          settled_at: settlement_status === 'settled' ? now : undefined
        })
        .eq('id', id);
      if (error) {
        console.error('Supabase updatePaymentStatus error:', error);
      }
    }

    const current = await this.getPayments();
    const updated = current.map(p => {
      if (p.id === id) {
        return {
          ...p,
          payment_status,
          settlement_status,
          updated_at: now,
          paid_at: payment_status === 'paid' ? now : p.paid_at,
          settled_at: settlement_status === 'settled' ? now : p.settled_at
        };
      }
      return p;
    });
    await this.savePayments(updated);
    return updated;
  },

  async deletePayment(id: string): Promise<DBPayment[]> {
    if (supabase) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Supabase deletePayment error:', error);
      }
    }

    const current = await this.getPayments();
    const filtered = current.filter(p => p.id !== id);
    await this.savePayments(filtered);
    return filtered;
  },

  // --- PAYMENT REQUESTS ---
  async getPaymentRequests(): Promise<DBPaymentRequest[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getPaymentRequests error, using local fallback:', error);
      } else if (data) {
        return data as DBPaymentRequest[];
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_REQUESTS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(DEFAULT_REQUESTS));
        return DEFAULT_REQUESTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse payment requests from localStorage:", e);
      return DEFAULT_REQUESTS;
    }
  },

  async savePaymentRequests(requests: DBPaymentRequest[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
    } catch (e) {
      console.warn("Failed to write payment requests to localStorage:", e);
    }
  },

  async addPaymentRequest(req: Omit<DBPaymentRequest, 'id' | 'created_at' | 'payment_link'>): Promise<DBPaymentRequest> {
    const id = `req_${Math.floor(1000 + Math.random() * 9000)}`;
    const link = `${window.location.origin}/?ref=${req.reference}`;
    const newReq: DBPaymentRequest = {
      ...req,
      id,
      payment_link: link,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert([{
          client_name: req.client_name,
          client_email: req.client_email,
          amount: req.amount,
          currency: req.currency,
          reference: req.reference,
          description: req.description,
          payment_link: link,
          status: req.status,
          expires_at: req.expires_at
        }])
        .select();
      if (!error && data && data.length > 0) {
        return data[0] as DBPaymentRequest;
      }
      console.error('Supabase addPaymentRequest error:', error);
    }

    const current = await this.getPaymentRequests();
    current.unshift(newReq);
    await this.savePaymentRequests(current);
    return newReq;
  },

  async updateRequestStatus(id: string, status: DBPaymentRequest['status']): Promise<DBPaymentRequest[]> {
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status, 
          paid_at: status === 'paid' ? now : undefined 
        })
        .eq('id', id);
      if (error) {
        console.error('Supabase updateRequestStatus error:', error);
      }
    }

    const current = await this.getPaymentRequests();
    const updated = current.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          paid_at: status === 'paid' ? now : r.paid_at
        };
      }
      return r;
    });
    await this.savePaymentRequests(updated);
    return updated;
  },

  // --- NEW TICKETONE PAYMENT REQUESTS ---
  async getNewPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const stored = localStorage.getItem(STORAGE_TICKETONE_REQUESTS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_TICKETONE_REQUESTS_KEY, JSON.stringify(DEFAULT_NEW_REQUESTS));
        return DEFAULT_NEW_REQUESTS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse ticketone payment requests:", e);
      return DEFAULT_NEW_REQUESTS;
    }
  },

  async saveNewPaymentRequests(requests: PaymentRequest[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_TICKETONE_REQUESTS_KEY, JSON.stringify(requests));
    } catch (e) {
      console.warn("Failed to write ticketone payment requests:", e);
    }
  },

  async addNewPaymentRequest(req: Omit<PaymentRequest, 'id' | 'paymentLink' | 'createdAt'>): Promise<PaymentRequest> {
    const id = `req_${Math.floor(1000 + Math.random() * 9000)}`;
    const link = `${window.location.origin}/pay/${req.token}`;
    const newReq: PaymentRequest = {
      ...req,
      id,
      paymentLink: link,
      createdAt: new Date().toISOString()
    };
    const current = await this.getNewPaymentRequests();
    current.unshift(newReq);
    await this.saveNewPaymentRequests(current);
    return newReq;
  },

  async updateNewRequestStatus(id: string, status: PaymentRequest['status'], extra?: Partial<PaymentRequest>): Promise<PaymentRequest[]> {
    const current = await this.getNewPaymentRequests();
    const updated = current.map(r => {
      if (r.id === id || r.token === id) {
        const payload: PaymentRequest = {
          ...r,
          status,
          ...extra
        };
        if (status === 'paid' && !r.paidAt) {
          payload.paidAt = new Date().toISOString();
        }
        if (status === 'opened' && !r.openedAt) {
          payload.openedAt = new Date().toISOString();
        }
        if (status === 'cancelled' && !r.cancelledAt) {
          payload.cancelledAt = new Date().toISOString();
        }
        return payload;
      }
      return r;
    });
    await this.saveNewPaymentRequests(updated);
    return updated;
  },


  // --- ADMIN NOTES ---
  async getNotes(paymentId: string): Promise<DBAdminNote[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase getNotes error, using local fallback:', error);
      } else if (data) {
        return data as DBAdminNote[];
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_NOTES_KEY);
      const allNotes: DBAdminNote[] = stored ? JSON.parse(stored) : DEFAULT_NOTES;
      return allNotes.filter(n => n.payment_id === paymentId);
    } catch (e) {
      console.warn("Failed to parse admin notes from localStorage:", e);
      return DEFAULT_NOTES.filter(n => n.payment_id === paymentId);
    }
  },

  async addNote(paymentId: string, noteText: string, adminName = 'Senior Advisory Controller'): Promise<DBAdminNote> {
    const newNote: DBAdminNote = {
      id: `note_${Math.floor(1000 + Math.random() * 9000)}`,
      payment_id: paymentId,
      admin_name: adminName,
      note: noteText,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('admin_notes')
        .insert([{
          payment_id: paymentId,
          admin_name: adminName,
          note: noteText
        }])
        .select();
      if (!error && data && data.length > 0) {
        return data[0] as DBAdminNote;
      }
      console.error('Supabase addNote error:', error);
    }

    let allNotes: DBAdminNote[] = [...DEFAULT_NOTES];
    try {
      const stored = localStorage.getItem(STORAGE_NOTES_KEY);
      if (stored) {
        allNotes = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to read admin notes from localStorage:", e);
    }

    allNotes.push(newNote);

    try {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(allNotes));
    } catch (e) {
      console.warn("Failed to write admin notes to localStorage:", e);
    }
    return newNote;
  }
};
