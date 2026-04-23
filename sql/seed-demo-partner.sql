-- ============================================
-- DEMO DATA SEED for Partner: Emir TRKAZ
-- Partner ID: 198beb53-7979-43d0-b2df-87eb4328888e
-- Run this in Supabase SQL Editor
-- ============================================
-- SCENARIO: 8 months active, 22 active clinics, Pro tier
-- Total earnings: ~$7,000+  |  ~3,300 clicks  |  26 conversions
-- ============================================

DO $$
DECLARE
  p_id uuid := '198beb53-7979-43d0-b2df-87eb4328888e';

  -- Referral Link IDs (5 links)
  link_web uuid := 'a1000000-0000-0000-0000-000000000001';
  link_ig  uuid := 'a1000000-0000-0000-0000-000000000002';
  link_yt  uuid := 'a1000000-0000-0000-0000-000000000003';
  link_li  uuid := 'a1000000-0000-0000-0000-000000000004';
  link_x   uuid := 'a1000000-0000-0000-0000-000000000005';

  -- Conversion IDs (26 total)
  c1  uuid := 'c1000000-0000-0000-0000-000000000001';
  c2  uuid := 'c1000000-0000-0000-0000-000000000002';
  c3  uuid := 'c1000000-0000-0000-0000-000000000003';
  c4  uuid := 'c1000000-0000-0000-0000-000000000004';
  c5  uuid := 'c1000000-0000-0000-0000-000000000005';
  c6  uuid := 'c1000000-0000-0000-0000-000000000006';
  c7  uuid := 'c1000000-0000-0000-0000-000000000007';
  c8  uuid := 'c1000000-0000-0000-0000-000000000008';
  c9  uuid := 'c1000000-0000-0000-0000-000000000009';
  c10 uuid := 'c1000000-0000-0000-0000-000000000010';
  c11 uuid := 'c1000000-0000-0000-0000-000000000011';
  c12 uuid := 'c1000000-0000-0000-0000-000000000012';
  c13 uuid := 'c1000000-0000-0000-0000-000000000013';
  c14 uuid := 'c1000000-0000-0000-0000-000000000014';
  c15 uuid := 'c1000000-0000-0000-0000-000000000015';
  c16 uuid := 'c1000000-0000-0000-0000-000000000016';
  c17 uuid := 'c1000000-0000-0000-0000-000000000017';
  c18 uuid := 'c1000000-0000-0000-0000-000000000018';
  c19 uuid := 'c1000000-0000-0000-0000-000000000019';
  c20 uuid := 'c1000000-0000-0000-0000-000000000020';
  c21 uuid := 'c1000000-0000-0000-0000-000000000021';
  c22 uuid := 'c1000000-0000-0000-0000-000000000022';
  c23 uuid := 'c1000000-0000-0000-0000-000000000023';
  c24 uuid := 'c1000000-0000-0000-0000-000000000024';
  c25 uuid := 'c1000000-0000-0000-0000-000000000025'; -- trial
  c26 uuid := 'c1000000-0000-0000-0000-000000000026'; -- trial

  -- For payment generation
  rec record;
  month_cursor date;
  inv_counter int := 0;

BEGIN

-- ============================================
-- 1. REFERRAL LINKS (5 links)
-- ============================================
DELETE FROM referral_links WHERE partner_id = p_id;

INSERT INTO referral_links (id, partner_id, code, label, destination_url, is_active, click_count, conversion_count, created_at) VALUES
  (link_web, p_id, 'emir-web',       'Web Sitesi',       'https://stoaix.com',                          true,  1350, 12, '2025-09-01 10:00:00+03'),
  (link_ig,  p_id, 'emir-instagram', 'Instagram Bio',    'https://stoaix.com?utm_source=instagram',     true,  780,  6,  '2025-09-15 14:00:00+03'),
  (link_yt,  p_id, 'emir-youtube',   'YouTube Açıklama', 'https://stoaix.com?utm_source=youtube',       true,  520,  4,  '2025-10-01 09:00:00+03'),
  (link_li,  p_id, 'emir-linkedin',  'LinkedIn Profil',  'https://stoaix.com?utm_source=linkedin',      true,  380,  3,  '2025-10-15 11:00:00+03'),
  (link_x,   p_id, 'emir-x',        'X (Twitter)',       'https://stoaix.com?utm_source=twitter',       true,  270,  1,  '2025-11-01 16:00:00+03');

