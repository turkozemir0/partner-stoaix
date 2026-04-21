-- OTP codes table for email verification (register + password reset)
CREATE TABLE otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('register', 'reset', 'login')),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_otp_codes_lookup ON otp_codes(email, code, type) WHERE NOT used;

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
