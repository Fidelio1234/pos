import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';

const TransactionHistory = ({ backendUrl }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/transactions`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        setError('Errore nel caricamento transazioni');
      }
    } catch (err) {
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      default:
        return 'completed';
    }
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

      {error && <div className="error-message">{error}</div>}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>Nessuna transazione effettuata</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-main">
                <div className="transaction-amount">
                  {formatAmount(transaction.amount)}
                </div>
                <div className={`transaction-status ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </div>
              </div>
              <div className="transaction-details">
                <div className="transaction-date">
                  {formatDate(transaction.timestamp)}
                </div>
                <div className="transaction-id">
                  ID: {transaction.id.slice(-8)}
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