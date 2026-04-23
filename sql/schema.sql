-- Stoaix Partner Panel Database Schema
-- Run this in Supabase SQL Editor

-- Enums
CREATE TYPE partner_tier AS ENUM ('starter', 'growth', 'pro');
CREATE TYPE partner_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE conversion_status AS ENUM ('active', 'churned', 'cancelled');
CREATE TYPE commission_status AS ENUM ('calculated', 'confirmed', 'paid');
CREATE TYPE payout_method AS ENUM ('bank_transfer', 'paypal');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Partners table
CREATE TABLE partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  company_name text,
  is_admin boolean DEFAULT false NOT NULL,
  tier partner_tier DEFAULT 'starter' NOT NULL,
  active_clients int DEFAULT 0 NOT NULL,
  status partner_status DEFAULT 'active' NOT NULL,
  total_earnings decimal(12,2) DEFAULT 0 NOT NULL,
  pending_balance decimal(12,2) DEFAULT 0 NOT NULL,
  paid_balance decimal(12,2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Referral links
CREATE TABLE referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  destination_url text DEFAULT 'https://stoaix.com' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  click_count int DEFAULT 0 NOT NULL,
  conversion_count int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Clicks tracking
CREATE TABLE clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES referral_links(id) ON DELETE CASCADE NOT NULL,
  ip_hash text,
  user_agent text,
  referrer text,
  country text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Conversions (referred clients)
CREATE TABLE conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  link_id uuid REFERENCES referral_links(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  organization_name text NOT NULL,
  plan_type text NOT NULL,
  monthly_price decimal(10,2) NOT NULL,
  status conversion_status DEFAULT 'active' NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  churned_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Monthly commissions
CREATE TABLE monthly_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  period date NOT NULL,
  tier_at_time partner_tier NOT NULL,
  rate_at_time decimal(4,2) NOT NULL,
  active_clients_count int NOT NULL,
  total_revenue decimal(12,2) NOT NULL,
  commission_amount decimal(12,2) NOT NULL,
  status commission_status DEFAULT 'calculated' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(partner_id, period)
);

-- Payouts
CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12,2) NOT NULL,
  method payout_method NOT NULL,
  status payout_status DEFAULT 'pending' NOT NULL,
  reference text,
  requested_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_referral_links_partner ON referral_links(partner_id);
CREATE INDEX idx_referral_links_code ON referral_links(code);
CREATE INDEX idx_clicks_link ON clicks(link_id);
CREATE INDEX idx_clicks_created ON clicks(created_at);
CREATE INDEX idx_conversions_partner ON conversions(partner_id);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_monthly_commissions_partner ON monthly_commissions(partner_id);
CREATE INDEX idx_monthly_commissions_period ON monthly_commissions(period);
CREATE INDEX idx_payouts_partner ON payouts(partner_id);
CREATE INDEX idx_notifications_partner ON notifications(partner_id);
CREATE INDEX idx_notifications_unread ON notifications(partner_id, is_read) WHERE NOT is_read;

-- RLS Policies
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Partners: users can only see their own record
CREATE POLICY "Partners can view own record" ON partners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Partners can update own record" ON partners
  FOR UPDATE USING (user_id = auth.uid());

-- Referral links: partners can manage their own links
CREATE POLICY "Partners can view own links" ON referral_links
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can create links" ON referral_links
  FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can update own links" ON referral_links
  FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can delete own links" ON referral_links
  FOR DELETE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Clicks: readable by link owner
CREATE POLICY "Partners can view clicks on own links" ON clicks
  FOR SELECT USING (link_id IN (
    SELECT id FROM referral_links WHERE partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  ));

-- Conversions: partners can view their own
CREATE POLICY "Partners can view own conversions" ON conversions
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Monthly commissions: partners can view their own
CREATE POLICY "Partners can view own commissions" ON monthly_commissions
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Payouts: partners can view and create their own
CREATE POLICY "Partners can view own payouts" ON payouts
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can request payouts" ON payouts
  FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Notifications: partners can view and update their own
CREATE POLICY "Partners can view own notifications" ON notifications
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners can mark notifications read" ON notifications
  FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create partner record after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.partners (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: Recalculate partner active_clients count and tier
CREATE OR REPLACE FUNCTION recalculate_partner_stats(p_partner_id uuid)
RETURNS void AS $$
DECLARE
  v_active_count int;
  v_new_tier partner_tier;
BEGIN
  SELECT COUNT(*) INTO v_active_count
  FROM conversions
  WHERE partner_id = p_partner_id AND status = 'active';

  IF v_active_count >= 10 THEN v_new_tier := 'pro';
  ELSIF v_active_count >= 5 THEN v_new_tier := 'growth';
  ELSE v_new_tier := 'starter';
  END IF;

  UPDATE partners
  SET active_clients = v_active_count, tier = v_new_tier
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate monthly commission for a partner
CREATE OR REPLACE FUNCTION calculate_monthly_commission(p_partner_id uuid, p_period date)
RETURNS void AS $$
DECLARE
  v_active_count int;
  v_tier partner_tier;
  v_rate decimal(4,2);
  v_total_revenue decimal(12,2);
  v_commission decimal(12,2);
BEGIN
  -- Count active clients for this partner
  SELECT COUNT(*), COALESCE(SUM(monthly_price), 0)
  INTO v_active_count, v_total_revenue
  FROM conversions
  WHERE partner_id = p_partner_id AND status = 'active';

  -- Determine tier and rate
  IF v_active_count >= 10 THEN v_tier := 'pro'; v_rate := 0.30;
  ELSIF v_active_count >= 5 THEN v_tier := 'growth'; v_rate := 0.20;
  ELSE v_tier := 'starter'; v_rate := 0.10;
  END IF;

  v_commission := v_total_revenue * v_rate;

  -- Upsert monthly commission record
  INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status)
  VALUES (p_partner_id, p_period, v_tier, v_rate, v_active_count, v_total_revenue, v_commission, 'calculated')
  ON CONFLICT (partner_id, period)
  DO UPDATE SET
    tier_at_time = EXCLUDED.tier_at_time,
    rate_at_time = EXCLUDED.rate_at_time,
    active_clients_count = EXCLUDED.active_clients_count,
    total_revenue = EXCLUDED.total_revenue,
    commission_amount = EXCLUDED.commission_amount;

  -- Update partner balances
  UPDATE partners
  SET pending_balance = pending_balance + v_commission,
      total_earnings = total_earnings + v_commission,
      tier = v_tier,
      active_clients = v_active_count
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
