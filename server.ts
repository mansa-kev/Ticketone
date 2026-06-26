import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getActiveProvider } from './providers';

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;
const DB_STORE_PATH = path.join(process.cwd(), 'db_store.json');

app.use(express.json());

// --- DATABASE SCHEMAS MATCHING SPECIFIED SPEC ---
interface Payment {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  amount: number;
  currency: string;
  description?: string;
  internal_reference: string;
  invoice_reference: string;
  provider_name: string;
  provider_payment_id?: string;
  provider_checkout_url?: string;
  payment_status: 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded' | 'manual_review' | 'manual review';
  settlement_status: 'not_applicable' | 'awaiting_settlement' | 'awaiting settlement' | 'settled' | 'settlement failed' | 'manual_review' | 'manual review';
  payment_method: string;
  raw_provider_status?: string;
  raw_provider_response?: any;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  failed_at?: string;
  cancelled_at?: string;
  expired_at?: string;
  refunded_at?: string;
  settled_at?: string;
  settlement_asset?: string;
  settlement_network?: string;
  settlement_label?: string;
  settlement_address?: string;
  
  // Backward compatibility with legacy frontend models
  payment_reference: string;
  payment_provider: string;
}

interface PaymentRequest {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  description?: string;
  reference: string;
  payment_link_token: string;
  status: 'unpaid' | 'paid' | 'expired' | 'cancelled' | 'pending';
  expires_at?: string;
  created_at: string;
  paid_at?: string;
  
  // Backward compatibility
  payment_link: string;
}

interface WebhookEvent {
  id: string;
  provider_name: string;
  provider_event_id: string;
  event_type: string;
  related_payment_id?: string;
  raw_payload: any;
  signature_valid: boolean;
  processed: boolean;
  processing_error?: string;
  created_at: string;
}

interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  issued_at: string;
  receipt_url: string;
  sent_to_client: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  actor_type: 'client' | 'admin' | 'system' | 'provider';
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

interface AdminNote {
  id: string;
  payment_id: string;
  admin_name: string;
  note: string;
  created_at: string;
}

interface DBStore {
  payments: Payment[];
  requests: PaymentRequest[];
  notes: AdminNote[];
  webhooks: WebhookEvent[];
  receipts: Receipt[];
  audit_logs: AuditLog[];
}

// Default Seed Data
const INITIAL_STORE: DBStore = {
  payments: [
    {
      id: "TX-94021-AW",
      client_name: "Arthur Wellesley",
      client_email: "a.wellesley@paramountgp.co",
      client_phone: "+44 7911 123456",
      amount: 35000,
      currency: "USD",
      description: "Executive Tax Advisory Retainer - Q2",
      internal_reference: "INV-2026-089A",
      invoice_reference: "INV-2026-089A",
      payment_reference: "INV-2026-089A",
      provider_name: "stripe",
      payment_provider: "stripe",
      provider_payment_id: "ch_3M2h6cK9Z0d2L8k",
      provider_checkout_url: "https://checkout.stripe.com/pay/94021",
      payment_status: "paid",
      settlement_status: "settled",
      payment_method: "Stripe Premium Card Node",
      created_at: "2026-06-22T14:30:00Z",
      paid_at: "2026-06-22T14:35:00Z",
      settled_at: "2026-06-22T15:00:00Z",
      updated_at: "2026-06-22T15:00:00Z"
    },
    {
      id: "TX-48902-BV",
      client_name: "Dame Beatrice Vance",
      client_email: "beatrice@vanceadvisory.com",
      client_phone: "+44 20 7946 0958",
      amount: 15000,
      currency: "GBP",
      description: "Sovereign Inheritance Estate Audit Plan",
      internal_reference: "INV-2026-091B",
      invoice_reference: "INV-2026-091B",
      payment_reference: "INV-2026-091B",
      provider_name: "paypal",
      payment_provider: "paypal",
      provider_payment_id: "ch_3M2h6cK9Z0d2L9x",
      provider_checkout_url: "https://paypal.com/checkout/48902",
      payment_status: "paid",
      settlement_status: "settled",
      payment_method: "PayPal Wire Transfer Node",
      created_at: "2026-06-20T09:15:00Z",
      paid_at: "2026-06-20T09:30:00Z",
      settled_at: "2026-06-20T11:45:00Z",
      updated_at: "2026-06-20T11:45:00Z"
    }
  ],
  requests: [
    {
      id: "req_1",
      client_name: "Count Philippe de Montaigne",
      client_email: "montaigne@bordeauxadvisors.com",
      amount: 45000,
      currency: "EUR",
      description: "Structured Sovereign Bond Portfolios Placement Setup Fee",
      reference: "INV-2026-112B",
      payment_link_token: "INV-2026-112B",
      payment_link: "http://localhost:3000/?ref=INV-2026-112B",
      status: "unpaid",
      expires_at: "2026-07-30T10:00:00Z",
      created_at: "2026-06-22T09:00:00Z"
    }
  ],
  notes: [],
  webhooks: [],
  receipts: [],
  audit_logs: []
};

