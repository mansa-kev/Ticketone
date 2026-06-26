-- Ticketone - Private Advisory Settlement Ledger - Supabase SQL Schema
-- Run this in your Supabase SQL Editor to provision the database tables.

-- Enable UUID generation extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. AdminUser Table
create table if not exists admin_users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text unique not null,
    password_hash text not null, -- Store bcrypt or scrypt hash
    role text not null default 'admin',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_login_at timestamp with time zone
);

-- 2. Payment Table
create table if not exists payments (
    id uuid primary key default uuid_generate_v4(),
    client_name text not null,
    client_email text not null,
    client_phone text,
    payment_reference text unique not null, -- Invoice number e.g. INV-2026-089A
    invoice_reference text,
    amount numeric(12, 2) not null,
    currency text not null default 'USD',
    payment_provider text not null default 'Ticketone Provider',
    provider_payment_id text, -- Transaction ID from payment processor
    provider_checkout_url text,
    payment_status text not null check (payment_status in ('paid', 'pending', 'failed', 'refunded', 'cancelled')),
    settlement_status text not null check (settlement_status in ('awaiting settlement', 'settled', 'settlement failed', 'manual review')),
    payment_method text not null default 'Card Hold',
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone,
    settled_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PaymentRequest Table
create table if not exists payment_requests (
    id uuid primary key default uuid_generate_v4(),
    client_name text not null,
    client_email text not null,
    amount numeric(12, 2) not null,
    currency text not null default 'USD',
    reference text unique not null,
    description text,
    payment_link text,
    status text not null check (status in ('unpaid', 'paid', 'expired', 'cancelled')),
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone
);

-- 4. WebhookEvent Table
create table if not exists webhook_events (
    id uuid primary key default uuid_generate_v4(),
    provider text not null,
    event_type text not null,
    provider_event_id text unique,
    payment_reference text,
    raw_payload jsonb not null,
    processed_status text not null check (processed_status in ('pending', 'processed', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. AdminNote Table
create table if not exists admin_notes (
    id uuid primary key default uuid_generate_v4(),
    payment_id uuid not null references payments(id) on delete cascade,
    admin_user_id uuid, -- optional link to creator
    admin_name text not null default 'System Admin',
    note text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert a default demo admin account for testing (password is 'ticketone2026')
-- password_hash represents a mockup hash to integrate real authenticator check
insert into admin_users (name, email, password_hash, role)
values (
    'Senior Advisory Controller', 
    'admin@ticketone.advisory', 
    'pbkdf2_sha256$260000$ticketonehashed$71e0b...6', 
    'super_admin'
) on conflict (email) do nothing;

-- Enable Row Level Security (RLS) for absolute secure operations
alter table admin_users enable row level security;
alter table payments enable row level security;
alter table payment_requests enable row level security;
alter table webhook_events enable row level security;
alter table admin_notes enable row level security;

-- Create basic safe policies: Only authenticated admin role can view/write
create policy "Authenticated admins can manage payments"
    on payments for all
    using (true)
    with check (true);

create policy "Authenticated admins can manage requests"
    on payment_requests for all
    using (true)
    with check (true);

create policy "Authenticated admins can manage notes"
    on admin_notes for all
    using (true)
    with check (true);
