import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ReportHistory.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ReportHistory = ({ onLoadReport, onCompare }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/reports/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports);
    } catch (err) {
      setError('Помилка при завантаженні звітів');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей звіт?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      alert('Помилка при видаленні звіту');
      console.error(err);
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedReports.length < 2) {
      alert('Виберіть мінімум 2 звіти для порівняння');
      return;
    }
    onCompare(selectedReports);
  };

  if (loading) {
    return <div className="report-history-loading">Завантаження...</div>;
  }

  if (error) {
    return <div className="report-history-error">{error}</div>;
  }

  return (
    <div className="report-history">
      <div className="report-history-header">
        <h2>Історія звітів</h2>
        {selectedReports.length >= 2 && (
          <button className="compare-btn" onClick={handleCompare}>
            Порівняти вибрані ({selectedReports.length})
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <p className="no-reports">Немає збережених звітів</p>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-card-header">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report._id)}
                  onChange={() => handleSelectReport(report._id)}
                  className="report-checkbox"
                />
                <h3>{report.name}</h3>
              </div>
              
              {report.description && (
                <p className="report-description">{report.description}</p>
              )}
              
              <div className="report-details">
                <div className="detail-row">
                  <span className="detail-label">CPU:</span>
                  <span>{report.parameters.cpu} vCPU</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">RAM:</span>
                  <span>{report.parameters.ram} GB</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Storage:</span>
                  <span>{report.parameters.storage} GB</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Регіон:</span>
                  <span>{report.parameters.region}</span>
                </div>
                {report.recommendation && (
                  <div className="detail-row recommendation">
                    <span className="detail-label">Рекомендація:</span>
                    <span className="provider-badge">{report.recommendation.provider}</span>
                  </div>
                )}
              </div>

              <div className="report-date">
                {new Date(report.createdAt).toLocaleDateString('uk-UA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <div className="report-actions">
                <button 
                  className="load-btn" 
                  onClick={() => onLoadReport(report._id)}
                >
                  Завантажити
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(report._id)}
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportHistory;
