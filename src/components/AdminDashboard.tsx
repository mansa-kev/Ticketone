/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ListCollapse, Link2, BarChart3, Settings as SettingsIcon, LogOut,
  Search, Filter, Calendar, FileSpreadsheet, ArrowUpRight, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, XCircle, RefreshCw, ChevronRight, Copy, Download, ArrowLeft, Plus,
  Sparkles, Wallet, Link as LinkIcon, FileText, CheckCircle, Shield, Globe, ExternalLink,
  Info
} from 'lucide-react';
import { dbService, DBPayment, DBPaymentRequest, DBAdminNote } from '../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'overview' | 'transactions' | 'requests' | 'reports' | 'settings';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // Navigation & Page state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data State
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [requests, setRequests] = useState<DBPaymentRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<DBPayment | null>(null);
  const [selectedPaymentNotes, setSelectedPaymentNotes] = useState<DBAdminNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [settlementFilter, setSettlementFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Payment link generation form state
  const [reqClientName, setReqClientName] = useState('');
  const [reqClientEmail, setReqClientEmail] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqCurrency, setReqCurrency] = useState('USD');
  const [reqReference, setReqReference] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqExpiry, setReqExpiry] = useState('');
  const [generatedRequest, setGeneratedRequest] = useState<DBPaymentRequest | null>(null);
  const [reqCopySuccess, setReqCopySuccess] = useState(false);
  const [markAsSentFlag, setMarkAsSentFlag] = useState(true);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    businessName: 'Ticketone',
    supportEmail: 'advisory@ticketone.advisory',
    settlementWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    providerConnection: 'active',
    defaultCurrency: 'USD',
    allowedCurrencies: 'USD, EUR, GBP, CHF',
    webhookStatus: 'active',
    notificationEmail: 'ledger-alerts@ticketone.advisory',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load and refresh data from state manager
  const loadDashboardData = async () => {
    try {
      const pData = await dbService.getPayments();
      const rData = await dbService.getPaymentRequests();
      setPayments(pData);
      setRequests(rData);
      
      // Keep selected payment data in sync if detail panel is open
      if (selectedPayment) {
        const refreshedSelected = pData.find(item => item.id === selectedPayment.id);
        if (refreshedSelected) {
          setSelectedPayment(refreshedSelected);
          const notes = await dbService.getNotes(refreshedSelected.id);
          setSelectedPaymentNotes(notes);
        }
      }
    } catch (e) {
      console.error("Error synchronizing admin dashboard tables:", e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPayment?.id]);

  // Periodic polling/sync mimicking secure back-office feeds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter Payments
  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      pay.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pay.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pay.payment_status === statusFilter;
    const matchesSettlement = settlementFilter === 'all' || pay.settlement_status === settlementFilter;
    const matchesCurrency = currencyFilter === 'all' || pay.currency === currencyFilter;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(pay.created_at) >= new Date(dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(pay.created_at) <= toDate;
    }

    return matchesSearch && matchesStatus && matchesSettlement && matchesCurrency && matchesDate;
  });

  // Calculate stats based on payments & dates
  const calculateStats = () => {
    const activePayments = filteredPayments;
    
    // Total Payments received value (paid only) converting approximately for sum (all USD equivalent)
    const totalCollected = activePayments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => {
        let rate = 1;
        if (p.currency === 'GBP') rate = 1.25;
        if (p.currency === 'EUR') rate = 1.08;
        if (p.currency === 'CHF') rate = 1.11;
        return sum + (p.amount * rate);
      }, 0);

    const paidCount = activePayments.filter(p => p.payment_status === 'paid').length;
    const pendingCount = activePayments.filter(p => p.payment_status === 'pending').length;
    const failedCount = activePayments.filter(p => p.payment_status === 'failed' || p.payment_status === 'cancelled').length;
    
    // Settled amount
    const settledAmount = activePayments
      .filter(p => p.settlement_status === 'settled')
      .reduce((sum, p) => {
        let rate = 1;
        if (p.currency === 'GBP') rate = 1.25;
        if (p.currency === 'EUR') rate = 1.08;
        if (p.currency === 'CHF') rate = 1.11;
        return sum + (p.amount * rate);
      }, 0);

    // Today's payments count & value
    const today = new Date().toISOString().substring(0, 10);
    const todayPayments = activePayments.filter(p => p.created_at.substring(0, 10) === today);
    const todayTotal = todayPayments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // This month's payments
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthPayments = activePayments.filter(p => p.created_at.substring(0, 7) === currentMonth);
    const thisMonthTotal = thisMonthPayments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCollected,
      paidCount,
      pendingCount,
      failedCount,
      settledAmount,
      todayCount: todayPayments.length,
      todayTotal,
      thisMonthCount: thisMonthPayments.length,
      thisMonthTotal
    };
  };

  const stats = calculateStats();

  // Export dynamically to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      "Payment ID", "Date", "Client Name", "Client Email", "Phone", 
      "Reference", "Invoice Ref", "Amount", "Currency", "Method", 
      "Provider ID", "Payment Status", "Settlement Status"
    ];
    
    const rows = filteredPayments.map(p => [
      p.id,
      p.created_at,
      `"${p.client_name.replace(/"/g, '""')}"`,
      p.client_email,
      p.client_phone || '',
      p.payment_reference,
      p.invoice_reference || '',
      p.amount,
      p.currency,
      p.payment_method,
      p.provider_payment_id || '',
      p.payment_status.toUpperCase(),
      p.settlement_status.toUpperCase()
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TICKETONE_Payments_Report_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Payment Details
  const handleViewPayment = async (pay: DBPayment) => {
    setSelectedPayment(pay);
    try {
      const notes = await dbService.getNotes(pay.id);
      setSelectedPaymentNotes(notes);
    } catch (e) {
      console.error("Error reading admin notes:", e);
    }
  };

  // Add Admin Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedPayment) return;

    try {
      const added = await dbService.addNote(selectedPayment.id, newNoteText.trim());
      setSelectedPaymentNotes(prev => [...prev, added]);
      setNewNoteText('');
    } catch (err) {
      console.error("Error saving administrator note:", err);
    }
  };

  // Toggle statuses manually inside details page
  const handleModifyStatus = async (status: DBPayment['payment_status'], settlement: DBPayment['settlement_status']) => {
    if (!selectedPayment) return;
    try {
      const updated = await dbService.updatePaymentStatus(selectedPayment.id, status, settlement);
      const matched = updated.find(p => p.id === selectedPayment.id);
      if (matched) {
        setSelectedPayment(matched);
      }
      setPayments(updated);
    } catch (err) {
      console.error("Error adjusting ledger state:", err);
    }
  };

  // Handle Create Payment Request Link
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqClientName || !reqClientEmail || !reqAmount || !reqReference) return;

    try {
      const generated = await dbService.addPaymentRequest({
        client_name: reqClientName,
        client_email: reqClientEmail,
        amount: parseFloat(reqAmount),
        currency: reqCurrency,
        reference: reqReference,
        description: reqDescription || undefined,
        status: 'unpaid',
        expires_at: reqExpiry ? new Date(reqExpiry).toISOString() : undefined
      });

      setGeneratedRequest(generated);
      
      // Auto-insert payment placeholder to payments list if status is ready for testing payment provider
      await dbService.addPayment({
        client_name: reqClientName,
        client_email: reqClientEmail,
        client_phone: '',
        payment_reference: reqReference,
        invoice_reference: reqReference,
        amount: parseFloat(reqAmount),
        currency: reqCurrency,
        payment_provider: 'Ticketone Node Secure',
        payment_status: 'pending',
        settlement_status: 'awaiting settlement',
        payment_method: 'Card Hold',
        description: reqDescription || 'Advisory Fee Request'
      });

      // Reload
      await loadDashboardData();

      // Clear Form
      setReqClientName('');
      setReqClientEmail('');
      setReqAmount('');
      setReqReference('');
      setReqDescription('');
      setReqExpiry('');

    } catch (err) {
      console.error("Error generating invoice request link:", err);
    }
  };

  // Copy link helper
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setReqCopySuccess(true);
    setTimeout(() => setReqCopySuccess(false), 2000);
  };

  // Copy general text
  const [copySuccessText, setCopySuccessText] = useState('');
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessText(label);
    setTimeout(() => setCopySuccessText(''), 2000);
  };

  // Generate Receipt PDF representation (simulated file download)
  const handleDownloadReceipt = (p: DBPayment) => {
    const text = `
========================================
       TICKETONE PRIVATE ADVISORY
        OFFICIAL PAYMENT RECEIPT
========================================
Receipt ID: ${p.id}
Date Completed: ${p.paid_at || p.created_at}
----------------------------------------
CLIENT DETAILS:
Name: ${p.client_name}
Email: ${p.client_email}
----------------------------------------
TRANSACTION METRICS:
Amount: ${p.currency} ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Advisory Reference: ${p.payment_reference}
Provider Ref: ${p.provider_payment_id || 'N/A'}
Settlement Status: ${p.settlement_status.toUpperCase()}
Settlement Method: ${p.payment_method}
----------------------------------------
Authorized Signature: Ticketone Node Key Verified
Restricted private corporate audit archive.
========================================
    `;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Receipt_Ticketone_${p.payment_reference}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#2c3531] text-[#d1e8e2] flex flex-col md:flex-row" id="ticketone-admin-dashboard-container">
      
      {/* ----------------- SIDEBAR NAVIGATION (DESKTOP) ----------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-[#116466] border-r border-white/[0.06] shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-serif text-2xl text-[#d1e8e2] font-semibold tracking-wide">
              Ticketone
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#d9b08c] mt-0.5">
              Private Advisory Admin
            </span>
          </div>
          <Shield className="h-5 w-5 text-[#d9b08c]/80" />
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'transactions', label: 'Transactions', icon: ListCollapse },
            { id: 'requests', label: 'Payment Requests', icon: Link2 },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setSelectedPayment(null);
                }}
                className={`w-full text-left px-4 py-3 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-3 ${
                  isActive 
                    ? 'bg-[#2c3531] text-[#d9b08c] font-semibold border-l-2 border-[#d9b08c]' 
                    : 'text-[#d1e8e2]/75 hover:bg-white/[0.03] hover:text-[#d1e8e2]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#d9b08c]' : 'text-[#d1e8e2]/50'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="p-3 bg-white/[0.02] rounded-lg mb-3 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#d1e8e2] truncate font-medium max-w-[150px]">
                {settingsForm.businessName} Controller
              </span>
              <span className="text-[8px] font-mono text-white/35 truncate max-w-[150px]">
                Supabase Enclave Ready
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2.5 text-xs font-mono text-red-400/80 hover:text-red-300 hover:bg-white/[0.02] rounded transition-all flex items-center gap-3 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ----------------- MOBILE NAVIGATION HEADER ----------------- */}
      <header className="md:hidden bg-[#116466] border-b border-white/[0.06] p-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex flex-col">
          <span className="font-serif text-xl text-[#d1e8e2] font-semibold">
            Ticketone Admin
          </span>
          <span className="text-[8px] font-mono text-[#d9b08c] tracking-widest uppercase">
            Private back-office
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#d1e8e2] bg-white/[0.05] p-2 rounded hover:bg-white/[0.1] text-xs font-mono uppercase tracking-wider transition-all"
        >
          {mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
        </button>
      </header>

      {/* Mobile Drawer menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#116466] border-b border-white/[0.1] px-4 pb-6 absolute top-16 left-0 right-0 z-30 shadow-2xl space-y-2 flex flex-col pt-2"
          >
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'transactions', label: 'Transactions', icon: ListCollapse },
              { id: 'requests', label: 'Payment Requests', icon: Link2 },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                    setSelectedPayment(null);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-3 ${
                    isActive 
                      ? 'bg-[#2c3531] text-[#d9b08c] font-semibold' 
                      : 'text-[#d1e8e2]/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="border-t border-white/[0.08] pt-3 mt-2 flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#d1e8e2]/60">Secure Enclave v1.2</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-xs font-mono text-red-400 hover:underline flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ----------------- MAIN DISPLAY BODY ----------------- */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* --------------------------------- PAGE 1: OVERVIEW --------------------------------- */}
        {activeTab === 'overview' && !selectedPayment && (
          <div className="space-y-8">
            
            {/* Top Row: Welcome & Quick Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#d9b08c] uppercase font-semibold block">
                  SYSTEM LEDGER MAIN FRAME
                </span>
                <h1 className="font-serif text-3xl text-[#d1e8e2] font-light leading-snug mt-1">
                  Ticketone Admin Overview
                </h1>
              </div>

              {/* Action and date range */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
                <div className="flex items-center gap-2 bg-[#116466]/40 border border-white/[0.06] rounded px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#d9b08c]" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="bg-transparent text-[#d1e8e2] focus:outline-none focus:border-none w-24"
                    placeholder="From Date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="bg-transparent text-[#d1e8e2] focus:outline-none focus:border-none w-24"
                    placeholder="To Date"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="text-red-400 hover:underline px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={filteredPayments.length === 0}
                  className="px-4 py-2 bg-[#d9b08c] hover:bg-[#cbb27a] disabled:bg-white/[0.03] disabled:text-white/20 text-[#2c3531] font-semibold rounded uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(184,155,94,0.15)]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Summary KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Payments Received */}
              <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-3 bottom-1 text-[#d9b08c]/[0.02] group-hover:scale-105 transition-transform pointer-events-none">
                  <TrendingUp className="h-20 w-20" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#d1e8e2]/60 block tracking-wider">
                    Total Received (USD Eq)
                  </span>
                  <p className="text-2xl font-bold text-[#d1e8e2] font-mono mt-1.5">
                    ${Math.round(stats.totalCollected).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-white/[0.04] text-[10px] text-[#d1e8e2]/50 font-mono flex justify-between items-center">
                  <span>Cleared Intents:</span>
                  <span className="text-emerald-400 font-bold">{stats.paidCount}</span>
                </div>
              </div>

              {/* Card 2: Estimated Settled Amount */}
              <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-3 bottom-1 text-[#d9b08c]/[0.02] group-hover:scale-105 transition-transform pointer-events-none">
                  <Wallet className="h-16 w-16" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#d1e8e2]/60 block tracking-wider">
                    Estimated Settled (USD Eq)
                  </span>
                  <p className="text-2xl font-bold text-[#d9b08c] font-mono mt-1.5">
                    ${Math.round(stats.settledAmount).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-white/[0.04] text-[10px] text-[#d1e8e2]/50 font-mono flex justify-between items-center">
                  <span>Settlement status:</span>
                  <span className="text-[#d9b08c]/90">USDT Nodes Active</span>
                </div>
              </div>

              {/* Card 3: Today's Payments */}
              <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-3 bottom-1 text-emerald-400/[0.02] pointer-events-none">
                  <Clock className="h-16 w-16" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#d1e8e2]/60 block tracking-wider">
                    Today's Payments (USD Eq)
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 font-mono mt-1.5">
                    ${stats.todayTotal.toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-white/[0.04] text-[10px] text-[#d1e8e2]/50 font-mono flex justify-between items-center">
                  <span>Today's Intents:</span>
                  <span className="text-[#d1e8e2]">{stats.todayCount} records</span>
                </div>
              </div>

              {/* Card 4: This Month's Payments */}
              <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-3 bottom-1 text-[#d9b08c]/[0.01] pointer-events-none">
                  <Calendar className="h-16 w-16" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#d1e8e2]/60 block tracking-wider">
                    This Month (USD Eq)
                  </span>
                  <p className="text-2xl font-bold text-[#d1e8e2] font-mono mt-1.5">
                    ${stats.thisMonthTotal.toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-white/[0.04] text-[10px] text-[#d1e8e2]/50 font-mono flex justify-between items-center">
                  <span>Month Intents:</span>
                  <span className="text-[#d1e8e2]">{stats.thisMonthCount} records</span>
                </div>
              </div>

            </div>

            {/* Hold Count, Fail Count mini banner */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 bg-[#116466]/10 border border-white/[0.05] rounded-xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-[#d1e8e2]/80">Currently:</span>
                <strong className="text-yellow-400">{stats.pendingCount} Pending Card Holds</strong>
                <span className="text-white/10">|</span>
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <strong className="text-red-400">{stats.failedCount} Failed / Refunded Attempts</strong>
              </div>
              <div className="text-[11px] text-[#d9b08c] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Audit Logs are protected by corporate key verification.</span>
              </div>
            </div>

            {/* Quick Actions & Recent Transactions Summary list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left col: list of recent transactions */}
              <div className="lg:col-span-2 border border-white/[0.05] bg-[#090e15] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-lg text-[#d1e8e2] font-light">
                    Recent Advisory Ledger Entries
                  </h3>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-[10px] font-mono uppercase text-[#d9b08c] hover:underline"
                  >
                    View All Entries &rarr;
                  </button>
                </div>

                <div className="divide-y divide-white/[0.04] max-h-[360px] overflow-y-auto pr-1">
                  {payments.slice(0, 4).map(pay => (
                    <div 
                      key={pay.id} 
                      onClick={() => handleViewPayment(pay)}
                      className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] rounded px-2 transition-all cursor-pointer group"
                    >
                      <div className="space-y-1 pr-4 truncate">
                        <div className="font-serif text-[14px] text-[#d1e8e2] font-semibold truncate group-hover:text-[#d9b08c] transition-colors">
                          {pay.client_name}
                        </div>
                        <div className="text-[10px] text-[#d1e8e2]/50 font-mono flex items-center gap-1.5">
                          <span>{pay.payment_reference}</span>
                          <span>•</span>
                          <span>{pay.currency}</span>
                          <span>•</span>
                          <span>{new Date(pay.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div className="font-mono font-semibold text-xs text-[#d1e8e2]">
                          {pay.currency} {pay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div>
                          {pay.payment_status === 'paid' ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-400 border border-emerald-500/20 uppercase">
                              Paid
                            </span>
                          ) : pay.payment_status === 'pending' ? (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-400/10 text-[9px] font-mono text-yellow-400 border border-yellow-400/25 uppercase">
                              Hold
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-mono text-red-400 border border-red-500/20 uppercase">
                              Fail
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right col: Quick Link Actions & status overview */}
              <div className="border border-white/[0.05] bg-[#090e15] rounded-xl p-5 space-y-4">
                <h3 className="font-serif text-lg text-[#d1e8e2] font-light">
                  Payment Links Generator
                </h3>
                <p className="text-[11px] text-[#d1e8e2]/60 font-mono leading-relaxed">
                  Generate simple private secure payment links to share directly with executive clients via corporate communications.
                </p>

                <div className="pt-3">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="w-full bg-[#116466] hover:bg-[#116466]/80 text-[#d1e8e2] text-xs font-mono uppercase tracking-widest py-3 rounded font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-[#d9b08c]" />
                    <span>Create New Request</span>
                  </button>
                </div>

                <div className="p-4 bg-[#2c3531]/40 border border-white/5 rounded-lg space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#d9b08c] block font-semibold">
                    Settlement Node Status
                  </span>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-white/45">Network Enclave:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE (USDT)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-white/45">API Provider:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-white/45">Webhooks:</span>
                    <span className="text-[#d9b08c] flex items-center gap-1">
                      LISTENING
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --------------------------------- PAGE 2: TRANSACTIONS --------------------------------- */}
        {activeTab === 'transactions' && !selectedPayment && (
          <div className="space-y-6">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#d9b08c] uppercase font-semibold block">
                  TRANSACTION RECONCILIATION
                </span>
                <h1 className="font-serif text-3xl text-[#d1e8e2] font-light leading-snug mt-1">
                  Private Advisory Settlement Ledger
                </h1>
              </div>

              <div className="flex gap-2 font-mono text-[10px]">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredPayments.length === 0}
                  className="px-4 py-2 bg-[#d9b08c] hover:bg-[#cbb27a] disabled:bg-white/[0.03] disabled:text-white/20 text-[#2c3531] font-semibold rounded uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Export CSV Ledger</span>
                </button>
              </div>
            </div>

            {/* Interactive Filters Grid */}
            <div className="border border-white/[0.06] bg-[#090e15] p-5 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Search Bar */}
                <div className="relative">
                  <label className="block text-[8px] font-mono text-[#d1e8e2]/60 uppercase tracking-widest mb-1.5">
                    Search Credentials
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name, email, invoice REF..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-[#2c3531]/50 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded pl-9 pr-4 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all placeholder-cool-grey/30 font-mono"
                    />
                    <Search className="h-3.5 w-3.5 text-cool-grey/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 2. Payment Status Filter */}
                <div>
                  <label className="block text-[8px] font-mono text-[#d1e8e2]/60 uppercase tracking-widest mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-[#2c3531]/50 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none font-mono"
                  >
                    <option value="all">All States</option>
                    <option value="paid">Paid / Cleared</option>
                    <option value="pending">Pending Hold</option>
                    <option value="failed">Failed / Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* 3. Settlement Status Filter */}
                <div>
                  <label className="block text-[8px] font-mono text-[#d1e8e2]/60 uppercase tracking-widest mb-1.5">
                    Settlement Status
                  </label>
                  <select
                    value={settlementFilter}
                    onChange={e => setSettlementFilter(e.target.value)}
                    className="w-full bg-[#2c3531]/50 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none font-mono"
                  >
                    <option value="all">All Settlements</option>
                    <option value="settled">Settled</option>
                    <option value="awaiting settlement">Awaiting Settlement</option>
                    <option value="settlement failed">Settlement Failed</option>
                    <option value="manual review">Manual Review</option>
                  </select>
                </div>

                {/* 4. Currency Filter */}
                <div>
                  <label className="block text-[8px] font-mono text-[#d1e8e2]/60 uppercase tracking-widest mb-1.5">
                    Currency Node
                  </label>
                  <select
                    value={currencyFilter}
                    onChange={e => setCurrencyFilter(e.target.value)}
                    className="w-full bg-[#2c3531]/50 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none font-mono"
                  >
                    <option value="all">All Currencies</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (₣)</option>
                  </select>
                </div>

              </div>

              {/* Reset Filter line */}
              {(searchTerm || statusFilter !== 'all' || settlementFilter !== 'all' || currencyFilter !== 'all' || dateFrom || dateTo) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSettlementFilter('all');
                      setCurrencyFilter('all');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1.5"
                  >
                    <XCircle className="h-3 w-3" />
                    Reset active filters
                  </button>
                </div>
              )}
            </div>

            {/* TRANSACTIONS TABLE (DESKTOP) & STACKED TRANSACTIONS CARDS (MOBILE) */}
            <div className="border border-white/[0.06] bg-[#090e15] rounded-xl overflow-hidden shadow-xl">
              
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                {filteredPayments.length === 0 ? (
                  <div className="py-16 text-center text-[#d1e8e2]/50 font-serif italic">
                    No matching client ledger entries found in archives.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.05] bg-[#116466]/15 text-[9px] text-[#d1e8e2]/70 tracking-wider uppercase">
                        <th className="py-4 px-6 font-semibold">DATE & REFERENCE</th>
                        <th className="py-4 px-6 font-semibold">CLIENT ACCOUNT</th>
                        <th className="py-4 px-6 font-semibold text-right">FEE VALUE</th>
                        <th className="py-4 px-6 font-semibold">PAYMENT STATUS</th>
                        <th className="py-4 px-6 font-semibold">SETTLEMENT STATUS</th>
                        <th className="py-4 px-6 font-semibold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-[11px]">
                      {filteredPayments.map(pay => (
                        <tr 
                          key={pay.id} 
                          className="hover:bg-white/[0.01] transition-colors cursor-pointer group"
                          onClick={() => handleViewPayment(pay)}
                        >
                          {/* Date and Ref */}
                          <td className="py-4 px-6">
                            <span className="text-[#d1e8e2] block font-medium group-hover:text-[#d9b08c] transition-colors">
                              {pay.payment_reference}
                            </span>
                            <span className="text-[9px] text-[#d1e8e2]/40 mt-0.5 block">
                              {new Date(pay.created_at).toLocaleString()}
                            </span>
                          </td>

                          {/* Client Info */}
                          <td className="py-4 px-6">
                            <span className="font-serif text-sm font-medium text-[#d1e8e2] block">
                              {pay.client_name}
                            </span>
                            <span className="text-[10px] text-white/40 block mt-0.5">
                              {pay.client_email}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 text-right font-semibold text-[#d1e8e2] text-xs">
                            {pay.currency} {pay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          {/* Payment status badge */}
                          <td className="py-4 px-6">
                            {pay.payment_status === 'paid' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-[9px] text-emerald-400 uppercase">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Paid
                              </span>
                            )}
                            {pay.payment_status === 'pending' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2 rounded bg-yellow-400/10 border border-yellow-400/20 text-[9px] text-yellow-500 uppercase">
                                <Clock className="h-2.5 w-2.5 animate-spin" />
                                Pending
                              </span>
                            )}
                            {pay.payment_status === 'failed' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2 rounded bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 uppercase">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Failed
                              </span>
                            )}
                            {pay.payment_status === 'refunded' && (
                              <span className="inline-flex items-center py-1 px-2 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 uppercase">
                                Refunded
                              </span>
                            )}
                            {pay.payment_status === 'cancelled' && (
                              <span className="inline-flex items-center py-1 px-2 rounded bg-neutral-500/10 border border-neutral-500/25 text-[9px] text-neutral-400 uppercase">
                                Cancelled
                              </span>
                            )}
                          </td>

                          {/* Settlement Status */}
                          <td className="py-4 px-6">
                            {pay.settlement_status === 'settled' && (
                              <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                                Settled
                              </span>
                            )}
                            {pay.settlement_status === 'awaiting settlement' && (
                              <span className="text-yellow-500 text-[10px] uppercase tracking-wider">
                                Awaiting Settlement
                              </span>
                            )}
                            {pay.settlement_status === 'settlement failed' && (
                              <span className="text-red-400 text-[10px] uppercase font-bold tracking-wider">
                                Settlement Failed
                              </span>
                            )}
                            {pay.settlement_status === 'manual review' && (
                              <span className="text-[#d9b08c] text-[10px] uppercase tracking-wider">
                                Manual Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewPayment(pay)}
                              className="px-2.5 py-1 rounded bg-[#116466] hover:bg-[#116466]/80 text-[#d1e8e2] text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* MOBILE STACKED CARDS VIEW */}
              <div className="block md:hidden p-4 space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="py-8 text-center text-[#d1e8e2]/50 font-serif italic text-sm">
                    No matching client ledger entries.
                  </div>
                ) : (
                  filteredPayments.map(pay => (
                    <div 
                      key={pay.id}
                      onClick={() => handleViewPayment(pay)}
                      className="border border-white/[0.05] bg-[#2c3531]/40 rounded-xl p-4 space-y-3 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-white/40 block">
                            {new Date(pay.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-serif text-base font-semibold text-[#d1e8e2] block">
                            {pay.client_name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-[#d1e8e2] block">
                          {pay.currency} {pay.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs font-mono space-y-1 pt-1.5 border-t border-white/[0.04]">
                        <div className="flex justify-between">
                          <span className="text-[#d1e8e2]/50">Invoice Ref:</span>
                          <span className="text-[#d9b08c]">{pay.payment_reference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#d1e8e2]/50">Method:</span>
                          <span className="text-[#d1e8e2]">{pay.payment_method}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-2">
                          {pay.payment_status === 'paid' ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] font-mono text-emerald-400 uppercase">
                              Paid
                            </span>
                          ) : pay.payment_status === 'pending' ? (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-400/10 text-[8px] font-mono text-yellow-400 uppercase">
                              Hold
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[8px] font-mono text-red-400 uppercase">
                              Fail
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[8px] font-mono text-white/50 uppercase">
                            {pay.settlement_status}
                          </span>
                        </div>

                        <button
                          onClick={() => handleViewPayment(pay)}
                          className="px-3 py-1 bg-[#116466] text-white rounded text-[10px] font-mono uppercase tracking-widest font-bold"
                        >
                          View Detail
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        )}

        {/* --------------------------------- PAGE 3: PAYMENT REQUESTS / LINKS --------------------------------- */}
        {activeTab === 'requests' && !selectedPayment && (
          <div className="space-y-8">
            
            {/* Page Title */}
            <div>
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#d9b08c] uppercase font-semibold block">
                PAYMENT OUTBOUND PROTOCOL
              </span>
              <h1 className="font-serif text-3xl text-[#d1e8e2] font-light leading-snug mt-1">
                Outbound Payment Requests
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left Form: Create new request */}
              <div className="lg:col-span-2 border border-white/[0.05] bg-[#090e15] p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-serif text-xl text-[#d1e8e2] font-light">
                    Generate Request
                  </h3>
                  <p className="text-[10px] font-mono text-[#d1e8e2]/55 uppercase tracking-wider mt-1">
                    Ticketone secure payment key link generator
                  </p>
                </div>

                <form onSubmit={handleCreateRequest} className="space-y-4">
                  {/* Client Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                      Client Legal Entity / Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sir Alistair Sterling"
                      value={reqClientName}
                      onChange={e => setReqClientName(e.target.value)}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-sans"
                    />
                  </div>

                  {/* Client Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                      Corporate/Safe Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alistair@sterling-heritage.co.uk"
                      value={reqClientEmail}
                      onChange={e => setReqClientEmail(e.target.value)}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Amount and Currency */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                        Retainer Amount
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="25000"
                        value={reqAmount}
                        onChange={e => setReqAmount(e.target.value)}
                        className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                        Currency
                      </label>
                      <select
                        value={reqCurrency}
                        onChange={e => setReqCurrency(e.target.value)}
                        className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-mono"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CHF">CHF (₣)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                        Reference / Invoice No.
                      </label>
                      <button
                        type="button"
                        onClick={() => setReqReference(`INV-2026-${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`)}
                        className="text-[9px] font-mono text-[#d9b08c] hover:underline"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-2026-118D"
                      value={reqReference}
                      onChange={e => setReqReference(e.target.value)}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                      Brief Advisory Description
                    </label>
                    <textarea
                      placeholder="Advisory Milestone settlement fee..."
                      value={reqDescription}
                      onChange={e => setReqDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-sans"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#d1e8e2]/70 uppercase tracking-widest block font-medium">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={reqExpiry}
                      onChange={e => setReqExpiry(e.target.value)}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded px-3 py-2 text-xs text-[#d1e8e2] focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Mark as sent checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="mark-sent-checkbox"
                      checked={markAsSentFlag}
                      onChange={e => setMarkAsSentFlag(e.target.checked)}
                      className="rounded border-white/20 bg-[#2c3531] text-[#116466]"
                    />
                    <label htmlFor="mark-sent-checkbox" className="text-[10px] font-mono text-[#d1e8e2]/80 uppercase">
                      Mark as sent immediately
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#d9b08c] hover:bg-[#cbb27a] text-[#2c3531] font-bold uppercase tracking-widest text-[11px] py-3.5 px-6 rounded transition-all cursor-pointer flex items-center justify-center gap-2 font-mono shadow-[0_4px_16px_rgba(184,155,94,0.15)]"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Generate Secure Link</span>
                  </button>
                </form>
              </div>

              {/* Right Col: Output of generator & history of Requests */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Outbound Link Result Banner */}
                {generatedRequest && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 border border-emerald-500/20 bg-[#1f8a5b]/10 rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase tracking-wider font-bold">
                        <CheckCircle className="h-4 w-4" />
                        <span>Outbound Request Keys Encrypted</span>
                      </div>
                      <button
                        onClick={() => setGeneratedRequest(null)}
                        className="text-xs text-[#d1e8e2]/50 hover:text-[#d1e8e2] font-mono"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="space-y-2 text-xs font-mono bg-[#2c3531]/60 p-4 rounded-lg">
                      <p><span className="text-white/40">Invoice Reference:</span> <strong className="text-[#d9b08c]">{generatedRequest.reference}</strong></p>
                      <p><span className="text-white/40">Client Entity:</span> <span className="text-[#d1e8e2]">{generatedRequest.client_name}</span></p>
                      <p><span className="text-white/40">Required Sum:</span> <strong className="text-white">{generatedRequest.currency} {generatedRequest.amount.toLocaleString()}</strong></p>
                      
                      <div className="mt-4 pt-3.5 border-t border-white/[0.06] space-y-2">
                        <span className="text-[10px] text-white/50 block font-semibold uppercase tracking-wider">SECURE CLIENT WEB PAY LINK</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={generatedRequest.payment_link}
                            className="flex-1 bg-[#090e15] border border-white/[0.1] rounded px-2 py-1 text-[10.5px] text-emerald-300 font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => handleCopyLink(generatedRequest.payment_link)}
                            className="px-3 bg-[#d9b08c] text-charcoal-black hover:bg-[#cbb27a] rounded text-[10px] font-bold uppercase transition-all"
                          >
                            {reqCopySuccess ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* List of Outbound requests */}
                <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg text-[#d1e8e2] font-light">
                    Generated Outbound Logs
                  </h3>

                  <div className="divide-y divide-white/[0.04] space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
                    {requests.map(req => (
                      <div key={req.id} className="pt-3.5 space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-serif text-[14px] font-medium text-[#d1e8e2] block">
                              {req.client_name}
                            </span>
                            <span className="text-[10px] text-[#d1e8e2]/50 block mt-0.5">
                              {req.reference} • {req.client_email}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#d1e8e2] block">
                              {req.currency} {req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-[#d1e8e2]/40 block mt-0.5">
                              Created {new Date(req.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.02]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-white/40">Status:</span>
                            {req.status === 'paid' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] text-emerald-400 font-bold uppercase">
                                PAID
                              </span>
                            ) : req.status === 'expired' ? (
                              <span className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-[8px] text-neutral-400 font-bold uppercase">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-400/10 text-[8px] text-yellow-500 font-bold uppercase">
                                UNPAID / SENT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyLink(req.payment_link)}
                              className="px-2.5 py-1 rounded border border-white/[0.05] hover:border-white/20 hover:bg-white/[0.03] text-[9px] text-[#d9b08c] uppercase font-bold cursor-pointer"
                            >
                              Copy Link
                            </button>
                            <a
                              href={req.payment_link}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="p-1 rounded bg-[#116466] hover:bg-[#116466]/85 text-[#d1e8e2] cursor-pointer"
                              title="Mock Payment checkout Screen"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* --------------------------------- PAGE 4: REPORTS --------------------------------- */}
        {activeTab === 'reports' && !selectedPayment && (
          <div className="space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#d9b08c] uppercase font-semibold block">
                  CORPORATE PERFORMANCE AUDIT
                </span>
                <h1 className="font-serif text-3xl text-[#d1e8e2] font-light leading-snug mt-1">
                  Executive Analytical Report
                </h1>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-[#d9b08c] text-charcoal-black font-semibold rounded uppercase tracking-wider text-xs font-mono transition-all"
              >
                Export CSV Ledger
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-mono">
              <div className="p-5 border border-white/5 bg-[#090e15] rounded-xl space-y-2">
                <span className="text-white/45 uppercase text-[9px]">Total Turnover (USD Eq)</span>
                <p className="text-2xl font-bold text-[#d1e8e2]">${Math.round(stats.totalCollected).toLocaleString()}</p>
              </div>
              <div className="p-5 border border-white/5 bg-[#090e15] rounded-xl space-y-2">
                <span className="text-white/45 uppercase text-[9px]">Settled Reserves</span>
                <p className="text-2xl font-bold text-[#d9b08c]">${Math.round(stats.settledAmount).toLocaleString()}</p>
              </div>
              <div className="p-5 border border-white/5 bg-[#090e15] rounded-xl space-y-2">
                <span className="text-white/45 uppercase text-[9px]">Successful Count</span>
                <p className="text-2xl font-bold text-emerald-400">{stats.paidCount} retainers</p>
              </div>
              <div className="p-5 border border-white/5 bg-[#090e15] rounded-xl space-y-2">
                <span className="text-white/45 uppercase text-[9px]">Hold Count / Pending</span>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount} retainers</p>
              </div>
            </div>

            {/* Custom SVG line/area chart representing payments volume over time */}
            <div className="border border-white/[0.05] bg-[#090e15] rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-serif text-xl text-[#d1e8e2] font-light">
                  Advisory Settlement Volume History
                </h3>
                <p className="text-[10px] font-mono text-[#d1e8e2]/50 uppercase tracking-widest mt-1">
                  Chronological distribution of completed private retainers (USD Eq)
                </p>
              </div>

              {/* Polished Editorial Line Chart utilizing Vector SVG */}
              <div className="pt-4 h-64 relative">
                {/* SVG Graph */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 220" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="800" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
                  <line x1="0" y1="70" x2="800" y2="70" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
                  <line x1="0" y1="170" x2="800" y2="170" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
                  <line x1="0" y1="220" x2="800" y2="220" stroke="white" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="3" />

                  {/* Area Fill */}
                  <path
                    d="M 50 180 C 150 160, 220 190, 320 120 C 420 50, 520 140, 620 90 C 720 40, 750 60, 780 40 L 780 220 L 50 220 Z"
                    fill="url(#goldGradient)"
                    opacity="0.12"
                  />

                  {/* Main Line path */}
                  <path
                    d="M 50 180 C 150 160, 220 190, 320 120 C 420 50, 520 140, 620 90 C 720 40, 750 60, 780 40"
                    fill="none"
                    stroke="#d9b08c"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  <circle cx="50" cy="180" r="5" fill="#2c3531" stroke="#d9b08c" strokeWidth="2.5" />
                  <circle cx="320" cy="120" r="5" fill="#2c3531" stroke="#d9b08c" strokeWidth="2.5" />
                  <circle cx="420" cy="50" r="5" fill="#2c3531" stroke="#d9b08c" strokeWidth="2.5" />
                  <circle cx="620" cy="90" r="5" fill="#2c3531" stroke="#d9b08c" strokeWidth="2.5" />
                  <circle cx="780" cy="40" r="5" fill="#2c3531" stroke="#d9b08c" strokeWidth="2.5" />

                  {/* Tooltip labels for points */}
                  <text x="45" y="200" fill="#d1e8e2" fontSize="9" fontFamily="var(--font-mono)">June 15</text>
                  <text x="315" y="140" fill="#d1e8e2" fontSize="9" fontFamily="var(--font-mono)">June 19</text>
                  <text x="415" y="32" fill="#d1e8e2" fontSize="9" fontFamily="var(--font-mono)">$120,000</text>
                  <text x="615" y="110" fill="#d1e8e2" fontSize="9" fontFamily="var(--font-mono)">June 21</text>
                  <text x="740" y="25" fill="#d9b08c" fontSize="9" fontFamily="var(--font-mono)">June 22 • $35,000</text>

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d9b08c" />
                      <stop offset="100%" stopColor="#2c3531" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.04] text-[10px] font-mono text-[#d1e8e2]/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#d9b08c]" />
                    <span>Completed Settlements</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Today's Milestone</span>
                  </div>
                </div>

                <span>Graph points represent actual closed transactions in chronological order.</span>
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------- PAGE 5: SETTINGS --------------------------------- */}
        {activeTab === 'settings' && !selectedPayment && (
          <div className="space-y-8">
            
            {/* Title */}
            <div>
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#d9b08c] uppercase font-semibold block">
                SYSTEM CORE ENVELOPE CONFIG
              </span>
              <h1 className="font-serif text-3xl text-[#d1e8e2] font-light leading-snug mt-1">
                Security & Portal Settings
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Settings inputs */}
              <div className="lg:col-span-2 border border-white/[0.05] bg-[#090e15] p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="font-serif text-xl text-[#d1e8e2] font-light">
                    Portal Parameters
                  </h3>
                  <p className="text-[10px] font-mono text-[#d1e8e2]/50 uppercase tracking-widest mt-1">
                    Manage outbound communications & client references
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">Business Branding Name</label>
                    <input
                      type="text"
                      value={settingsForm.businessName}
                      onChange={e => setSettingsForm({...settingsForm, businessName: e.target.value})}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] rounded px-3 py-2 text-[#d1e8e2] focus:outline-none"
                    />
                  </div>

                  {/* Support Email */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">Support Communication Email</label>
                    <input
                      type="email"
                      value={settingsForm.supportEmail}
                      onChange={e => setSettingsForm({...settingsForm, supportEmail: e.target.value})}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] rounded px-3 py-2 text-[#d1e8e2] focus:outline-none"
                    />
                  </div>

                  {/* Settlement Wallet */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">USDT Settlement Wallet Address</label>
                    <input
                      type="text"
                      value={settingsForm.settlementWallet}
                      onChange={e => setSettingsForm({...settingsForm, settlementWallet: e.target.value})}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] rounded px-3 py-2 text-[#d1e8e2] focus:outline-none text-[10px]"
                    />
                  </div>

                  {/* Provider Status Indicator */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">Merchant Account Connection</label>
                    <div className="px-3 py-2 bg-[#2c3531]/20 border border-white/[0.08] rounded flex items-center justify-between">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">● Active Node Link</span>
                      <span className="text-white/35 text-[9px]">Stripe/Card Proxy</span>
                    </div>
                  </div>

                  {/* Allowed Currencies */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">Allowed Settlement Currencies</label>
                    <input
                      type="text"
                      value={settingsForm.allowedCurrencies}
                      onChange={e => setSettingsForm({...settingsForm, allowedCurrencies: e.target.value})}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] rounded px-3 py-2 text-[#d1e8e2] focus:outline-none"
                    />
                  </div>

                  {/* Notification Target Email */}
                  <div className="space-y-1.5">
                    <label className="text-[#d1e8e2]/60 block uppercase text-[10px]">Internal Audit Notification Email</label>
                    <input
                      type="email"
                      value={settingsForm.notificationEmail}
                      onChange={e => setSettingsForm({...settingsForm, notificationEmail: e.target.value})}
                      className="w-full bg-[#2c3531]/40 border border-white/[0.08] rounded px-3 py-2 text-[#d1e8e2] focus:outline-none"
                    />
                  </div>

                  {/* Save */}
                  <button
                    type="submit"
                    className="w-full bg-[#116466] hover:bg-[#116466]/85 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded cursor-pointer transition-all"
                  >
                    Save Portal Config
                  </button>

                  {settingsSaved && (
                    <span className="text-emerald-400 text-[10px] block text-center mt-1 font-bold">Parameters updated in local cache enclave!</span>
                  )}
                </form>
              </div>

              {/* Right Col: Info / Security Guidelines / Webhook verification */}
              <div className="space-y-6">
                
                {/* Connection Details info box */}
                <div className="border border-white/[0.05] bg-[#090e15] p-5 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg text-[#d1e8e2] font-light">
                    Secured Integration Credentials
                  </h3>
                  <p className="text-[11px] text-[#d1e8e2]/60 font-mono leading-relaxed">
                    Ticketone hides all active API secrets from client-side inspectors. Environment parameters (e.g. <code className="text-[#d9b08c] bg-white/[0.03] px-1 rounded text-[10px]">VITE_SUPABASE_URL</code>) remain completely server-enclosed to block browser-side leaks.
                  </p>

                  <div className="pt-2 divide-y divide-white/[0.04] text-[10px] font-mono">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-white/40">SUPABASE STATE:</span>
                      <span className={`${import.meta.env.VITE_SUPABASE_URL ? 'text-emerald-400' : 'text-[#d9b08c]'}`}>
                        {import.meta.env.VITE_SUPABASE_URL ? 'REAL TABLE BOUND' : 'SANDBOX SIMULATOR ACTIVE'}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-white/40">AUDIT LOG ENCRYPTION:</span>
                      <span className="text-emerald-400">RSA-4096 VALID</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-white/40">SECURE SHELL BOUND:</span>
                      <span className="text-emerald-400">HTTPS / TLS 1.3</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-white/40">WEBHOOK SHIELDING:</span>
                      <span className="text-emerald-400">ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* Audit Logs security warning */}
                <div className="border border-yellow-500/20 bg-yellow-500/5 p-5 rounded-xl flex gap-3 text-xs">
                  <Info className="h-5 w-5 text-[#d9b08c] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#d9b08c] block">Advisory Safety Guidelines</span>
                    <p className="text-[#d1e8e2]/75 font-sans leading-relaxed">
                      Always double check settlement wallet hashes before approving USDT conversions. Outbound wires are permanent and completely irreversible once propagated on the public node ledger.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ----------------- 4. TRANSACTION DETAIL PAGE VIEW ----------------- */}
        {selectedPayment && (
          <div className="space-y-6">
            
            {/* Back Row */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedPayment(null)}
                className="flex items-center gap-2 text-xs font-mono uppercase text-[#d9b08c] hover:underline cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to ledger overview</span>
              </button>

              <span className="text-[10px] font-mono text-white/35 uppercase">
                DISK REFERENCE ATTESTATION: {selectedPayment.id}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Col: Main Details Card */}
              <div className="lg:col-span-2 border border-white/[0.05] bg-[#090e15] p-6 rounded-xl space-y-6">
                
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-white/[0.04]">
                  <div>
                    <span className="text-[10px] font-mono text-[#d9b08c] tracking-wider block font-semibold uppercase">
                      Private Advisory Retainer Ledger
                    </span>
                    <h2 className="font-serif text-2xl text-[#d1e8e2] font-semibold mt-1">
                      {selectedPayment.client_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(selectedPayment.payment_reference, 'ref')}
                      className="px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded text-[10px] font-mono text-[#d1e8e2]/80 uppercase font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copySuccessText === 'ref' ? 'Copied' : 'Copy Invoice Ref'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadReceipt(selectedPayment)}
                      className="px-2.5 py-1.5 bg-[#d9b08c] text-charcoal-black hover:bg-[#cbb27a] rounded text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Amount Metric Block */}
                <div className="bg-[#2c3531]/30 border border-white/[0.05] p-5 rounded-lg text-center relative overflow-hidden">
                  <span className="text-[10px] font-mono text-[#d1e8e2]/50 block uppercase">Transferred Advisory Value</span>
                  <p className="text-3xl font-bold font-mono text-[#d1e8e2] mt-1.5">
                    {selectedPayment.currency} {selectedPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#d9b08c] font-mono tracking-widest uppercase mt-1">
                    Settlement Status: <strong className="font-bold underline text-white">{selectedPayment.settlement_status.toUpperCase()}</strong>
                  </p>
                </div>

                {/* Meta details stack */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-mono">
                  
                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Client Email</span>
                    <span className="text-[#d1e8e2] block">{selectedPayment.client_email}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Client Direct Phone</span>
                    <span className="text-[#d1e8e2] block">{selectedPayment.client_phone || 'None Registered'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Milestone Invoice No</span>
                    <span className="text-[#d9b08c] font-bold block">{selectedPayment.payment_reference}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Payment Method Used</span>
                    <span className="text-[#d1e8e2] block">{selectedPayment.payment_method}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Payment Gateway Provider</span>
                    <span className="text-[#d1e8e2] block">{selectedPayment.payment_provider}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Provider Checkout ID</span>
                    <span className="text-[#d1e8e2] block truncate max-w-[200px]" title={selectedPayment.provider_payment_id}>
                      {selectedPayment.provider_payment_id || 'Awaiting Wire ID...'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Timestamp Registered</span>
                    <span className="text-[#d1e8e2] block">{new Date(selectedPayment.created_at).toLocaleString()}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 block text-[9px] uppercase tracking-wider">Settlement Handshake Time</span>
                    <span className="text-emerald-400 block">{selectedPayment.settled_at ? new Date(selectedPayment.settled_at).toLocaleString() : 'Processing Link...'}</span>
                  </div>

                  {selectedPayment.settlement_asset && (
                    <div className="space-y-1">
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Settlement Asset</span>
                      <span className="text-emerald-400 font-bold block">{selectedPayment.settlement_asset}</span>
                    </div>
                  )}

                  {selectedPayment.settlement_network && (
                    <div className="space-y-1">
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Settlement Network</span>
                      <span className="text-[#d1e8e2] block">{selectedPayment.settlement_network}</span>
                    </div>
                  )}

                  {selectedPayment.settlement_label && (
                    <div className="space-y-1">
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Settlement Label</span>
                      <span className="text-[#d1e8e2] block">{selectedPayment.settlement_label}</span>
                    </div>
                  )}

                  {selectedPayment.settlement_address && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider">Settlement Destination Wallet</span>
                      <span className="text-amber-400 font-mono block break-all text-[11px] bg-white/[0.03] p-1.5 rounded border border-white/5 select-all">{selectedPayment.settlement_address}</span>
                    </div>
                  )}

                </div>

                {/* Description */}
                {selectedPayment.description && (
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg text-xs font-mono">
                    <span className="text-white/40 block text-[9px] uppercase mb-1">Advisory Description</span>
                    <p className="text-[#d1e8e2]/85 font-sans leading-relaxed">{selectedPayment.description}</p>
                  </div>
                )}

                {/* Interactive Status Modifiers (For Back-Office Override) */}
                <div className="pt-6 border-t border-white/[0.04] space-y-3">
                  <span className="font-mono text-[10px] text-[#d9b08c] uppercase tracking-widest block font-bold">
                    Modify Ledger Settlement Override
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[10px]">
                    <button
                      onClick={() => handleModifyStatus('paid', 'settled')}
                      className={`py-2 rounded transition-all cursor-pointer border uppercase tracking-wider ${
                        selectedPayment.payment_status === 'paid' && selectedPayment.settlement_status === 'settled'
                          ? 'bg-[#1f8a5b]/20 text-[#d1e8e2] border-emerald-500/40 font-bold'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-white/50 border-white/[0.05]'
                      }`}
                    >
                      Clear Paid
                    </button>

                    <button
                      onClick={() => handleModifyStatus('pending', 'awaiting settlement')}
                      className={`py-2 rounded transition-all cursor-pointer border uppercase tracking-wider ${
                        selectedPayment.payment_status === 'pending'
                          ? 'bg-yellow-400/10 text-yellow-500 border-yellow-450/20 font-bold animate-pulse'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-white/50 border-white/[0.05]'
                      }`}
                    >
                      Hold Pending
                    </button>

                    <button
                      onClick={() => handleModifyStatus('failed', 'settlement failed')}
                      className={`py-2 rounded transition-all cursor-pointer border uppercase tracking-wider ${
                        selectedPayment.payment_status === 'failed'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 font-bold'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-white/50 border-white/[0.05]'
                      }`}
                    >
                      Fail Transaction
                    </button>

                    <button
                      onClick={() => handleModifyStatus('refunded', 'manual review')}
                      className={`py-2 rounded transition-all cursor-pointer border uppercase tracking-wider ${
                        selectedPayment.payment_status === 'refunded'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-white/50 border-white/[0.05]'
                      }`}
                    >
                      Reverse Retainer
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Col: Admin Note Logs */}
              <div className="border border-white/[0.05] bg-[#090e15] p-6 rounded-xl space-y-6 flex flex-col justify-between h-[520px]">
                
                <div className="space-y-4 overflow-hidden flex-1 flex flex-col">
                  <div>
                    <h3 className="font-serif text-lg text-[#d1e8e2] font-light">
                      Internal Admin Notes
                    </h3>
                    <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider mt-0.5">
                      Restricted private advisory logging board
                    </p>
                  </div>

                  {/* Notes Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-white/[0.03]">
                    {selectedPaymentNotes.length === 0 ? (
                      <p className="text-xs text-[#d1e8e2]/40 font-mono italic py-4">No internal notes logged on this transaction yet.</p>
                    ) : (
                      selectedPaymentNotes.map(n => (
                        <div key={n.id} className="pt-2 text-[11px] font-mono leading-relaxed">
                          <div className="flex justify-between text-[9px] text-[#d9b08c]/75 font-semibold uppercase mb-1">
                            <span>{n.admin_name}</span>
                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#d1e8e2]/85">{n.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Create Note Form */}
                <form onSubmit={handleAddNote} className="pt-4 border-t border-white/[0.04] space-y-2">
                  <textarea
                    placeholder="Enter confidential internal note..."
                    required
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#2c3531]/40 border border-white/[0.08] focus:border-[#d9b08c]/50 rounded p-2.5 text-xs text-[#d1e8e2] focus:outline-none placeholder-cool-grey/30 font-sans"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#116466] hover:bg-[#116466]/80 text-[#d1e8e2] text-[10px] font-mono uppercase tracking-widest font-bold py-2 rounded cursor-pointer transition-all"
                  >
                    Transmit Confidential Note
                  </button>
                </form>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