-- ============================================
-- 2. CLICKS (~3,300 total)
-- ============================================
-- Delete old demo clicks first
DELETE FROM clicks WHERE link_id IN (link_web, link_ig, link_yt, link_li, link_x);

-- Web sitesi: 1350 clicks (Sep 2025 → Apr 2026)
INSERT INTO clicks (link_id, ip_hash, user_agent, referrer, country, created_at)
SELECT
  link_web,
  md5(random()::text),
  CASE (random()*4)::int
    WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121'
    WHEN 1 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/605'
    WHEN 2 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/121'
    WHEN 3 THEN 'Mozilla/5.0 (Linux; Android 14) Chrome/121'
    ELSE 'Mozilla/5.0 (iPad; CPU OS 17_2) Safari/605'
  END,
  CASE (random()*5)::int
    WHEN 0 THEN 'https://google.com'
    WHEN 1 THEN 'https://emirtrkaz.com'
    WHEN 2 THEN NULL
    WHEN 3 THEN 'https://linkedin.com'
    WHEN 4 THEN 'https://bing.com'
    ELSE 'https://google.com'
  END,
  CASE (random()*5)::int
    WHEN 0 THEN 'TR' WHEN 1 THEN 'DE' WHEN 2 THEN 'US'
    WHEN 3 THEN 'GB' WHEN 4 THEN 'NL' ELSE 'TR'
  END,
  '2025-09-01'::timestamptz + (random() * 234 * interval '1 day')
FROM generate_series(1, 1350);

-- Instagram: 780 clicks (Sep 2025 → Apr 2026)
INSERT INTO clicks (link_id, ip_hash, user_agent, referrer, country, created_at)
SELECT
  link_ig,
  md5(random()::text),
  CASE (random()*2)::int
    WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/605'
    WHEN 1 THEN 'Mozilla/5.0 (Linux; Android 14) Chrome/121'
    ELSE 'Instagram 320.0 Android'
  END,
  'https://instagram.com',
  CASE (random()*3)::int
    WHEN 0 THEN 'TR' WHEN 1 THEN 'DE' WHEN 2 THEN 'US' ELSE 'TR'
  END,
  '2025-09-15'::timestamptz + (random() * 220 * interval '1 day')
FROM generate_series(1, 780);

-- YouTube: 520 clicks (Oct 2025 → Apr 2026)
INSERT INTO clicks (link_id, ip_hash, user_agent, referrer, country, created_at)
SELECT
  link_yt,
  md5(random()::text),
  CASE (random()*3)::int
    WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121'
    WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/121'
    WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/605'
    ELSE 'Mozilla/5.0 (Linux; Android 14) Chrome/121'
  END,
  'https://youtube.com',
  CASE (random()*4)::int
    WHEN 0 THEN 'TR' WHEN 1 THEN 'US' WHEN 2 THEN 'GB' WHEN 3 THEN 'DE' ELSE 'TR'
  END,
  '2025-10-01'::timestamptz + (random() * 204 * interval '1 day')
FROM generate_series(1, 520);

-- LinkedIn: 380 clicks (Oct 2025 → Apr 2026)
INSERT INTO clicks (link_id, ip_hash, user_agent, referrer, country, created_at)
SELECT
  link_li,
  md5(random()::text),
  CASE (random()*2)::int
    WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121'
    WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605'
    ELSE 'LinkedIn App/9.0 iOS'
  END,
  'https://linkedin.com',
  CASE (random()*3)::int
    WHEN 0 THEN 'TR' WHEN 1 THEN 'DE' WHEN 2 THEN 'NL' ELSE 'US'
  END,
  '2025-10-15'::timestamptz + (random() * 190 * interval '1 day')
FROM generate_series(1, 380);

-- X (Twitter): 270 clicks (Nov 2025 → Apr 2026)
INSERT INTO clicks (link_id, ip_hash, user_agent, referrer, country, created_at)
SELECT
  link_x,
  md5(random()::text),
  CASE (random()*2)::int
    WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/605'
    WHEN 1 THEN 'Mozilla/5.0 (Linux; Android 14) Chrome/121'
    ELSE 'Twitter/10.0 iOS'
  END,
  'https://x.com',
  CASE (random()*3)::int
    WHEN 0 THEN 'TR' WHEN 1 THEN 'US' WHEN 2 THEN 'GB' ELSE 'TR'
  END,
  '2025-11-01'::timestamptz + (random() * 173 * interval '1 day')