function getStore(): DBStore {
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      const data = fs.readFileSync(DB_STORE_PATH, 'utf-8');
      const store = JSON.parse(data);
      // Ensure all arrays exist
      if (!store.payments) store.payments = [];
      if (!store.requests) store.requests = [];
      if (!store.notes) store.notes = [];
      if (!store.webhooks) store.webhooks = [];
      if (!store.receipts) store.receipts = [];
      if (!store.audit_logs) store.audit_logs = [];
      return store;
    }
  } catch (err) {
    console.error('Error reading db_store.json, using initial store:', err);
  }
  saveStore(INITIAL_STORE);
  return INITIAL_STORE;
}

function saveStore(store: DBStore): void {
  try {
    fs.writeFileSync(DB_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db_store.json:', err);
  }
}

// Log actions in AuditLog table
function writeAuditLog(
  actor_type: 'client' | 'admin' | 'system' | 'provider',
  actor_id: string,
  action: string,
  entity_type: string,
  entity_id: string,
  metadata: any = {}
) {
  const store = getStore();
  const log: AuditLog = {
    id: `log_${Math.floor(100000 + Math.random() * 900000)}`,
    actor_type,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at: new Date().toISOString()
  };
  store.audit_logs.unshift(log);
  saveStore(store);
}

// Helper to simulate sending secure transactional notifications
function logEmailSimulation(type: 'client' | 'admin', recipient: string, subject: string, body: string) {
  console.log(`\n======================================================`);
  console.log(`[SECURE TRANSACTIONAL MAIL ENVELOPE: ${type.toUpperCase()}]`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`------------------------------------------------------`);
  console.log(body);
  console.log(`======================================================\n`);
}

// --- API BACKEND ENDPOINTS ---

// 1. Initiate Payment Creation Flow
app.post('/api/payments/create', async (req, res) => {
  const { client_name, client_email, client_phone, amount, currency, payment_reference, description } = req.body;

  if (!client_name || !client_email || !amount || !currency || !payment_reference) {
    return res.status(400).json({ error: 'Missing required checkout payload parameters.' });
  }

  const store = getStore();

  // Check for duplicate payment references
  const duplicateIndex = store.payments.findIndex(p => p.internal_reference.toLowerCase() === payment_reference.toLowerCase());
  if (duplicateIndex !== -1) {
    const duplicate = store.payments[duplicateIndex];
    if (duplicate.payment_status === 'paid') {
      return res.status(409).json({ error: 'Invoice reference index conflict detected.' });
    }
  }

  const isUpdate = duplicateIndex !== -1;
  const existingPayment = isUpdate ? store.payments[duplicateIndex] : null;
  const txId = existingPayment ? existingPayment.id : `TX-${Math.floor(10000 + Math.random() * 90000)}-${client_name.substring(0, 2).toUpperCase()}`;
  const now = new Date().toISOString();

  // Load the selected dynamic provider via abstraction layer
  const provider = getActiveProvider();
  console.log(`[Backend] Creating payment via dynamic provider: ${provider.name}`);

  try {
    const providerRes = await provider.createPayment({
      client_name,
      client_email,
      client_phone,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      payment_reference,
      description
    });

    const newPayment: Payment = {
      id: txId,
      client_name,
      client_email,
      client_phone: client_phone || '',
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      description: description || 'Confidential Professional Advisory Fee Retainer',
      internal_reference: payment_reference,
      invoice_reference: payment_reference,
      payment_reference: payment_reference, // Backward compat
      provider_name: provider.name,
      payment_provider: provider.name, // Backward compat
      provider_payment_id: providerRes.providerPaymentId,
      provider_checkout_url: providerRes.checkoutUrl,
      payment_status: 'pending',
      settlement_status: 'awaiting settlement',
      payment_method: provider.name === 'binancepay' 
        ? 'Binance Pay Wallet' 
        : provider.name === 'nowpayments' 
          ? 'NOWPayments Crypto Portal' 
          : provider.name === 'paypal' 
            ? 'PayPal Express Node' 
            : 'Stripe Cards Node',
      raw_provider_status: 'pending',
      raw_provider_response: providerRes.rawResponse,
      settlement_asset: process.env.DEFAULT_SETTLEMENT_ASSET || 'USDT',
      settlement_network: process.env.DEFAULT_SETTLEMENT_NETWORK || '',
      settlement_label: process.env.DEFAULT_SETTLEMENT_ADDRESS_LABEL || 'Binance USDT Wallet',
      settlement_address: process.env.DEFAULT_SETTLEMENT_ADDRESS || '',
      created_at: existingPayment ? existingPayment.created_at : now,
      updated_at: now
    };

    if (isUpdate) {
      store.payments[duplicateIndex] = newPayment;
    } else {
      store.payments.unshift(newPayment);
    }
    
    // Update matching payment request to pending
    const reqIndex = store.requests.findIndex(r => r.reference.toLowerCase() === payment_reference.toLowerCase());
    if (reqIndex !== -1) {
      store.requests[reqIndex].status = 'pending';
    }

    saveStore(store);

    writeAuditLog('client', client_email, 'INITIATE_PAYMENT', 'payment', txId, {
      provider: provider.name,
      amount,
      currency
    });

    return res.status(201).json({
      success: true,
      payment_id: txId,
      checkout_url: providerRes.checkoutUrl,
      payment: newPayment
    });
  } catch (err: any) {
    console.error(`[Backend] Payment provider call failure:`, err);
    return res.status(500).json({ error: `Payment gateway initiation failed: ${err.message}` });
  }
});

// 2. Query Payment Status
app.get('/api/payments/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const store = getStore();
  const paymentIndex = store.payments.findIndex(p => 
    p.id === paymentId || 
    p.internal_reference.toLowerCase() === paymentId.toLowerCase() ||
    p.provider_payment_id === paymentId
  );

  if (paymentIndex === -1) {
    return res.status(404).json({ error: 'Payment index not found.' });
  }

  const payment = store.payments[paymentIndex];

  // Dynamically verify status with active provider if currently pending and has a provider ID
  if (payment.payment_status === 'pending' && payment.provider_payment_id && !payment.provider_payment_id.startsWith('now_sandbox_') && !payment.provider_payment_id.startsWith('stripe_sandbox_')) {
    const provider = getActiveProvider();
    try {
      console.log(`[Backend] Auto-querying status of pending payment '${payment.id}' via provider: ${provider.name}`);
      const check = await provider.getPaymentStatus(payment.provider_payment_id);
      if (check && check.status) {
        const normalized = provider.normalizeStatus(check.status);
        if (normalized !== payment.payment_status) {
          payment.payment_status = normalized as any;
          payment.raw_provider_status = check.status;
          payment.raw_provider_response = check.rawResponse;
          payment.updated_at = new Date().toISOString();

          if (normalized === 'paid') {
            payment.settlement_status = 'settled';
            payment.paid_at = new Date().toISOString();
            payment.settled_at = new Date().toISOString();

            // Update matching payment request status
            const reqIndex = store.requests.findIndex(r => r.reference.toLowerCase() === payment.internal_reference.toLowerCase());
            if (reqIndex !== -1) {
              store.requests[reqIndex].status = 'paid';
              store.requests[reqIndex].paid_at = new Date().toISOString();
            }

            writeAuditLog('provider', provider.name, 'PAYMENT_COMPLETED', 'payment', payment.id, {
              amount: payment.amount,
              currency: payment.currency
            });
          }
          saveStore(store);
        }
      }
    } catch (err: any) {
      console.error(`[Backend] Auto-querying status failed for '${payment.id}':`, err.message);
    }
  }

  return res.json({ success: true, payment });
});

