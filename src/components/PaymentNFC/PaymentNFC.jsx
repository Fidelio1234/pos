/*import React, { useState } from 'react';
import Keyboard from './Keyboard';
import './PaymentNFC.css';

const PaymentNFC = ({ backendUrl }) => {
  const [amount, setAmount] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [waitingForCard, setWaitingForCard] = useState(false);
  const [currentPaymentIntent, setCurrentPaymentIntent] = useState(null);

  const handleKeyInput = (key) => {
    if (waitingForCard || loading) return;
    
    let newAmount = amount.replace('.', '');
    
    if (key === 'C') {
      setAmount('0.00');
      setPaymentStatus('');
      return;
    }
    
    if (key === '.') return;
    
    newAmount = newAmount.slice(1) + key;
    const euros = newAmount.slice(0, -2) || '0';
    const cents = newAmount.slice(-2);
    
    setAmount(`${euros}.${cents}`);
  };

  const handleClear = () => {
    if (!waitingForCard && !loading) {
      setAmount('0.00');
      setPaymentStatus('');
      setCurrentPaymentIntent(null);
    }
  };

  const handleEnter = async () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0 && !waitingForCard && !loading) {
      setWaitingForCard(true);
      setPaymentStatus('💰 Importo impostato: €' + amount + ' - Avvicina la carta NFC');
      
      try {
        const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(numericAmount * 100),
            currency: 'eur'
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setCurrentPaymentIntent({
            id: data.payment_intent_id,
            client_secret: data.client_secret
          });
          startNFCDetection();
        } else {
          throw new Error(data.error || 'Errore nella creazione del pagamento');
        }
      } catch (error) {
        setPaymentStatus('❌ Errore: ' + error.message);
        setWaitingForCard(false);
      }
    }
  };

  const startNFCDetection = () => {
    setPaymentStatus('🔍 In attesa della carta NFC...');
    
    // Simula NFC per ora
    setTimeout(() => {
      if (waitingForCard && currentPaymentIntent) {
        handleNFCDetected();
      }
    }, 3000);
  };

  const handleNFCDetected = async () => {
    if (!currentPaymentIntent) {
      setPaymentStatus('❌ Errore: Nessun pagamento in corso');
      setWaitingForCard(false);
      return;
    }

    setPaymentStatus('✅ Carta rilevata! Elaborazione pagamento...');
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: currentPaymentIntent.id,
          amount: Math.round(parseFloat(amount) * 100)
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus(`✅ Pagamento di €${amount} completato!`);
        
        // Refresh dopo 2 secondi
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        throw new Error(data.error || 'Errore nella conferma del pagamento');
      }
    } catch (error) {
      setPaymentStatus('❌ Errore pagamento: ' + error.message);
      setLoading(false);
      setWaitingForCard(false);
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-header">
        <h2>POS Mobile NFC - Stripe</h2>
        <div className="amount-display">
          €{amount}
        </div>
        {waitingForCard && (
          <div className="nfc-indicator">
            🏷️ In attesa NFC...
          </div>
        )}
      </div>

      <Keyboard
        onInput={handleKeyInput}
        onClear={handleClear}
        onEnter={handleEnter}
        value={amount}
        disabled={waitingForCard || loading}
      />

      {paymentStatus && (
        <div className={`status-message ${
          paymentStatus.includes('✅') ? 'success' : 
          paymentStatus.includes('❌') ? 'error' : 
          paymentStatus.includes('💰') ? 'info' : 
          'waiting'
        }`}>
          {paymentStatus}
          {paymentStatus.includes('✅') && (
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Refresh automatico...
            </div>
          )}
        </div>
      )}

      <div className="nfc-simulator">
        {waitingForCard && currentPaymentIntent && (
          <button 
            onClick={handleNFCDetected}
            className="simulate-nfc-btn"
          >
            Simula Rilevamento NFC
          </button>
        )}
      </div>

      {/* Debug info *//*}
      {currentPaymentIntent && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          padding: '5px',
          textAlign: 'center'
        }}>
          Payment Intent: {currentPaymentIntent.id.slice(0, 10)}...
        </div>
      )}
    </div>
  );
};

export default PaymentNFC;


*/





