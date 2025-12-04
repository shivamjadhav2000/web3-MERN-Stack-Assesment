import React, { useState, useEffect } from 'react';
import './ConsentManagement.css';
import { apiService } from '../services/apiService';
import { useWeb3 } from '../hooks/useWeb3';

const ConsentManagement = () => {
  const { account, signMessage, isConnected } = useWeb3();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ patientId: '', purpose: '' });

  // Fetch consents from API
  const fetchConsents = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus === 'all' ? null : filterStatus;
      const data = await apiService.getConsents(null, statusParam);
      setConsents(data.consents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, [filterStatus]);

  // Create a new consent with MetaMask signature
  const handleCreateConsent = async (e) => {
    e.preventDefault();
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const message = `I consent to: ${formData.purpose} for patient: ${formData.patientId}`;
      const signature = await signMessage(message);

      await apiService.createConsent({
        patientId: formData.patientId,
        purpose: formData.purpose,
        walletAddress: account,
        signature,
      });

      fetchConsents();
      setFormData({ patientId: '', purpose: '' });
      setShowCreateForm(false);
    } catch (err) {
      alert('Failed to create consent: ' + err.message);
    }
  };

  // Update consent status (pending → active)
  const handleUpdateStatus = async (consentId, newStatus) => {
    try {
      await apiService.updateConsent(consentId, { status: newStatus });
      fetchConsents();
    } catch (err) {
      alert('Failed to update consent: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="consent-management-container">
        <div className="loading">Loading consents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consent-management-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="consent-management-container">
      <div className="consent-header">
        <h2>Consent Management</h2>
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!isConnected}
        >
          {showCreateForm ? 'Cancel' : 'Create New Consent'}
        </button>
      </div>

      {!isConnected && (
        <div className="warning">
          Please connect your MetaMask wallet to manage consents
        </div>
      )}

      {showCreateForm && isConnected && (
        <div className="create-consent-form">
          <h3>Create New Consent</h3>
          <form onSubmit={handleCreateConsent}>
            <div className="form-group">
              <label>Patient ID</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: e.target.value })
                }
                required
                placeholder="e.g., patient-001"
              />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <select
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                required
              >
                <option value="">Select purpose...</option>
                <option value="Research Study Participation">
                  Research Study Participation
                </option>
                <option value="Data Sharing with Research Institution">
                  Data Sharing with Research Institution
                </option>
                <option value="Third-Party Analytics Access">
                  Third-Party Analytics Access
                </option>
                <option value="Insurance Provider Access">
                  Insurance Provider Access
                </option>
              </select>
            </div>
            <button type="submit" className="submit-btn">
              Sign & Create Consent
            </button>
          </form>
        </div>
      )}

      <div className="consent-filters">
        {['all', 'active', 'pending'].map((status) => (
          <button
            key={status}
            className={filterStatus === status ? 'active' : ''}
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="consents-list">
        {consents.length === 0 ? (
          <div>No consents available</div>
        ) : (
          consents.map((consent) => (
            <div key={consent.id} className="consent-card">
              <p>
                <strong>Patient ID:</strong> {consent.patientId}
              </p>
              <p>
                <strong>Purpose:</strong> {consent.purpose}
              </p>
              <p>
                <strong>Status:</strong> {consent.status}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {new Date(consent.createdAt).toLocaleString()}
              </p>
              {consent.blockchainTxHash && (
                <p>
                  <strong>Blockchain Tx:</strong> {consent.blockchainTxHash}
                </p>
              )}
              {consent.status === 'pending' && isConnected && (
                <button
                  className="update-status-btn"
                  onClick={() => handleUpdateStatus(consent.id, 'active')}
                >
                  Mark Active
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsentManagement;