// 3b. Dedicated NOWPayments Webhook/IPN Receiver
app.post('/api/webhooks/nowpayments', (req, res) => {
  const provider = getActiveProvider();
  
  // Verify that active provider is indeed NOWPayments, or instantiate one to handle it.
  const nowpaymentsProvider = provider.name === 'nowpayments' ? provider : getActiveProvider();
  
  const rawBody = req.body;
  const signatureValid = nowpaymentsProvider.verifyWebhook(req.headers, rawBody);
  const now = new Date().toISOString();

  console.log(`[NOWPayments Webhook] Received webhook event. Valid signature: ${signatureValid}`);

  if (!signatureValid) {
    console.warn(`[NOWPayments Webhook] Rejected invalid signature from IPN.`);
    return res.status(400).json({ error: 'Invalid IPN signature verification failed.' });
  }

  const eventId = `ev_now_${Math.floor(100000 + Math.random() * 900000)}`;
  const store = getStore();

  let parsed;
  try {
    parsed = nowpaymentsProvider.parseWebhookEvent(req.headers, rawBody);
  } catch (e: any) {
    console.error('[NOWPayments Webhook] Failed to parse webhook event body:', e);
    return res.status(400).json({ error: 'Malformed webhook event envelope.' });
  }

  // Find payment record using either providerPaymentId or internal reference
  const paymentIndex = store.payments.findIndex(p => 
    (parsed.internalReference && p.internal_reference.toLowerCase() === parsed.internalReference.toLowerCase()) ||
    (parsed.providerPaymentId && p.provider_payment_id === parsed.providerPaymentId)
  );

  const webhookEvent: WebhookEvent = {
    id: eventId,
    provider_name: 'nowpayments',
    provider_event_id: parsed.providerPaymentId || `evt_now_${Math.random().toString(36).substring(2, 8)}`,
    event_type: parsed.providerStatus,
    related_payment_id: paymentIndex !== -1 ? store.payments[paymentIndex].id : undefined,
    raw_payload: rawBody,
    signature_valid: true,
    processed: paymentIndex !== -1,
    processing_error: paymentIndex === -1 ? 'Target payment reference not registered' : undefined,
    created_at: now
  };

  // Prevent duplicate processing of the exact same event / status
  const isDuplicate = store.webhooks.some(w => 
    w.provider_name === 'nowpayments' && 
    w.provider_event_id === webhookEvent.provider_event_id &&
    w.event_type === webhookEvent.event_type
  );

  if (isDuplicate) {
    console.log(`[NOWPayments Webhook] Duplicate event detected. Skipping duplicate execution. ID: ${webhookEvent.provider_event_id}`);
    return res.json({ success: true, duplicate: true });
  }

  store.webhooks.unshift(webhookEvent);

  if (paymentIndex === -1) {
    saveStore(store);
    console.warn(`[NOWPayments Webhook] Target reference '${parsed.internalReference}' (ID: '${parsed.providerPaymentId}') not registered in Ticketone index.`);
    return res.status(404).json({ error: 'Target payment reference not registered.' });
  }

  const payment = store.payments[paymentIndex];
  
  // Apply update to payment status
  payment.payment_status = parsed.normalizedStatus as any;
  payment.raw_provider_status = parsed.providerStatus;
  payment.raw_provider_response = parsed.rawPayload;
  payment.updated_at = now;

  // Handle status transitions
  if (parsed.normalizedStatus === 'paid') {
    payment.settlement_status = 'settled';
    payment.paid_at = now;
    payment.settled_at = now;

    // Generate Receipt
    const receiptId = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReceipt: Receipt = {
      id: receiptId,
      payment_id: payment.id,
      receipt_number: `R-${payment.internal_reference}`,
      issued_at: now,
      receipt_url: `http://localhost:3000/receipt/${receiptId}`,
      sent_to_client: true,
      created_at: now
    };
    store.receipts.unshift(newReceipt);

    // Update preset payment request if present
    const reqIndex = store.requests.findIndex(r => r.reference.toLowerCase() === payment.internal_reference.toLowerCase());
    if (reqIndex !== -1) {
      store.requests[reqIndex].status = 'paid';
      store.requests[reqIndex].paid_at = now;
    }

    writeAuditLog('provider', 'nowpayments', 'PAYMENT_COMPLETED', 'payment', payment.id, {
      amount: payment.amount,
      currency: payment.currency
    });

    // Trigger transactional simulated emails
    logEmailSimulation(
      'client',
      payment.client_email,
      `[PAID/CONFIRMED] Settlement Receipt Securing Retainer - Ref ${payment.internal_reference}`,
      `Dear ${payment.client_name},\n\nWe have successfully received your payment of ${payment.currency} ${payment.amount.toLocaleString()} for advisory retainer reference ${payment.internal_reference}.\n\nYour settlement has been registered into our secure corporate ledger.\n\nThank you for choosing Ticketone Advisory.\n\nConfidentiality Guaranteed.`
    );

    logEmailSimulation(
      'admin',
      'controller@ticketone.advisory',
      `[ALERT] High-Value Settlement Secured - Ref ${payment.internal_reference}`,
      `A checkout transaction of ${payment.currency} ${payment.amount.toLocaleString()} has been processed and confirmed via NOWPayments webhook for ${payment.client_name}.\nStatus: paid • Settled: Sovereign Vault Ledger.`
    );
  } else if (parsed.normalizedStatus === 'failed') {
    payment.settlement_status = 'settlement failed';
    payment.failed_at = now;
    writeAuditLog('provider', 'nowpayments', 'PAYMENT_FAILED', 'payment', payment.id, {
      providerStatus: parsed.providerStatus
    });
  } else if (parsed.normalizedStatus === 'cancelled') {
    payment.cancelled_at = now;
    writeAuditLog('provider', 'nowpayments', 'PAYMENT_CANCELLED', 'payment', payment.id);
  } else if (parsed.normalizedStatus === 'expired') {
    payment.expired_at = now;
    writeAuditLog('provider', 'nowpayments', 'PAYMENT_EXPIRED', 'payment', payment.id);
  }

  store.payments[paymentIndex] = payment;
  saveStore(store);

  return res.json({ success: true, payment_id: payment.id, status: payment.payment_status });
});

