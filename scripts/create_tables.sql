-- Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User authentication and role data
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login request tracking
CREATE TABLE IF NOT EXISTS login_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,
  message TEXT
);

-- Vendor management
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer management
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('frequent', 'new')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product inventory
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  cost_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  category TEXT,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase history for products
CREATE TABLE IF NOT EXISTS purchase_history_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(18,4) NOT NULL,
  total_cost NUMERIC(18,4) NOT NULL
);

-- Deals and promotions
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice metadata
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_cost NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_profit NUMERIC(18,4) NOT NULL DEFAULT 0,
  profit_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Sales history for products (derived from invoices)
CREATE TABLE IF NOT EXISTS sales_history_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(18,4) NOT NULL,
  total_price NUMERIC(18,4) NOT NULL,
  profit NUMERIC(18,4) NOT NULL
);

-- Line items for each invoice
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  cost_price NUMERIC(18,4) NOT NULL DEFAULT 0
);

-- Soft-deleted items and trash storage
CREATE TABLE IF NOT EXISTS trash_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'invoice', 'deal', 'vendor', 'customer')),
  data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