FROM generate_series(1, 270);

-- ============================================
-- 3. CONVERSIONS (26 clinics)
-- ============================================
DELETE FROM conversions WHERE partner_id = p_id;

INSERT INTO conversions (id, partner_id, link_id, organization_id, organization_name, plan_type, monthly_price, status, started_at, churned_at, created_at) VALUES
  -- ── Sep 2025: 3 new → 3 active (Starter tier) ──
  (c1,  p_id, link_web, gen_random_uuid(), 'Dentaplus Klinik',            'professional', 199.00, 'active',  '2025-09-05 14:00:00+03', NULL, '2025-09-05 14:00:00+03'),
  (c2,  p_id, link_web, gen_random_uuid(), 'Gülüş Diş Polikliniği',      'professional', 199.00, 'active',  '2025-09-15 11:00:00+03', NULL, '2025-09-15 11:00:00+03'),
  (c3,  p_id, link_ig,  gen_random_uuid(), 'Beyaz Inci Dental',           'enterprise',   349.00, 'active',  '2025-09-22 09:00:00+03', NULL, '2025-09-22 09:00:00+03'),

  -- ── Oct 2025: 3 new → 6 active (Growth tier) ──
  (c4,  p_id, link_ig,  gen_random_uuid(), 'Özdemir Diş Kliniği',         'professional', 199.00, 'active',  '2025-10-03 16:00:00+03', NULL, '2025-10-03 16:00:00+03'),
  (c5,  p_id, link_web, gen_random_uuid(), 'SmileLine Clinic',            'enterprise',   349.00, 'active',  '2025-10-14 10:00:00+03', NULL, '2025-10-14 10:00:00+03'),
  (c6,  p_id, link_web, gen_random_uuid(), 'Kaya Dental Center',          'starter',      99.00,  'churned', '2025-10-25 13:00:00+03', '2026-01-10 00:00:00+03', '2025-10-25 13:00:00+03'),

  -- ── Nov 2025: 3 new → 9 active (Growth tier) ──
  (c7,  p_id, link_yt,  gen_random_uuid(), 'Anadolu Ağız Sağlığı',        'enterprise',   349.00, 'active',  '2025-11-02 11:00:00+03', NULL, '2025-11-02 11:00:00+03'),
  (c8,  p_id, link_ig,  gen_random_uuid(), 'Elit Dental Studio',          'professional', 199.00, 'active',  '2025-11-13 09:00:00+03', NULL, '2025-11-13 09:00:00+03'),
  (c9,  p_id, link_li,  gen_random_uuid(), 'Yıldız Diş Hastanesi',        'professional', 199.00, 'active',  '2025-11-24 15:00:00+03', NULL, '2025-11-24 15:00:00+03'),

  -- ── Dec 2025: 3 new → 12 active (Pro tier!) ──
  (c10, p_id, link_web, gen_random_uuid(), 'Nova Dental Care',            'professional', 199.00, 'active',  '2025-12-04 10:00:00+03', NULL, '2025-12-04 10:00:00+03'),
  (c11, p_id, link_yt,  gen_random_uuid(), 'Merkez Poliklinik',           'enterprise',   349.00, 'active',  '2025-12-15 14:00:00+03', NULL, '2025-12-15 14:00:00+03'),
  (c12, p_id, link_ig,  gen_random_uuid(), 'Doğan Dental',                'starter',      99.00,  'churned', '2025-12-22 09:00:00+03', '2026-03-05 00:00:00+03', '2025-12-22 09:00:00+03'),

  -- ── Jan 2026: 3 new, Kaya churns → 14 active (Pro tier) ──
  (c13, p_id, link_web, gen_random_uuid(), 'Pearl Diş Kliniği',           'professional', 199.00, 'active',  '2026-01-06 11:00:00+03', NULL, '2026-01-06 11:00:00+03'),
  (c14, p_id, link_li,  gen_random_uuid(), 'Golden Smile Center',         'enterprise',   349.00, 'active',  '2026-01-15 14:00:00+03', NULL, '2026-01-15 14:00:00+03'),
  (c15, p_id, link_ig,  gen_random_uuid(), 'Akdeniz Dental',              'professional', 199.00, 'active',  '2026-01-25 10:00:00+03', NULL, '2026-01-25 10:00:00+03'),

  -- ── Feb 2026: 3 new → 17 active (Pro tier) ──
  (c16, p_id, link_web, gen_random_uuid(), 'İstanbul Smile Hub',          'professional', 199.00, 'active',  '2026-02-04 13:00:00+03', NULL, '2026-02-04 13:00:00+03'),
  (c17, p_id, link_yt,  gen_random_uuid(), 'Marmara Ağız Kliniği',        'enterprise',   349.00, 'active',  '2026-02-13 09:00:00+03', NULL, '2026-02-13 09:00:00+03'),
  (c18, p_id, link_web, gen_random_uuid(), 'Ege Dental Center',           'professional', 199.00, 'active',  '2026-02-22 16:00:00+03', NULL, '2026-02-22 16:00:00+03'),

  -- ── Mar 2026: 3 new, Doğan churns → 19 active (Pro tier) ──
  (c19, p_id, link_li,  gen_random_uuid(), 'Antalya Diş Evi',             'professional', 199.00, 'active',  '2026-03-03 10:00:00+03', NULL, '2026-03-03 10:00:00+03'),
  (c20, p_id, link_web, gen_random_uuid(), 'Prestige Dental',             'enterprise',   349.00, 'active',  '2026-03-14 11:00:00+03', NULL, '2026-03-14 11:00:00+03'),
  (c21, p_id, link_ig,  gen_random_uuid(), 'Karadeniz Diş Kliniği',       'professional', 199.00, 'active',  '2026-03-24 14:00:00+03', NULL, '2026-03-24 14:00:00+03'),

  -- ── Apr 2026: 3 new active + 2 trial → 22 active (Pro tier) ──
  (c22, p_id, link_yt,  gen_random_uuid(), 'Trakya Dental Studio',        'professional', 199.00, 'active',  '2026-04-02 09:00:00+03', NULL, '2026-04-02 09:00:00+03'),
  (c23, p_id, link_web, gen_random_uuid(), 'Ankara Dental Plus',          'enterprise',   349.00, 'active',  '2026-04-10 15:00:00+03', NULL, '2026-04-10 15:00:00+03'),
  (c24, p_id, link_x,   gen_random_uuid(), 'Bursa Smile Center',          'professional', 199.00, 'active',  '2026-04-16 11:00:00+03', NULL, '2026-04-16 11:00:00+03'),
  (c25, p_id, link_web, gen_random_uuid(), 'Sapphire Diş Kliniği',        'professional', 199.00, 'trial',   '2026-04-19 13:00:00+03', NULL, '2026-04-19 13:00:00+03'),
  (c26, p_id, link_ig,  gen_random_uuid(), 'Bodrum Dental Care',          'starter',      99.00,  'trial',   '2026-04-21 10:00:00+03', NULL, '2026-04-21 10:00:00+03');

