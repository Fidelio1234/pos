import React, { useState, useEffect } from 'react';
import './PricingPage.css';

const PricingPage = ({ backendUrl, onSubscriptionActive }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: ''
  });

  // Verifica se siamo tornati da un pagamento Stripe
  useEffect(() => {
    const checkReturnFromStripe = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const customerId = urlParams.get('customer_id');

      // Se abbiamo i parametri di ritorno da Stripe
      if (sessionId && customerId) {
        console.log('🔄 Rilevato ritorno da Stripe, verifico pagamento...');
        setLoading(true);
        
        try {
          const response = await fetch(
            `${backendUrl}/api/subscriptions/check-session?session_id=${sessionId}&customer_id=${customerId}`
          );
          
          const data = await response.json();
          
          if (data.success && data.status === 'active') {
            console.log('✅ Pagamento confermato!');
            
            // Pulisci l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Attiva l'abbonamento e reindirizza al POS
            if (onSubscriptionActive) {
              onSubscriptionActive();
            }
            
            // Mostra messaggio di successo
            alert('🎉 Pagamento confermato! Il tuo abbonamento è ora attivo.');
          } else {
            console.log('⏳ Pagamento ancora in elaborazione... stato:', data.status);
            // Continua il polling
            continuePolling(sessionId, customerId);
          }
        } catch (error) {
          console.error('❌ Errore verifica pagamento:', error);
          // Riprova in caso di errore
          setTimeout(() => checkReturnFromStripe(), 3000);
        } finally {
          setLoading(false);
        }
      }
    };

    const continuePolling = (sessionId, customerId) => {
      const poll = async () => {
        try {
          const response = await fetch(
            `${backendUrl}/api/subscriptions/check-session?session_id=${sessionId}&customer_id=${customerId}`
          );
          
          const data = await response.json();
          
          if (data.success && data.status === 'active') {
            console.log('✅ Pagamento confermato via polling!');
            
            // Pulisci l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Attiva l'abbonamento
            if (onSubscriptionActive) {
              onSubscriptionActive();
            }
            
            alert('🎉 Pagamento confermato! Il tuo abbonamento è ora attivo.');
          } else {
            console.log('⏳ Polling: pagamento ancora in elaborazione...');
            setTimeout(poll, 2000);
          }
        } catch (error) {
          console.error('❌ Errore polling:', error);
          setTimeout(poll, 3000);
        }
      };
      
      poll();
    };

    checkReturnFromStripe();
  }, [backendUrl, onSubscriptionActive]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubscribe = async () => {
    if (!formData.business_name || !formData.email) {
      alert('Compila tutti i campi obbligatori: Nome Attività e Email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/subscriptions/create-base`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Checkout creato, reindirizzamento a Stripe...');
        // Salva i dati temporaneamente nel localStorage
        localStorage.setItem('pending_customer_id', data.customer_id);
        localStorage.setItem('pending_session_id', data.session_id);
        
        // Reindirizza a Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        alert('Errore: ' + data.error);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Scegli il Piano Perfetto per la Tua Attività</h1>
        <p>Inizia ad accettare pagamenti Satispay in pochi minuti</p>
      </div>

      <div className="pricing-cards">
        <div className="pricing-card featured">
          <div className="card-header">
            <h3>Piano Base</h3>
            <div className="price">€19<span>/mese</span></div>
            <p className="price-description">Ideale per piccole attività e professionisti</p>
          </div>
          
          <div className="card-features">
            <ul>
              <li>✅ Pagamenti Satispay illimitati</li>
              <li>✅ App POS inclusa</li>
              <li>✅ Nessun costo di setup</li>
              <li>✅ Supporto tecnico dedicato</li>
              <li>✅ Aggiornamenti gratuiti</li>
              <li>✅ Dashboard transazioni</li>
            </ul>
          </div>

          <div className="card-form">
            <h4>Attiva il tuo account</h4>
            
            <div className="form-group">
              <label>Nome Attività *</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                placeholder="Il tuo nome attività"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="la-tua-email@esempio.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Telefono (opzionale)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+39 123 456 7890"
                disabled={loading}
              />
            </div>

            <button 
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Attiva Piano Base - €19/mese'}
            </button>
            
            <p className="security-note">
              🔒 Pagamento sicuro con Stripe. Cancellazione anytime.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Reindirizzamento a Stripe...</p>
        </div>
      )}
    </div>
  );
};

export default PricingPage;