// frontend/src/components/PatientDetail.js
import React, { useState, useEffect } from 'react';
import './PatientDetail.css';
import { apiService } from '../services/apiService';

const PatientDetail = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch patient details and records
  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        let patientRes;
        if (typeof apiService.getPatient === 'function') {
          patientRes = await apiService.getPatient(patientId);
        } else if (typeof apiService.getPatients === 'function') {
          // fallback: try fetching single patient via list and filter
          const list = await apiService.getPatients(1, 1000, '');
          const arr = Array.isArray(list) ? list : list.data || list.patients || [];
          patientRes = arr.find((p) => p.id === patientId || p.patientId === patientId || p._id === patientId);
        }

        let recordsRes;
        if (typeof apiService.getPatientRecords === 'function') {
          recordsRes = await apiService.getPatientRecords(patientId);
        } else if (typeof apiService.getRecordsByPatient === 'function') {
          recordsRes = await apiService.getRecordsByPatient(patientId);
        } else {
          // try endpoint: getRecords(patientId)
          if (typeof apiService.getRecords === 'function') {
            recordsRes = await apiService.getRecords({ patientId });
          } else {
            recordsRes = [];
          }
        }

        // normalize patient
        const patientData = patientRes && patientRes.data ? patientRes.data : patientRes;
        setPatient(patientData || null);

        // normalize records
        let recs = [];
        if (Array.isArray(recordsRes)) recs = recordsRes;
        else if (recordsRes && Array.isArray(recordsRes.data)) recs = recordsRes.data;
        else if (recordsRes && Array.isArray(recordsRes.records)) recs = recordsRes.records;
        else recs = [];

        // sort descending by date if available
        recs.sort((a, b) => {
          const da = new Date(a.date || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.createdAt || 0).getTime();
          return db - da;
        });

        setRecords(recs);
      } catch (err) {
        console.error('fetchPatientData error', err);
        setError(err?.message || 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    } else {
      setLoading(false);
      setPatient(null);
      setRecords([]);
    }
  }, [patientId]);

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="patient-detail-container">
        <div className="loading">Loading patient details...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="patient-detail-container">
        <div className="error">Error loading patient: {error || 'Patient not found'}</div>
        <button onClick={onBack} className="back-btn">Back to List</button>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-header">
        <button onClick={onBack} className="back-btn">← Back to List</button>
        <h2>{patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'}</h2>
      </div>

      <div className="patient-detail-content">
        <div className="patient-info-section">
          <h3>Patient Information</h3>
          <div className="info-grid">
            <div><strong>Name:</strong> {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}</div>
            <div><strong>Email:</strong> {patient.email || '-'}</div>
            <div><strong>Date of Birth:</strong> {formatDate(patient.dateOfBirth || patient.dob)}</div>
            <div><strong>Gender:</strong> {patient.gender || '-'}</div>
            <div><strong>Phone:</strong> {patient.phone || '-'}</div>
            <div><strong>Address:</strong> {patient.address || patient.location || '-'}</div>
            <div><strong>Wallet:</strong> {patient.walletAddress || patient.wallet || '-'}</div>
          </div>
        </div>

        <div className="patient-records-section">
          <h3>Medical Records ({records.length})</h3>
          {records.length ? (
            <div className="records-list">
              {records.map((r) => (
                <div className="record-card" key={r.id || r.recordId || r._id}>
                  <div className="record-header">
                    <div className="record-type">{r.type || r.recordType || 'Record'}</div>
                    <div className="record-date">{formatDate(r.date || r.createdAt)}</div>
                  </div>
                  <div className="record-body">
                    <div className="record-title">{r.title || r.description || '-'}</div>
                    <div className="record-meta">
                      <span><strong>Doctor:</strong> {r.doctor || r.provider || '-'}</span>
                      <span><strong>Hospital:</strong> {r.hospital || r.facility || '-'}</span>
                      <span><strong>Status:</strong> {r.status || '-'}</span>
                    </div>
                    {r.blockchainHash && (
                      <div className="record-hash">
                        <strong>Blockchain Hash:</strong> <code title={r.blockchainHash}>{r.blockchainHash}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No medical records found for this patient.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