-- ============================================
-- 4. PAYMENTS (auto-generated per conversion)
-- ============================================
-- Generate monthly Stripe payments for each active/churned conversion
DELETE FROM payments WHERE conversion_id IN (c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,c14,c15,c16,c17,c18,c19,c20,c21,c22,c23,c24);

FOR rec IN
  SELECT id, organization_id, monthly_price, started_at,
    CASE
      WHEN status = 'churned' THEN churned_at
      ELSE '2026-04-23'::timestamptz
    END AS end_date
  FROM conversions
  WHERE partner_id = p_id AND status IN ('active', 'churned')
LOOP
  month_cursor := date_trunc('month', rec.started_at)::date;
  WHILE month_cursor <= date_trunc('month', rec.end_date)::date LOOP
    inv_counter := inv_counter + 1;
    INSERT INTO payments (conversion_id, organization_id, stripe_invoice_id, amount, currency, period_start, period_end, paid_at)
    VALUES (
      rec.id,
      rec.organization_id,
      'in_demo_' || inv_counter || '_' || to_char(month_cursor, 'YYYYMM'),
      rec.monthly_price,
      'usd',
      month_cursor,
      (month_cursor + interval '1 month' - interval '1 day')::date,
      month_cursor + (extract(day from rec.started_at)::int - 1) * interval '1 day'
    );
    month_cursor := month_cursor + interval '1 month';
  END LOOP;
END LOOP;

-- ============================================
-- 5. MONTHLY COMMISSIONS (8 months)
-- ============================================
DELETE FROM monthly_commissions WHERE partner_id = p_id;

