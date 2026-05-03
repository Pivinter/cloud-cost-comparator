import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CostChart from './CostChart';
import './ReportComparison.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ReportComparison = ({ reportIds, onClose }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [reportIds]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/reports/compare`,
        { reportIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(response.data.reports);
    } catch (err) {
      setError('Помилка при завантаженні звітів для порівняння');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="comparison-modal">
        <div className="comparison-content loading">
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comparison-modal">
        <div className="comparison-content error">
          <p>{error}</p>
          <button onClick={onClose}>Закрити</button>
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-modal">
      <div className="comparison-content">
        <div className="comparison-header">
          <h2>Порівняння звітів</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="comparison-body">
          {/* Таблиця параметрів */}
          <div className="comparison-section">
            <h3>Параметри конфігурації</h3>
            <div className="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Параметр</th>
                    {reports.map((report, idx) => (
                      <th key={report._id}>
                        {report.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CPU</td>
                    {reports.map(report => (
                      <td key={report._id}>{report.parameters.cpu} vCPU</td>
                    ))}
                  </tr>
                  <tr>
                    <td>RAM</td>
                    {reports.map(report => (
                      <td key={report._id}>{report.parameters.ram} GB</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Storage</td>
                    {reports.map(report => (
                      <td key={report._id}>{report.parameters.storage} GB</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Тривалість</td>
                    {reports.map(report => (
                      <td key={report._id}>{report.parameters.duration} год</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Регіон</td>
                    {reports.map(report => (
                      <td key={report._id}>{report.parameters.region}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Порівняння цін */}
          <div className="comparison-section">
            <h3>Порівняння вартості</h3>
            {reports.map(report => (
              <div key={report._id} className="report-costs">
                <h4>{report.name}</h4>
                <CostChart results={report.results} />
              </div>
            ))}
          </div>

          {/* Порівняння рекомендацій */}
          <div className="comparison-section">
            <h3>Рекомендації</h3>
            <div className="recommendations-comparison">
              {reports.map(report => (
                <div key={report._id} className="recommendation-item">
                  <h4>{report.name}</h4>
                  {report.recommendation ? (
                    <>
                      <div className="provider-badge-large">
                        {report.recommendation.provider}
                      </div>
                      <p className="recommendation-reason">
                        {report.recommendation.reason}
                      </p>
                      <p className="recommendation-score">
                        Оцінка: {(report.recommendation.score * 100).toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <p>Немає рекомендації</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Дата створення */}
          <div className="comparison-section">
            <h3>Дата створення</h3>
            <div className="dates-comparison">
              {reports.map(report => (
                <div key={report._id} className="date-item">
                  <strong>{report.name}:</strong>{' '}
                  {new Date(report.createdAt).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportComparison;
