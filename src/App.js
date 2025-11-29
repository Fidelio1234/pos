import React, { useState, useEffect } from 'react';
import PaymentNFC from './components/PaymentNFC/PaymentNFC';
import TransactionHistory from './components/TransactionHistory/TransactionHistory';
import PricingPage from './components/Pricing/PricingPage';
import './App.css';

const BACKEND_URL = 'http://localhost:3001';

function App() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);

  // Controlla stato abbonamento al caricamento
  useEffect(() => {
    checkSubscriptionStatus();
    checkUrlForSuccess();
  }, []);

  // Controlla se siamo sulla pagina di successo dopo il pagamento
  const checkUrlForSuccess = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const customerId = urlParams.get('customer_id');

    if (sessionId && customerId) {
      console.log('🔄 Rilevato ritorno da Stripe, verifico pagamento...');
      setCustomerId(customerId);
      verifyPaymentSuccess(sessionId, customerId);
      
      // Se siamo su /success, reindirizza alla home
      if (window.location.pathname === '/success') {
        window.history.replaceState({}, document.title, '/');
      }
    }
  };

  // Verifica se il pagamento è andato a buon fine
  const verifyPaymentSuccess = async (sessionId, customerId) => {
    try {
      setLoading(true);
      console.log('🔍 Verifico stato pagamento per sessione:', sessionId);

      const response = await fetch(
        `${BACKEND_URL}/api/subscriptions/check-session?session_id=${sessionId}&customer_id=${customerId}`
      );
      
      const data = await response.json();
      
      if (data.success && data.status === 'active') {
        console.log('✅ Pagamento confermato! Attivo abbonamento...');
        setHasSubscription(true);
        setActiveTab('payment');
        setCustomerId(customerId);
        
        // Salva customer_id per future richieste
        localStorage.setItem('customer_id', customerId);
        
        // Mostra messaggio di successo
        alert('🎉 Pagamento confermato! Il tuo abbonamento è ora attivo.');
      } else {
        console.log('⏳ Pagamento ancora in elaborazione... stato:', data.status);
        // Riprova dopo 2 secondi
        setTimeout(() => verifyPaymentSuccess(sessionId, customerId), 2000);
      }
    } catch (error) {
      console.error('❌ Errore verifica pagamento:', error);
      // Riprova dopo 3 secondi in caso di errore
      setTimeout(() => verifyPaymentSuccess(sessionId, customerId), 3000);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      // Prova a recuperare il customer_id dal localStorage
      const savedCustomerId = localStorage.getItem('customer_id');
      const headers = savedCustomerId ? { 'customer_id': savedCustomerId } : {};
      
      const response = await fetch(`${BACKEND_URL}/api/subscriptions/status`, {
        headers: headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHasSubscription(data.has_subscription);
        if (data.has_subscription) {
          setActiveTab('payment');
          if (savedCustomerId) {
            setCustomerId(savedCustomerId);
          }
        }
      }
    } catch (error) {
      console.error('Errore verifica abbonamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionActive = () => {
    setHasSubscription(true);
    setActiveTab('payment');
    checkSubscriptionStatus(); // Ricarica i dati completi
  };

  // Se sta caricando, mostra loading
  if (loading) {
    return (
      <div className="App">
        <div className="app-container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column'
          }}>
            <h2>Caricamento...</h2>
            <p>Verifica stato abbonamento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-container">
        <header className="app-header">
          <h1>🧾 POS Satispay</h1>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            {hasSubscription ? '🎉 Piano Base Attivo' : 'Nessun abbonamento attivo'}
          </div>
          
          {hasSubscription && (
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
              <button 
                className={`nav-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                💰 Il Mio Piano
              </button>
            </nav>
          )}
        </header>

        <main className="app-main">
          {!hasSubscription ? (
            <PricingPage 
              backendUrl={BACKEND_URL} 
              onSubscriptionActive={handleSubscriptionActive}
            />
          ) : (
            <>
              {activeTab === 'payment' && <PaymentNFC backendUrl={BACKEND_URL} customerId={customerId} />}
              {activeTab === 'history' && <TransactionHistory backendUrl={BACKEND_URL} customerId={customerId} />}
              {activeTab === 'pricing' && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h2>🎉 Piano Base Attivo</h2>
                  <p>Il tuo abbonamento è attivo!</p>
                  <button 
                    onClick={checkSubscriptionStatus}
                    style={{ 
                      padding: '10px 20px', 
                      marginTop: '15px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    Aggiorna Stato
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Banner per attivare abbonamento */}
        {!hasSubscription && activeTab !== 'pricing' && (
          <div style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            padding: '15px',
            textAlign: 'center',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000
          }}>
            <strong>Attiva il Piano Base per sbloccare tutte le funzionalità</strong>
            <button 
              onClick={() => setActiveTab('pricing')}
              style={{
                marginLeft: '15px',
                padding: '8px 16px',
                background: 'white',
                color: '#28a745',
                border: 'none',
                borderRadius: '20px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Sblocca Ora - €19/mese
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;