// 3. Webhook/IPN Receiver
app.post('/api/webhooks/payment-provider', (req, res) => {
  const provider = getActiveProvider();
  const signatureValid = provider.verifyWebhook(req.headers, req.body);
  const now = new Date().toISOString();

  console.log(`[WEBHOOK] Received webhook event for provider: ${provider.name}. Valid signature: ${signatureValid}`);

  const eventId = `ev_${Math.floor(100000 + Math.random() * 900000)}`;
  const store = getStore();

  let parsed;
  try {
    parsed = provider.parseWebhookEvent(req.headers, req.body);
  } catch (e: any) {
    console.error('[WEBHOOK] Failed to parse webhook event body:', e);
    return res.status(400).json({ error: 'Malformed webhook event envelope.' });
  }

  // Find payment record
  const paymentIndex = store.payments.findIndex(p => 
    p.internal_reference.toLowerCase() === parsed.internalReference.toLowerCase() ||
    p.provider_payment_id === parsed.providerPaymentId
  );

  const webhookEvent: WebhookEvent = {
    id: eventId,
    provider_name: provider.name,
    provider_event_id: parsed.providerPaymentId || `evt_${Math.random().toString(36).substring(2, 8)}`,
    event_type: parsed.providerStatus,
    related_payment_id: paymentIndex !== -1 ? store.payments[paymentIndex].id : undefined,
    raw_payload: req.body,
    signature_valid: signatureValid,
    processed: paymentIndex !== -1,
    processing_error: paymentIndex === -1 ? 'Target payment reference not registered' : undefined,
    created_at: now
  };

  store.webhooks.unshift(webhookEvent);

  if (paymentIndex === -1) {
    saveStore(store);
    console.warn(`[WEBHOOK] Target reference '${parsed.internalReference}' not registered in Ticketone index.`);
    return res.status(404).json({ error: 'Target payment reference not registered.' });
  }

  const payment = store.payments[paymentIndex];
  
  // Apply update to payment status
  payment.payment_status = parsed.normalizedStatus as any;
  payment.raw_provider_status = parsed.providerStatus;
  payment.raw_provider_response = parsed.rawPayload;
  payment.updated_at = now;

  // Handle status transitions
  if (parsed.normalizedStatus === 'paid') {
    payment.settlement_status = 'settled';
    payment.paid_at = now;
    payment.settled_at = now;

    // Generate Receipt
    const receiptId = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newReceipt: Receipt = {
      id: receiptId,
      payment_id: payment.id,
      receipt_number: `R-${payment.internal_reference}`,
      issued_at: now,
      receipt_url: `http://localhost:3000/receipt/${receiptId}`,
      sent_to_client: true,
      created_at: now
    };
    store.receipts.unshift(newReceipt);

    // Update preset payment request if present
    const reqIndex = store.requests.findIndex(r => r.reference.toLowerCase() === payment.internal_reference.toLowerCase());
    if (reqIndex !== -1) {
      store.requests[reqIndex].status = 'paid';
      store.requests[reqIndex].paid_at = now;
    }

    writeAuditLog('provider', provider.name, 'PAYMENT_COMPLETED', 'payment', payment.id, {
      amount: payment.amount,
      currency: payment.currency
    });

    // Trigger transactional simulated emails
    logEmailSimulation(
      'client',
      payment.client_email,
      `[PAID/CONFIRMED] Settlement Receipt Securing Retainer - Ref ${payment.internal_reference}`,
      `Dear ${payment.client_name},\n\nWe have successfully received your payment of ${payment.currency} ${payment.amount.toLocaleString()} for advisory retainer reference ${payment.internal_reference}.\n\nYour settlement has been registered into our secure corporate ledger.\n\nThank you for choosing Ticketone Advisory.\n\nConfidentiality Guaranteed.`
    );

    logEmailSimulation(
      'admin',
      'controller@ticketone.advisory',
      `[ALERT] High-Value Settlement Secured - Ref ${payment.internal_reference}`,
      `A checkout transaction of ${payment.currency} ${payment.amount.toLocaleString()} has been processed and confirmed via ${provider.name} webhook for ${payment.client_name}.\nStatus: paid • Settled: Sovereign Vault Ledger.`
    );
  } else if (parsed.normalizedStatus === 'failed') {
    payment.settlement_status = 'settlement failed';
    payment.failed_at = now;
    writeAuditLog('provider', provider.name, 'PAYMENT_FAILED', 'payment', payment.id, {
      providerStatus: parsed.providerStatus
    });
  } else if (parsed.normalizedStatus === 'cancelled') {
    payment.cancelled_at = now;
    writeAuditLog('provider', provider.name, 'PAYMENT_CANCELLED', 'payment', payment.id);
  } else if (parsed.normalizedStatus === 'expired') {
    payment.expired_at = now;
    writeAuditLog('provider', provider.name, 'PAYMENT_EXPIRED', 'payment', payment.id);
  }

  store.payments[paymentIndex] = payment;
  saveStore(store);

  return res.json({ success: true, processed: true, event_id: eventId });
});

