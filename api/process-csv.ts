import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  customer_id: string;
  customer_name?: string;
  transaction_date: string;
  transaction_amount: number;
}

interface RFMScore {
  customer_id: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  total_transactions: number;
  total_spend: number;
  avg_spend: number;
  last_transaction_date: string;
  segment_name: string;
}

function calculateRFM(transactions: Transaction[]): RFMScore[] {
  const customerData = new Map<string, {
    transactions: number;
    totalSpend: number;
    lastDate: Date;
  }>();

  transactions.forEach(t => {
    const existing = customerData.get(t.customer_id);
    const transactionDate = new Date(t.transaction_date);
    
    if (existing) {
      existing.transactions += 1;
      existing.totalSpend += t.transaction_amount;
      if (transactionDate > existing.lastDate) {
        existing.lastDate = transactionDate;
      }
    } else {
      customerData.set(t.customer_id, {
        transactions: 1,
        totalSpend: t.transaction_amount,
        lastDate: transactionDate,
      });
    }
  });

  const now = new Date();
  const customers = Array.from(customerData.entries()).map(([customerId, data]) => ({
    customer_id: customerId,
    recency: Math.floor((now.getTime() - data.lastDate.getTime()) / (1000 * 60 * 60 * 24)),
    frequency: data.transactions,
    monetary: data.totalSpend,
    lastDate: data.lastDate,
  }));

  const recencyValues = customers.map(c => c.recency).sort((a, b) => a - b);
  const frequencyValues = customers.map(c => c.frequency).sort((a, b) => a - b);
  const monetaryValues = customers.map(c => c.monetary).sort((a, b) => a - b);

  const getQuantile = (values: number[], value: number): number => {
    const index = values.indexOf(value);
    const percentile = index / values.length;
    if (percentile <= 0.25) return 1;
    if (percentile <= 0.5) return 2;
    if (percentile <= 0.75) return 3;
    return 4;
  };

  return customers.map(customer => {
    const r = 5 - getQuantile(recencyValues, customer.recency);
    const f = getQuantile(frequencyValues, customer.frequency);
    const m = getQuantile(monetaryValues, customer.monetary);

    return {
      customer_id: customer.customer_id,
      recency_score: r,
      frequency_score: f,
      monetary_score: m,
      total_transactions: customer.frequency,
      total_spend: customer.monetary,
      avg_spend: customer.monetary / customer.frequency,
      last_transaction_date: customer.lastDate.toISOString().split('T')[0],
      segment_name: getSegmentName(r, f, m),
    };
  });
}

function getSegmentName(r: number, f: number, m: number): string {
  const score = r + f + m;
  
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 4 && f <= 2) return 'New Customers';
  if (r >= 3 && f >= 1 && m >= 2) return 'Potential Loyalists';
  if (r >= 2 && r <= 3 && f >= 2 && m >= 2) return 'Customers Needing Attention';
  if (r <= 2 && f >= 3) return 'At Risk';
  if (r <= 2 && f <= 2 && m >= 3) return 'Big Spenders at Risk';
  if (r <= 1 && f <= 2) return 'Lost Customers';
  if (score >= 9) return 'High Value';
  if (score >= 6) return 'Medium Value';
  return 'Low Value';
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const csvText = await file.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const requiredHeaders = ['customer_id', 'transaction_date', 'transaction_amount'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const customerIdIndex = headers.indexOf('customer_id');
    const dateIndex = headers.indexOf('transaction_date');
    const amountIndex = headers.indexOf('transaction_amount');
    const nameIndex = headers.indexOf('customer_name');

    const newTransactions: Transaction[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 3 && values[customerIdIndex]) {
        newTransactions.push({
          customer_id: values[customerIdIndex],
          customer_name: nameIndex >= 0 ? values[nameIndex] : undefined,
          transaction_date: values[dateIndex],
          transaction_amount: parseFloat(values[amountIndex]) || 0,
        });
      }
    }

    if (newTransactions.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid transactions found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get existing transactions
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('customer_id, transaction_date, transaction_amount, customer_name')
      .eq('user_id', user.id);

    const allTransactions = [
      ...(existingTransactions || []).map(t => ({
        customer_id: t.customer_id,
        customer_name: t.customer_name,
        transaction_date: t.transaction_date,
        transaction_amount: Number(t.transaction_amount),
      })),
      ...newTransactions
    ];

    const rfmScores = calculateRFM(allTransactions);

    // Insert upload history
    const { data: uploadData, error: uploadError } = await supabase
      .from('upload_history')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        transactions_count: newTransactions.length,
        customers_count: new Set(newTransactions.map(t => t.customer_id)).size,
      })
      .select()
      .single();

    if (uploadError) {
      console.error('Upload history error:', uploadError);
      throw uploadError;
    }

    // Insert transactions
    const transactionsToInsert = newTransactions.map(t => ({
      user_id: user.id,
      customer_id: t.customer_id,
      customer_name: t.customer_name,
      transaction_date: t.transaction_date,
      transaction_amount: t.transaction_amount,
      upload_id: uploadData.id,
    }));

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
      throw transactionError;
    }

    // Delete existing segments for this user and upsert new ones
    await supabase
      .from('customer_segments')
      .delete()
      .eq('user_id', user.id);

    const segmentsToInsert = rfmScores.map(score => ({
      user_id: user.id,
      customer_id: score.customer_id,
      recency_score: score.recency_score,
      frequency_score: score.frequency_score,
      monetary_score: score.monetary_score,
      total_transactions: score.total_transactions,
      total_spend: score.total_spend,
      avg_spend: score.avg_spend,
      last_transaction_date: score.last_transaction_date,
      segment_name: score.segment_name,
      upload_id: uploadData.id,
    }));

    const { error: segmentError } = await supabase
      .from('customer_segments')
      .insert(segmentsToInsert);

    if (segmentError) {
      console.error('Segment insert error:', segmentError);
      throw segmentError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Data processed successfully',
      stats: {
        transactions_processed: newTransactions.length,
        customers_segmented: rfmScores.length,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Processing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process CSV' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
