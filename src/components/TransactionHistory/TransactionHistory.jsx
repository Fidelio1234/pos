import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';

const TransactionHistory = ({ backendUrl }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/transactions`, {
        headers: {
          'customer_id': 'dev-customer-id' // ⬅️ AGGIUNGI QUESTO
        }
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        setError('Errore nel caricamento transazioni');
      }
    } catch (err) {
      console.error('Errore caricamento transazioni:', err);
      setError('Errore di connessione al server');
      // In caso di errore, mostra dati mock per sviluppo
      if (process.env.NODE_ENV === 'development') {
        setTransactions(getMockTransactions());
      }
    } finally {
      setLoading(false);
    }
  };

  // Dati mock per sviluppo
  const getMockTransactions = () => {
    return [
      {
        id: '1',
        amount: 25.50,
        currency: 'eur',
        status: 'completed',
        gateway: 'satispay',
        created_at: new Date('2024-01-15T10:30:00Z').toISOString()
      },
      {
        id: '2',
        amount: 12.75,
        currency: 'eur', 
        status: 'completed',
        gateway: 'satispay',
        created_at: new Date('2024-01-15T09:15:00Z').toISOString()
      },
      {
        id: '3',
        amount: 8.20,
        currency: 'eur',
        status: 'completed',
        gateway: 'satispay',
        created_at: new Date('2024-01-14T16:45:00Z').toISOString()
      }
    ];
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('it-IT');
  };

  const formatAmount = (amount) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="transaction-history">
        <h3>Storico Transazioni</h3>
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h3>Storico Transazioni</h3>
        <button onClick={loadTransactions} className="refresh-btn">
          🔄 Aggiorna
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            Modalità sviluppo: mostro dati di esempio
          </div>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>Nessuna transazione effettuata</p>
          <button 
            onClick={() => setTransactions(getMockTransactions())}
            style={{
              padding: '8px 16px',
              marginTop: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Carica Dati Esempio
          </button>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-main">
                <div className="transaction-amount">
                  {formatAmount(transaction.amount)}
                </div>
                <div className={`transaction-status ${transaction.status}`}>
                  {transaction.status}
                </div>
              </div>
              <div className="transaction-details">
                <div className="transaction-date">
                  {formatDate(transaction.created_at)}
                </div>
                <div className="transaction-gateway">
                  {transaction.gateway}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="history-summary">
        <strong>Totale: {transactions.length} transazioni</strong>
      </div>
    </div>
  );
};

export default TransactionHistory;