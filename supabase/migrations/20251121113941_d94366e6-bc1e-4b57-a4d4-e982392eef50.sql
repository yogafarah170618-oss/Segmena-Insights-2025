-- Create transactions table
create table public.transactions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id text not null,
  transaction_date date not null,
  transaction_amount decimal(15,2) not null,
  created_at timestamp with time zone not null default now()
);

-- Create customer_segments table for RFM results
create table public.customer_segments (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id text not null,
  recency_score integer not null,
  frequency_score integer not null,
  monetary_score integer not null,
  segment_name text not null,
  total_transactions integer not null,
  total_spend decimal(15,2) not null,
  avg_spend decimal(15,2) not null,
  last_transaction_date date not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, customer_id)
);

-- Enable RLS
alter table public.transactions enable row level security;
alter table public.customer_segments enable row level security;

-- RLS Policies for transactions
create policy "Users can view their own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);

-- RLS Policies for customer_segments
create policy "Users can view their own segments"
  on public.customer_segments
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own segments"
  on public.customer_segments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own segments"
  on public.customer_segments
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own segments"
  on public.customer_segments
  for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_customer_id on public.transactions(customer_id);
create index idx_transactions_date on public.transactions(transaction_date);
create index idx_customer_segments_user_id on public.customer_segments(user_id);
create index idx_customer_segments_segment on public.customer_segments(segment_name);

-- Trigger to update updated_at on customer_segments
create trigger on_customer_segments_updated
  before update on public.customer_segments
  for each row execute procedure public.handle_updated_at();