-- Sep 2025: 3 active → Starter 10%
-- Revenue: 199+199+349 = $747 → Commission: $74.70
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2025-09-01', 'starter', 0.10, 3,  747.00,  74.70,  'paid');

-- Oct 2025: 6 active → Growth 20%
-- Revenue: 747+199+349+99 = $1394 → Commission: $278.80
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2025-10-01', 'growth', 0.20, 6,  1394.00, 278.80, 'paid');

-- Nov 2025: 9 active → Growth 20%
-- Revenue: 1394+349+199+199 = $2141 → Commission: $428.20
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2025-11-01', 'growth', 0.20, 9,  2141.00, 428.20, 'paid');

-- Dec 2025: 12 active → Pro 30%!
-- Revenue: 2141+199+349+99 = $2788 → Commission: $836.40
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2025-12-01', 'pro', 0.30, 12, 2788.00, 836.40, 'paid');

-- Jan 2026: 14 active (Kaya churns, +3 new)
-- Revenue: 2788-99+199+349+199 = $3436 → Commission: $1030.80
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2026-01-01', 'pro', 0.30, 14, 3436.00, 1030.80, 'paid');

-- Feb 2026: 17 active
-- Revenue: 3436+199+349+199 = $4183 → Commission: $1254.90
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2026-02-01', 'pro', 0.30, 17, 4183.00, 1254.90, 'confirmed');

-- Mar 2026: 19 active (Doğan churns, +3 new)
-- Revenue: 4183-99+199+349+199 = $4831 → Commission: $1449.30
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2026-03-01', 'pro', 0.30, 19, 4831.00, 1449.30, 'confirmed');

-- Apr 2026: 22 active + 2 trial
-- Revenue: 4831+199+349+199 = $5578 → Commission: $1673.40
INSERT INTO monthly_commissions (partner_id, period, tier_at_time, rate_at_time, active_clients_count, total_revenue, commission_amount, status) VALUES
  (p_id, '2026-04-01', 'pro', 0.30, 22, 5578.00, 1673.40, 'calculated');

-- ============================================
-- 6. PAYOUTS (6 completed + 1 pending)
-- ============================================
DELETE FROM payouts WHERE partner_id = p_id;

INSERT INTO payouts (partner_id, amount, method, status, reference, requested_at, processed_at) VALUES
  (p_id, 353.50,  'bank_transfer', 'completed', 'PAY-2025-001', '2025-11-03 10:00:00+03', '2025-11-05 14:00:00+03'),
  (p_id, 428.20,  'bank_transfer', 'completed', 'PAY-2025-002', '2025-12-02 09:00:00+03', '2025-12-04 11:00:00+03'),
  (p_id, 836.40,  'bank_transfer', 'completed', 'PAY-2026-001', '2026-01-03 10:00:00+03', '2026-01-06 15:00:00+03'),
  (p_id, 1030.80, 'bank_transfer', 'completed', 'PAY-2026-002', '2026-02-03 09:00:00+03', '2026-02-05 12:00:00+03'),
  (p_id, 1254.90, 'bank_transfer', 'completed', 'PAY-2026-003', '2026-03-03 10:00:00+03', '2026-03-05 14:00:00+03'),
  (p_id, 1449.30, 'bank_transfer', 'completed', 'PAY-2026-004', '2026-04-02 10:00:00+03', '2026-04-04 11:00:00+03'),
  (p_id, 1673.40, 'bank_transfer', 'pending',   NULL,           '2026-04-22 10:00:00+03', NULL);

-- ============================================
-- 7. NOTIFICATIONS (20+ notifications)
-- ============================================
DELETE FROM notifications WHERE partner_id = p_id;