// 4. Admin - Get All Payments
app.get('/api/admin/payments', (req, res) => {
  const store = getStore();
  return res.json({ success: true, payments: store.payments });
});

// 5. Admin - Get Single Payment Details
app.get('/api/admin/payments/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();
  const payment = store.payments.find(p => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }
  return res.json({ success: true, payment });
});

// 6. Admin - Get All Payment Requests
app.get('/api/admin/payment-requests', (req, res) => {
  const store = getStore();
  return res.json({ success: true, requests: store.requests });
});

// 7. Admin - Create Preset Payment Request
app.post('/api/admin/payment-requests', (req, res) => {
  const { client_name, client_email, amount, currency, reference, description } = req.body;

  if (!client_name || !client_email || !amount || !currency || !reference) {
    return res.status(400).json({ error: 'Missing parameters for payment request.' });
  }

  const store = getStore();

  const duplicate = store.requests.find(r => r.reference.toLowerCase() === reference.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ error: 'Duplicate reference code.' });
  }

  const id = `req_${Math.floor(1000 + Math.random() * 9000)}`;
  const link = `http://localhost:3000/?ref=${reference}`;

  const newRequest: PaymentRequest = {
    id,
    client_name,
    client_email,
    amount: parseFloat(amount),
    currency: currency.toUpperCase(),
    reference,
    description,
    payment_link_token: reference,
    payment_link: link,
    status: 'unpaid',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
    created_at: new Date().toISOString()
  };

  store.requests.unshift(newRequest);
  saveStore(store);

  writeAuditLog('admin', 'system', 'CREATE_PAYMENT_REQUEST', 'request', id, {
    client_name,
    amount,
    currency,
    reference
  });

  return res.status(201).json({ success: true, request: newRequest });
});

