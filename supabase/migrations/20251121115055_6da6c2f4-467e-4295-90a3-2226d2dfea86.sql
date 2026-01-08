-- Add customer_name column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN customer_name text;