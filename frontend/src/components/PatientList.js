// frontend/src/components/PatientList.js
import React, { useState, useEffect, useRef } from "react";
import "./PatientList.css";
import { apiService } from "../services/apiService";

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Fetch patients from API with page/limit/search
  const fetchPatients = async (page = currentPage, search = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      // Try common apiService signature: apiService.getPatients(page, limit, search)
      // and also handle apiService.getPatients({ page, limit, search })
      let res;
      if (typeof apiService.getPatients === "function") {
        try {
          res = await apiService.getPatients(page, limit, search);
        } catch (e) {
          // try alternative call shape
          res = await apiService.getPatients({ page, limit, search });
        }
      } else {
        throw new Error("apiService.getPatients is not available");
      }

      // Normalize response
      // common shapes:
      // 1) array: res => [ ...patients ]
      // 2) object: { data: [...], pagination: { page, totalPages, total } }
      // 3) object: { patients: [...], pagination: {...} }
      let data = [];
      let pag = null;
      if (Array.isArray(res)) {
        data = res;
      } else if (res && Array.isArray(res.data)) {
        data = res.data;
        pag = res.pagination || res.meta || null;
      } else if (res && Array.isArray(res.patients)) {
        data = res.patients;
        pag = res.pagination || res.meta || null;
      } else if (res && Array.isArray(res.result)) {
        data = res.result;
        pag = res.pagination || res.meta || null;
      } else {
        // fallback: try res.body or res.data?.patients
        data = res?.data?.patients || res?.patients || [];
      }

      setPatients(data);
      if (pag) {
        setPagination({
          page: pag.page || pag.currentPage || page,
          totalPages:
            pag.totalPages ||
            pag.total_pages ||
            Math.ceil((pag.total || data.length) / limit),
          total: pag.total || pag.count || data.length,
        });
      } else {
        // if no pagination info, infer from array length
        setPagination({
          page,
          totalPages: data.length < limit ? page : page + 1, // rough fallback
          total: data.length,
        });
      }
    } catch (err) {
      console.error("fetchPatients error", err);
      setError(err?.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPatients(currentPage, searchTerm);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, currentPage]);

  // handleSearch just updates searchTerm
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // reset page
  };

  // Pagination controls
  const goToPage = (p) => {
    if (!pagination) return;
    const target = Math.max(1, Math.min(p, pagination.totalPages || p));
    setCurrentPage(target);
  };

  const formatDOB = (dob) => {
    if (!dob) return "-";
    try {
      return new Date(dob).toLocaleDateString();
    } catch {
      return dob;
    }
  };

  if (loading) {
    return (
      <div className="patient-list-container">
        <div className="loading">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-list-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>Patients</h2>
        <input
          type="text"
          placeholder="Search patients..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="patient-list">
        {patients && patients.length ? (
          patients.map((p) => (
            <div
              key={p.id || p.patientId || p._id}
              className="patient-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                onSelectPatient && onSelectPatient(p.id || p.patientId || p._id)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  onSelectPatient &&
                    onSelectPatient(p.id || p.patientId || p._id);
              }}
            >
              <div className="patient-card-header">
                <h3>
                  {p.name ||
                    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
                    "Unnamed"}
                </h3>
                <div className="patient-dob">
                  {formatDOB(p.dateOfBirth || p.dob)}
                </div>
              </div>
              <div className="patient-card-body">
                <div className="patient-email">{p.email || "-"}</div>
                <div className="patient-phone">{p.phone || "-"}</div>
                <div className="patient-wallet">
                  {p.walletAddress || p.wallet || "-"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">No patients found</div>
        )}
      </div>

      {pagination && (
        <div className="pagination">
          <button onClick={() => goToPage(1)} disabled={pagination.page <= 1}>
            « First
          </button>
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            ‹ Prev
          </button>
          <span className="page-info">
            Page {pagination.page}{" "}
            {pagination.totalPages ? `of ${pagination.totalPages}` : ""}
          </span>
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={
              pagination.totalPages && pagination.page >= pagination.totalPages
            }
          >
            Next ›
          </button>
          <button
            onClick={() =>
              goToPage(pagination.totalPages || pagination.page + 1)
            }
            disabled={
              pagination.totalPages && pagination.page >= pagination.totalPages
            }
          >
            Last »
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientList;
