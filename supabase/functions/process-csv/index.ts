import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

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
  recency_days: number;
  frequency: number;
  monetary: number;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  last_transaction_date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file uploaded');
    }

    const fileName = file.name;
    const fileSize = file.size;

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const requiredHeaders = ['customer_id', 'transaction_date', 'transaction_amount'];
    const optionalHeaders = ['customer_name'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const hasCustomerName = headers.includes('customer_name');

    const transactions: Transaction[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      transactions.push({
        customer_id: row.customer_id,
        customer_name: hasCustomerName ? (row.customer_name || undefined) : undefined,
        transaction_date: row.transaction_date,
        transaction_amount: parseFloat(row.transaction_amount),
      });
    }

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in CSV');
    }

    console.log(`Processing ${transactions.length} transactions for user ${user.id}`);

    // Fetch existing transactions from database
    const { data: existingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('customer_id, customer_name, transaction_date, transaction_amount')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching existing transactions:', fetchError);
      throw fetchError;
    }

    // Combine existing and new transactions for RFM calculation
    const allTransactions = [
      ...(existingTransactions || []).map(t => ({
        customer_id: t.customer_id,
        customer_name: t.customer_name || undefined,
        transaction_date: t.transaction_date,
        transaction_amount: t.transaction_amount,
      })),
      ...transactions
    ];

    console.log(`Calculating RFM from ${allTransactions.length} total transactions (${existingTransactions?.length || 0} existing + ${transactions.length} new)`);

    // Calculate RFM scores from ALL transactions
    const rfmScores = calculateRFM(allTransactions);
    
    // Create upload history record
    const { data: uploadHistoryData, error: uploadHistoryError } = await supabase
      .from('upload_history')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize,
        transactions_count: transactions.length,
        customers_count: rfmScores.length,
      })
      .select()
      .single();

    if (uploadHistoryError) {
      console.error('Upload history error:', uploadHistoryError);
      throw uploadHistoryError;
    }

    const uploadId = uploadHistoryData.id;

    // Insert transactions with upload_id
    const transactionsWithUserId = transactions.map(t => ({
      user_id: user.id,
      customer_id: t.customer_id,
      customer_name: t.customer_name || null,
      transaction_date: t.transaction_date,
      transaction_amount: t.transaction_amount,
      upload_id: uploadId,
    }));

    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsWithUserId);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }
    
    // Insert customer segments with upload_id
    const segments = rfmScores.map(rfm => ({
      user_id: user.id,
      customer_id: rfm.customer_id,
      recency_score: rfm.recency_score,
      frequency_score: rfm.frequency_score,
      monetary_score: rfm.monetary_score,
      segment_name: getSegmentName(rfm.recency_score, rfm.frequency_score, rfm.monetary_score),
      total_transactions: rfm.frequency,
      total_spend: rfm.monetary,
      avg_spend: rfm.monetary / rfm.frequency,
      last_transaction_date: rfm.last_transaction_date,
      upload_id: uploadId,
    }));

    const { error: segmentError } = await supabase
      .from('customer_segments')
      .upsert(segments, { onConflict: 'user_id,customer_id' });

    if (segmentError) {
      console.error('Segment insert error:', segmentError);
      throw segmentError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${transactions.length} transactions`,
        customers: rfmScores.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error processing CSV:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function calculateRFM(transactions: Transaction[]): RFMScore[] {
  const customerData = new Map<string, {
    transactions: Transaction[];
    lastDate: Date;
    totalAmount: number;
  }>();

  // Group by customer
  transactions.forEach(t => {
    const date = new Date(t.transaction_date);
    if (!customerData.has(t.customer_id)) {
      customerData.set(t.customer_id, {
        transactions: [],
        lastDate: date,
        totalAmount: 0,
      });
    }
    const data = customerData.get(t.customer_id)!;
    data.transactions.push(t);
    if (date > data.lastDate) {
      data.lastDate = date;
    }
    data.totalAmount += t.transaction_amount;
  });

  const today = new Date();
  const rfmData: Array<{
    customer_id: string;
    recency: number;
    frequency: number;
    monetary: number;
    lastDate: string;
  }> = [];

  customerData.forEach((data, customerId) => {
    const recencyDays = Math.floor((today.getTime() - data.lastDate.getTime()) / (1000 * 60 * 60 * 24));
    rfmData.push({
      customer_id: customerId,
      recency: recencyDays,
      frequency: data.transactions.length,
      monetary: data.totalAmount,
      lastDate: data.lastDate.toISOString().split('T')[0],
    });
  });

  // Calculate quantiles
  const recencies = rfmData.map(d => d.recency).sort((a, b) => a - b);
  const frequencies = rfmData.map(d => d.frequency).sort((a, b) => a - b);
  const monetaries = rfmData.map(d => d.monetary).sort((a, b) => a - b);

  const getScore = (value: number, values: number[], reverse: boolean = false) => {
    const q1 = values[Math.floor(values.length * 0.25)];
    const q2 = values[Math.floor(values.length * 0.50)];
    const q3 = values[Math.floor(values.length * 0.75)];

    let score: number;
    if (value <= q1) score = reverse ? 4 : 1;
    else if (value <= q2) score = reverse ? 3 : 2;
    else if (value <= q3) score = reverse ? 2 : 3;
    else score = reverse ? 1 : 4;

    return score;
  };

  return rfmData.map(d => ({
    customer_id: d.customer_id,
    recency_days: d.recency,
    frequency: d.frequency,
    monetary: d.monetary,
    recency_score: getScore(d.recency, recencies, true), // Lower recency is better
    frequency_score: getScore(d.frequency, frequencies),
    monetary_score: getScore(d.monetary, monetaries),
    last_transaction_date: d.lastDate,
  }));
}

function getSegmentName(r: number, f: number, m: number): string {
  const rfmScore = r + f + m;
  
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 3 && f <= 2) return 'Potential Loyalists';
  if (r >= 3 && f >= 1 && m <= 2) return 'Recent Customers';
  if (r <= 2 && f >= 3) return 'At Risk';
  if (r <= 2 && f <= 2 && m >= 3) return 'Cant Lose Them';
  if (r <= 2 && f <= 2) return 'Lost';
  if (f >= 3 && m >= 3) return 'Big Spenders';
  
  return 'Need Attention';
}
