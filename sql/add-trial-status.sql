-- Add 'trial' to conversion_status enum
-- Run this in Supabase SQL Editor before deploying the code changes
ALTER TYPE conversion_status ADD VALUE 'trial';
