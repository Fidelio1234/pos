// server con reale pagamento




/*import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database in memoria
let transactions = [];

// CORS configurazione
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://il-tuo-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS Backend running' });
});

// Crea pagamento con Stripe reale
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur' } = req.body;

    console.log('💰 Creazione payment intent Stripe:', amount, currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        pos_system: 'mobile_nfc_pos'
      }
    });

    console.log('✅ Payment Intent creato:', paymentIntent.id);

    res.json({ 
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('❌ Errore Stripe:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});


*/









// server con simulazione


import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
let transactions = [];
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.options('*', cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS Backend running' });
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const simulatedPaymentIntent = {
      id: 'pi_simulated_' + Date.now(),
      client_secret: 'simulated_secret_' + Date.now(),
      status: 'requires_capture'
    };

    console.log('💰 Payment Intent creato:', simulatedPaymentIntent.id);

    res.json({ 
      success: true,
      client_secret: simulatedPaymentIntent.client_secret,
      payment_intent_id: simulatedPaymentIntent.id
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, amount } = req.body;

    if (payment_intent_id.startsWith('pi_simulated_')) {
      const transaction = {
        id: Date.now().toString(),
        amount: amount / 100,
        currency: 'eur',
        stripe_id: payment_intent_id,
        status: 'completed',
        timestamp: new Date().toISOString(),
        payment_method: 'nfc_simulated'
      };
      
      transactions.push(transaction);
      
      res.json({ success: true, transaction });
    } else {
      res.status(400).json({ success: false, error: 'Usa modalità simulazione' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json({
      success: true,
      transactions: sortedTransactions,
      total: sortedTransactions.length
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server backend sulla porta ${PORT}`);
  console.log(`💳 Modalità: SIMULAZIONE NFC`);
});