INSERT INTO notifications (partner_id, type, title, message, is_read, created_at) VALUES
  -- Sep 2025
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Dentaplus Klinik referans linkiniz üzerinden kayıt oldu.', true, '2025-09-05 14:05:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Gülüş Diş Polikliniği referans linkiniz üzerinden kayıt oldu.', true, '2025-09-15 11:05:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Beyaz Inci Dental referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2025-09-22 09:05:00+03'),

  -- Oct 2025
  (p_id, 'tier', 'Seviye Atlama!', 'Tebrikler! Growth seviyesine yükseldiniz. Artık %20 komisyon kazanıyorsunuz.', true, '2025-10-03 16:10:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'SmileLine Clinic referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2025-10-14 10:05:00+03'),

  -- Nov 2025
  (p_id, 'payout', 'Ödeme Tamamlandı', '$353.50 tutarındaki ödemeniz banka hesabınıza aktarıldı. (Eylül + Ekim komisyonları)', true, '2025-11-05 14:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Anadolu Ağız Sağlığı referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2025-11-02 11:05:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Elit Dental Studio referans linkiniz üzerinden kayıt oldu.', true, '2025-11-13 09:05:00+03'),

  -- Dec 2025
  (p_id, 'tier', 'Pro Seviye!', 'Muhteşem! 10+ aktif müşteri ile Pro seviyeye ulaştınız. Artık %30 komisyon kazanıyorsunuz!', true, '2025-12-04 10:10:00+03'),
  (p_id, 'payout', 'Ödeme Tamamlandı', '$428.20 tutarındaki ödemeniz banka hesabınıza aktarıldı.', true, '2025-12-04 11:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Merkez Poliklinik referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2025-12-15 14:05:00+03'),

  -- Jan 2026
  (p_id, 'payout', 'Ödeme Tamamlandı', '$836.40 tutarındaki ödemeniz banka hesabınıza aktarıldı.', true, '2026-01-06 15:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Golden Smile Center referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2026-01-15 14:05:00+03'),
  (p_id, 'churn', 'Müşteri Kaybı', 'Kaya Dental Center aboneliğini iptal etti.', true, '2026-01-10 00:05:00+03'),

  -- Feb 2026
  (p_id, 'payout', 'Ödeme Tamamlandı', '$1,030.80 tutarındaki ödemeniz banka hesabınıza aktarıldı.', true, '2026-02-05 12:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Marmara Ağız Kliniği referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2026-02-13 09:05:00+03'),

  -- Mar 2026
  (p_id, 'payout', 'Ödeme Tamamlandı', '$1,254.90 tutarındaki ödemeniz banka hesabınıza aktarıldı.', true, '2026-03-05 14:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Prestige Dental referans linkiniz üzerinden kayıt oldu. Enterprise plan!', true, '2026-03-14 11:05:00+03'),
  (p_id, 'churn', 'Müşteri Kaybı', 'Doğan Dental aboneliğini iptal etti.', true, '2026-03-05 00:05:00+03'),

  -- Apr 2026 (recent - some unread)
  (p_id, 'payout', 'Ödeme Tamamlandı', '$1,449.30 tutarındaki ödemeniz banka hesabınıza aktarıldı.', true, '2026-04-04 11:00:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Trakya Dental Studio referans linkiniz üzerinden kayıt oldu.', false, '2026-04-02 09:05:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Ankara Dental Plus referans linkiniz üzerinden kayıt oldu. Enterprise plan!', false, '2026-04-10 15:05:00+03'),
  (p_id, 'conversion', 'Yeni Dönüşüm!', 'Bursa Smile Center referans linkiniz üzerinden kayıt oldu.', false, '2026-04-16 11:05:00+03'),
  (p_id, 'conversion', 'Yeni Deneme Kaydı', 'Sapphire Diş Kliniği deneme sürümüne başladı.', false, '2026-04-19 13:05:00+03'),
  (p_id, 'conversion', 'Yeni Deneme Kaydı', 'Bodrum Dental Care deneme sürümüne başladı.', false, '2026-04-21 10:05:00+03'),
  (p_id, 'payout', 'Ödeme Talebi Alındı', '$1,673.40 tutarındaki ödeme talebiniz işleme alındı.', false, '2026-04-22 10:00:00+03');

-- ============================================
-- 8. UPDATE PARTNER RECORD
-- ============================================
-- Total commissions: 74.70 + 278.80 + 428.20 + 836.40 + 1030.80 + 1254.90 + 1449.30 + 1673.40 = $7,026.50
-- Paid out: 353.50 + 428.20 + 836.40 + 1030.80 + 1254.90 + 1449.30 = $5,353.10
-- Pending: 7026.50 - 5353.10 = $1,673.40
UPDATE partners SET
  company_name = 'TrkAz Digital',
  tier = 'pro',
  active_clients = 22,
  total_earnings = 7026.50,
  pending_balance = 1673.40,
  paid_balance = 5353.10,
  created_at = '2025-09-01 09:00:00+03'
WHERE id = p_id;

RAISE NOTICE 'Demo data seeded successfully! Partner: Emir TRKAZ | Tier: Pro | Active Clients: 22 | Total Earnings: $7,026.50';

END $$;