import React, { useState } from 'react';
import Keyboard from './Keyboard';
import './PaymentNFC.css';

const PaymentNFC = ({ backendUrl }) => {
  const [amount, setAmount] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [waitingForCard, setWaitingForCard] = useState(false);

  const handleKeyInput = (key) => {
    if (waitingForCard || loading) return;
    
    let newAmount = amount.replace('.', '');
    
    if (key === 'C') {
      setAmount('0.00');
      setPaymentStatus('');
      return;
    }
    
    if (key === '.') return;
    
    newAmount = newAmount.slice(1) + key;
    const euros = newAmount.slice(0, -2) || '0';
    const cents = newAmount.slice(-2);
    
    setAmount(`${euros}.${cents}`);
  };

  const handleClear = () => {
    if (!waitingForCard && !loading) {
      setAmount('0.00');
      setPaymentStatus('');
    }
  };

  const handleEnter = async () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0 && !waitingForCard && !loading) {
      setWaitingForCard(true);
      setPaymentStatus('💰 Importo impostato: €' + amount + ' - Avvicina la carta NFC');
      
      try {
        const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(numericAmount * 100),
            currency: 'eur'
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setPaymentStatus('🔍 In attesa della carta NFC...');
          // Aspetta 3 secondi per simulare NFC
          setTimeout(() => {
            handleNFCDetected(data.payment_intent_id);
          }, 3000);
        } else {
          throw new Error(data.error || 'Errore nella creazione del pagamento');
        }
      } catch (error) {
        setPaymentStatus('❌ Errore: ' + error.message);
        setWaitingForCard(false);
      }
    }
  };

  const handleNFCDetected = async (paymentIntentId) => {
    setPaymentStatus('✅ Carta rilevata! Elaborazione pagamento...');
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          amount: Math.round(parseFloat(amount) * 100)
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus(`✅ Pagamento di €${amount} completato!`);
        
        // Refresh dopo 2 secondi
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        throw new Error(data.error || 'Errore nella conferma del pagamento');
      }
    } catch (error) {
      setPaymentStatus('❌ Errore pagamento: ' + error.message);
      setLoading(false);
      setWaitingForCard(false);
    }
  };

  // Funzione per simulazione manuale
  const handleManualSimulation = async () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0 && !waitingForCard && !loading) {
      setWaitingForCard(true);
      setPaymentStatus('💰 Importo impostato: €' + amount + ' - Simulazione NFC...');
      
      try {
        const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(numericAmount * 100),
            currency: 'eur'
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          // Conferma immediata per simulazione
          handleNFCDetected(data.payment_intent_id);
        } else {
          throw new Error(data.error || 'Errore nella creazione del pagamento');
        }
      } catch (error) {
        setPaymentStatus('❌ Errore: ' + error.message);
        setWaitingForCard(false);
      }
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-header">
        <h2>POS Mobile NFC - Simulazione</h2>
        <div className="amount-display">
          €{amount}
        </div>
        {waitingForCard && (
          <div className="nfc-indicator">
            🏷️ In attesa NFC...
          </div>
        )}
      </div>

      <Keyboard
        onInput={handleKeyInput}
        onClear={handleClear}
        onEnter={handleEnter}
        value={amount}
        disabled={waitingForCard || loading}
      />

      {paymentStatus && (
        <div className={`status-message ${
          paymentStatus.includes('✅') ? 'success' : 
          paymentStatus.includes('❌') ? 'error' : 
          paymentStatus.includes('💰') ? 'info' : 
          'waiting'
        }`}>
          {paymentStatus}
          {paymentStatus.includes('✅') && (
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Refresh automatico...
            </div>
          )}
        </div>
      )}

      {/* Pulsante per simulazione immediata */}
      {!waitingForCard && !loading && parseFloat(amount) > 0 && (
        <div className="nfc-simulator">
          <button 
            onClick={handleManualSimulation}
            className="simulate-nfc-btn"
            style={{ background: '#28a745' }}
          >
            🏷️ Simula Pagamento NFC Immediato
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentNFC;