import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../hooks/useWeb3';

const TransactionHistory = () => {
  const { account } = useWeb3();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTransactions(account);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [account]);

  const formatAddress = (address) =>
    address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString();

  if (loading) {
    return (
      <div className="transaction-history-container">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="transaction-history-container">
      <div className="transaction-header">
        <h2>Transaction History</h2>
        {account && (
          <div className="wallet-filter">
            Filtering for: {formatAddress(account)}
          </div>
        )}
      </div>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div>No transactions found</div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <p>
                <strong>Type:</strong> {tx.type}
              </p>
              <p>
                <strong>From:</strong> {formatAddress(tx.from)}
              </p>
              <p>
                <strong>To:</strong> {formatAddress(tx.to)}
              </p>
              <p>
                <strong>Amount:</strong> {tx.amount} {tx.currency}
              </p>
              <p>
                <strong>Status:</strong> {tx.status}
              </p>
              <p>
                <strong>Timestamp:</strong> {formatDate(tx.timestamp)}
              </p>
              {tx.blockchainTxHash && (
                <p>
                  <strong>Blockchain Tx:</strong> {tx.blockchainTxHash}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