// Backward compatibility endpoint mapping
app.post('/api/admin/requests/create', (req, res) => {
  const { client_name, client_email, amount, currency, reference, description } = req.body;
  const store = getStore();

  const duplicate = store.requests.find(r => r.reference.toLowerCase() === reference.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ error: 'Duplicate reference code.' });
  }

  const id = `req_${Math.floor(1000 + Math.random() * 9000)}`;
  const link = `http://localhost:3000/?ref=${reference}`;

  const newRequest: PaymentRequest = {
    id,
    client_name,
    client_email,
    amount: parseFloat(amount),
    currency: currency.toUpperCase(),
    reference,
    description,
    payment_link_token: reference,
    payment_link: link,
    status: 'unpaid',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  };

  store.requests.unshift(newRequest);
  saveStore(store);
  return res.status(201).json({ success: true, request: newRequest });
});

// 8. Admin - Patch Preset Payment Request Status
app.patch('/api/admin/payment-requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Missing parameter status' });
  }

  const store = getStore();
  const reqIndex = store.requests.findIndex(r => r.id === id);

  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Payment request index not found.' });
  }

  store.requests[reqIndex].status = status;
  if (status === 'paid') {
    store.requests[reqIndex].paid_at = new Date().toISOString();
  }
  
  saveStore(store);

  writeAuditLog('admin', 'system', 'PATCH_PAYMENT_REQUEST', 'request', id, { status });

  return res.json({ success: true, request: store.requests[reqIndex] });
});

