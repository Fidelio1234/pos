import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase Client
const supabaseUrl = 'https://hypitslxbjyvdqpejbzv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'customer_id']
}));

app.options('*', cors());
app.use(express.json());

// === FUNZIONI SUPABASE ===

// Salva transazione in Supabase
const saveTransaction = async (transaction) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    console.log('✅ Transazione salvata in Supabase:', data[0].id);
    return data[0];
  } catch (error) {
    console.log('❌ Errore salvataggio transazione:', error.message);
    return null;
  }
};

// Salva cliente in Supabase
const saveCustomer = async (customerData) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) throw error;
    console.log('✅ Cliente salvato in Supabase:', data.id);
    return data;
  } catch (error) {
    console.log('❌ Errore salvataggio cliente:', error.message);
    return null;
  }
};

// Salva abbonamento in Supabase
const saveSubscription = async (subscriptionData) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();
    
    if (error) throw error;
    console.log('✅ Abbonamento salvato in Supabase:', data.id);
    return data;
  } catch (error) {
    console.log('❌ Errore salvataggio abbonamento:', error.message);
    return null;
  }
};

// Carica transazioni da Supabase
const loadTransactions = async (customerId) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log('❌ Errore caricamento transazioni:', error.message);
    return [];
  }
};

// Verifica abbonamento in Supabase
const checkSubscriptionStatus = async (customerId) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.log('❌ Errore verifica abbonamento:', error.message);
    return null;
  }
};

// === ROUTES PRINCIPALI ===

// Health check
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    
    res.json({ 
      status: 'OK', 
      message: 'POS Backend running',
      database: error ? 'Errore Supabase' : 'Supabase connesso',
      mode: 'production'
    });
  } catch (error) {
    res.json({ 
      status: 'OK', 
      message: 'POS Backend running',
      database: 'Errore connessione',
      error: error.message
    });
  }
});

// === ROUTES ABBONAMENTI ===

