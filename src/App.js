import React, { useState } from 'react';
import PaymentNFC from './components/PaymentNFC/PaymentNFC';
import TransactionHistory from './components/TransactionHistory/TransactionHistory';
import './App.css';

// USA BACKEND LOCALE per ora
const BACKEND_URL = 'http://localhost:3001';

function App() {
  const [activeTab, setActiveTab] = useState('payment');

  return (
    <div className="App">
      <div className="app-container">
        <header className="app-header">
          <h1>🧾 POS System - Stripe Live</h1>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            Connesso a: Backend Locale
          </div>
          <nav className="app-nav">
            <button 
              className={`nav-btn ${activeTab === 'payment' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment')}
            >
              💳 Pagamento
            </button>
            <button 
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📊 Storico
            </button>
          </nav>
        </header>

        <main className="app-main">
          {activeTab === 'payment' ? (
            <PaymentNFC backendUrl={BACKEND_URL} />
          ) : (
            <TransactionHistory backendUrl={BACKEND_URL} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;