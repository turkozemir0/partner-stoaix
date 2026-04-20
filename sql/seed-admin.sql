-- Run AFTER schema.sql and AFTER creating the admin user via Supabase Auth
-- Replace the email below with your actual admin email

-- Step 1: First create the user via Supabase Dashboard > Authentication > Users > Add User
-- Email: emir@stoaix.com (or your email)
-- Password: (set a strong password)

-- Step 2: The trigger will auto-create a partner record. Now promote to admin:
UPDATE partners
SET is_admin = true, status = 'active'
WHERE email = 'emir@stoaix.com';

-- Alternatively, if you want to set admin by user_id:
-- UPDATE partners SET is_admin = true, status = 'active' WHERE user_id = 'your-auth-user-uuid';