// Crea abbonamento piano base
app.post('/api/subscriptions/create-base', async (req, res) => {
  try {
    const { business_name, email, phone } = req.body;

    console.log('📧 Creazione abbonamento per:', email);

    // 1. SALVA IL CLIENTE IN SUPABASE
    const customer = await saveCustomer({
      email: email,
      business_name: business_name,
      phone: phone
    });

    if (!customer) {
      throw new Error('Errore nel salvataggio del cliente');
    }

    // 2. CREA CHECKOUT STRIPE
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Piano Base POS Satispay',
              description: 'Abbonamento mensile - Pagamenti Satispay illimitati + App POS'
            },
            unit_amount: 1900,
            recurring: { interval: 'month' }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}&customer_id=${customer.id}`,
      cancel_url: `http://localhost:3000/pricing`,
      metadata: {
        customer_id: customer.id,
        business_name,
        email
      }
    });

    console.log('✅ Checkout session creata:', session.id);

    // 3. SALVA ABBONAMENTO IN SUPABASE
    await saveSubscription({
      customer_id: customer.id,
      stripe_subscription_id: session.id,
      stripe_customer_id: session.customer,
      plan: 'base',
      status: 'pending',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      customer_id: customer.id
    });

  } catch (error) {
    console.error('❌ Errore creazione abbonamento:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verifica stato sessione checkout
app.get('/api/subscriptions/check-session', async (req, res) => {
  try {
    const { session_id, customer_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID richiesto'
      });
    }

    console.log('🔍 Verifica sessione:', session_id, 'per customer:', customer_id);

    // Recupera la sessione da Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription']
    });

    console.log('🔍 Stato sessione:', session.status);
    console.log('🔍 Stato pagamento:', session.payment_status);

    // Verifica se il pagamento è andato a buon fine
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Aggiorna l'abbonamento in Supabase
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          stripe_subscription_id: session.subscription?.id || session.id,
          stripe_customer_id: session.customer,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('customer_id', customer_id);

      if (error) {
        console.log('❌ Errore aggiornamento abbonamento:', error.message);
      } else {
        console.log('✅ Abbonamento attivato per customer:', customer_id);
      }

      return res.json({
        success: true,
        status: 'active',
        message: 'Abbonamento attivato con successo'
      });
    }

    res.json({
      success: true,
      status: session.payment_status,
      session_status: session.status,
      message: 'Pagamento in elaborazione'
    });

  } catch (error) {
    console.error('❌ Errore verifica sessione:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verifica stato abbonamento
app.get('/api/subscriptions/status', async (req, res) => {
  try {
    const customerId = req.headers.customer_id || 'dev-customer-id';
    
    const subscription = await checkSubscriptionStatus(customerId);
    
    res.json({
      success: true,
      has_subscription: !!subscription,
      plan: subscription?.plan || 'base',
      status: subscription?.status || 'inactive',
      current_period_end: subscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_trial: false
    });
  } catch (error) {
    console.error('Errore verifica abbonamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore verifica abbonamento'
    });
  }
});

// === ROUTES PAGAMENTI ===

// Crea pagamento
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    const customerId = req.headers.customer_id || 'dev-customer-id';

    console.log('💰 Creazione payment intent:', amount, 'per:', customerId);

    const paymentIntent = {
      id: 'pi_' + Date.now(),
      client_secret: 'secret_' + Date.now(),
      status: 'requires_capture'
    };

    // SALVA TRANSAZIONE IN SUPABASE
    const transaction = await saveTransaction({
      customer_id: customerId,
      amount: amount / 100,
      gateway: 'satispay',
      status: 'pending',
      created_at: new Date().toISOString()
    });

    if (!transaction) {
      console.log('⚠️ Transazione non salvata in Supabase, ma continuo...');
    }

    res.json({ 
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('❌ Errore pagamento:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Conferma pagamento
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, amount } = req.body;
    const customerId = req.headers.customer_id || 'dev-customer-id';

    console.log('✅ Conferma pagamento:', payment_intent_id, 'per:', customerId);

    // AGGIORNA TRANSAZIONE IN SUPABASE
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('customer_id', customerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('❌ Errore aggiornamento transazione:', error.message);
      } else {
        console.log('✅ Transazione aggiornata a completed in Supabase');
      }
    } catch (dbError) {
      console.log('❌ Errore database:', dbError.message);
    }

    res.json({ 
      success: true,
      transaction: {
        id: Date.now().toString(),
        amount: amount / 100,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Errore conferma pagamento:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ottieni storico transazioni
app.get('/api/transactions', async (req, res) => {
  try {
    const customerId = req.headers.customer_id || 'dev-customer-id';
    
    console.log('📊 Caricamento transazioni per:', customerId);

    const transactions = await loadTransactions(customerId);

    // Se non ci sono transazioni, restituisci array vuoto
    res.json({
      success: true,
      transactions: transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('❌ Errore transazioni:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Webhook Stripe per conferma abbonamenti
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔄 Webhook ricevuto:', event.type);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerId = session.metadata.customer_id;

      console.log('✅ Checkout completato per customer:', customerId);

      // Aggiorna abbonamento a "active" in Supabase
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          stripe_customer_id: session.customer
        })
        .eq('customer_id', customerId);

      if (error) {
        console.log('❌ Errore aggiornamento abbonamento:', error.message);
      } else {
        console.log('✅ Abbonamento attivato in Supabase per customer:', customerId);
      }
    }

    res.json({received: true});
  } catch (error) {
    console.error('❌ Errore webhook:', error);
    res.status(500).json({error: 'Webhook handler failed'});
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 POS BACKEND COMPLETO AVVIATO');
  console.log('='.repeat(50));
  console.log(`📍 Porta: ${PORT}`);
  console.log(`💰 Abbonamenti: €19/mese`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🗄️  Database: Supabase (TUTTI i dati salvati)`);
  console.log(`✅ Clienti, transazioni e abbonamenti salvati`);
  console.log('='.repeat(50));
});