// 9. Admin - Aggregate Performance Metrics
app.get('/api/admin/reports', (req, res) => {
  const store = getStore();
  const payments = store.payments;

  const totalVolume = payments
    .filter(p => p.payment_status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidCount = payments.filter(p => p.payment_status === 'paid').length;
  const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
  const failedCount = payments.filter(p => p.payment_status === 'failed').length;
  const refundedCount = payments.filter(p => p.payment_status === 'refunded').length;

  const averageAmount = paidCount > 0 ? totalVolume / paidCount : 0;

  return res.json({
    success: true,
    stats: {
      totalVolume,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      averageAmount
    }
  });
});

// Notes endpoints
app.get('/api/admin/notes/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  const store = getStore();
  const notes = store.notes.filter(n => n.payment_id === paymentId);
  return res.json({ success: true, notes });
});

app.post('/api/admin/notes', (req, res) => {
  const { payment_id, note, admin_name } = req.body;
  if (!payment_id || !note) {
    return res.status(400).json({ error: 'Missing notes payload' });
  }

  const store = getStore();
  const newNote: AdminNote = {
    id: `note_${Math.floor(100000 + Math.random() * 900000)}`,
    payment_id,
    admin_name: admin_name || 'Senior Advisory Controller',
    note,
    created_at: new Date().toISOString()
  };

  store.notes.push(newNote);
  saveStore(store);
  return res.status(201).json({ success: true, note: newNote });
});

// --- VITE MIDDLEWARE CONFIGURATION ---
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  TICKETONE PRIVATE GATEWAY SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  Platform Enclave Address: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

initServer().catch(err => {
  console.error('Failed to bootstrap Ticketone gateway node:', err);
});
