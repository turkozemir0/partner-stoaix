-- Payments table: tracks real Stripe invoice payments for conversions
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id uuid REFERENCES conversions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  stripe_invoice_id text UNIQUE NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_conversion ON payments(conversion_id);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own payments" ON payments
  FOR SELECT USING (
    conversion_id IN (
      SELECT id FROM conversions WHERE partner_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
      )
    )
  );

-- Updated calculate_monthly_commission: uses real payments when available
CREATE OR REPLACE FUNCTION calculate_monthly_commission(p_partner_id uuid, p_period date)
RETURNS void AS $$
DECLARE
  v_active_count int;
  v_tier partner_tier;
  v_rate decimal(4,2);
  v_total_revenue decimal(12,2);
  v_payment_revenue decimal(12,2);
  v_commission decimal(12,2);
BEGIN
  -- Count active clients for this partner
  SELECT COUNT(*)
  INTO v_active_count
  FROM conversions
  WHERE partner_id = p_partner_id AND status = 'active';

  -- Try real payments first: sum payments in this period
  SELECT COALESCE(SUM(p.amount), 0)
  INTO v_payment_revenue
  FROM payments p
  JOIN conversions c ON c.id = p.conversion_id
  WHERE c.partner_id = p_partner_id
    AND c.status = 'active'
    AND p.paid_at >= p_period
    AND p.paid_at < (p_period + interval '1 month');

  -- If no real payments, fallback to monthly_price estimates
  IF v_payment_revenue > 0 THEN
    v_total_revenue := v_payment_revenue;
  ELSE
    SELECT COALESCE(SUM(monthly_price), 0)
    INTO v_total_revenue
    FROM conversions
    WHERE partner_id = p_partner_id AND status = 'active';
  END IF;

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
