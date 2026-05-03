import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import CostChart from './components/CostChart';
import RecommendationCard from './components/RecommendationCard';
import ResultsTable from './components/ResultsTable';
import ReportHistory from './components/ReportHistory';
import ReportComparison from './components/ReportComparison';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showHistory, setShowHistory] = useState(false);
  const [compareReports, setCompareReports] = useState(null);
  const [formData, setFormData] = useState({
    cpu: 2,
    ram: 8,
    storage: 500,
    duration: 730,
    region: 'europe-west'
  });

  const [regions, setRegions] = useState([]);
  const [results, setResults] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${API_URL}/regions`);
      setRegions(response.data.regions);
    } catch (err) {
      console.error('Error fetching regions:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'region' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setRecommendation(null);

    try {
      const response = await axios.post(`${API_URL}/calculate`, formData);
      
      if (response.data.success) {
        setResults(response.data.results);
        setRecommendation(response.data.recommendation);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Помилка при розрахунку. Спробуйте ще раз.'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      alert('Введіть назву звіту');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/reports/save`,
        {
          name: reportName,
          description: reportDescription,
          parameters: formData,
          results,
          recommendation
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      alert('Звіт збережено!');
      setSaveDialogOpen(false);
      setReportName('');
      setReportDescription('');
      setShowHistory(true);
    } catch (err) {
      alert('Помилка при збереженні звіту');
      console.error(err);
    }
  };

  const handleLoadReport = async (reportId) => {
    try {
      const response = await axios.get(`${API_URL}/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const report = response.data.report;
      setFormData(report.parameters);
      setResults(report.results);
      setRecommendation(report.recommendation);
      setShowHistory(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Помилка при завантаженні звіту');
      console.error(err);
    }
  };

  const handleCompareReports = (reportIds) => {
    setCompareReports(reportIds);
    setShowHistory(false);
  };

  if (authLoading) {
    return <div className="App loading">Завантаження...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Порівняння вартості хмарних провайдерів</h1>
        <p className="subtitle">Інформаційна система для підбору розподілених технологій</p>
        
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <span className="user-info">Привіт, {user?.name}!</span>
              <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
                {showHistory ? 'Калькулятор' : 'Історія звітів'}
              </button>
              <button onClick={logout} className="logout-btn">Вийти</button>
            </>
          ) : (
            <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="login-btn">
              Увійти
            </button>
          )}
        </div>
      </header>

      {showAuth && !isAuthenticated && (
        authMode === 'login' ? (
          <Login onToggle={() => setAuthMode('register')} />
        ) : (
          <Register onToggle={() => setAuthMode('login')} />
        )
      )}

      {compareReports && (
        <ReportComparison 
          reportIds={compareReports} 
          onClose={() => setCompareReports(null)} 
        />
      )}

      <div className="container">
        {showHistory && isAuthenticated ? (
          <ReportHistory 
            onLoadReport={handleLoadReport}
            onCompare={handleCompareReports}
          />
        ) : (
          <>
            <div className="disclaimer">
              <strong>Оновлено (жовтень 2025):</strong> Ціни базуються на реальних даних з офіційних калькуляторів (точність ±5-10%). 
              Reserved Instances знижки відповідають офіційній документації. 
              Для точних цін конкретних SKU використовуйте: 
              <a href="https://azure.microsoft.com/pricing/calculator/" target="_blank" rel="noopener noreferrer">Azure</a>, 
              <a href="https://calculator.aws/" target="_blank" rel="noopener noreferrer">AWS</a>, 
              <a href="https://cloud.google.com/products/calculator" target="_blank" rel="noopener noreferrer">GCP</a>
            </div>

        <div className="form-section">
          <h2>Параметри конфігурації</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cpu">
                Кількість vCPU:
                <span className="value-display">{formData.cpu}</span>
              </label>
              <input
                type="range"
                id="cpu"
                name="cpu"
                min="1"
                max="32"
                value={formData.cpu}
                onChange={handleInputChange}
              />
              <div className="range-labels">
                <span>1</span>
                <span>32</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ram">
                Обсяг RAM (GB):
                <span className="value-display">{formData.ram} GB</span>
              </label>
              <input
                type="range"
                id="ram"
                name="ram"
                min="1"
                max="256"
                value={formData.ram}
                onChange={handleInputChange}
              />
              <div className="range-labels">
                <span>1 GB</span>
                <span>256 GB</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="storage">
                Обсяг Storage (GB):
                <span className="value-display">{formData.storage} GB</span>
              </label>
              <input
                type="range"
                id="storage"
                name="storage"
                min="10"
                max="5000"
                step="10"
                value={formData.storage}
                onChange={handleInputChange}
              />
              <div className="range-labels">
                <span>10 GB</span>
                <span>5000 GB</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                Тривалість (годин):
                <span className="value-display">
                  {formData.duration} год ({(formData.duration / 730).toFixed(1)} міс)
                </span>
              </label>
              <input
                type="range"
                id="duration"
                name="duration"
                min="1"
                max="26280"
                step="1"
                value={formData.duration}
                onChange={handleInputChange}
              />
              <div className="range-labels">
                <span>1 год</span>
                <span>3 роки</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="region">Регіон:</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Розраховуємо...' : 'Розрахувати вартість'}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {results && (
          <div className="results-section">
            <div className="results-header">
              <h2>Результати порівняння</h2>
              {isAuthenticated && (
                <button 
                  onClick={() => setSaveDialogOpen(true)} 
                  className="save-report-btn"
                >
                  Зберегти звіт
                </button>
              )}
            </div>
            
            <CostChart results={results} />
            
            <ResultsTable results={results} />
            
            {recommendation && (
              <RecommendationCard recommendation={recommendation} />
            )}
          </div>
        )}

        {saveDialogOpen && (
          <div className="save-dialog-overlay" onClick={() => setSaveDialogOpen(false)}>
            <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Зберегти звіт</h3>
              <div className="form-group">
                <label>Назва звіту:</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Наприклад: Проект A - Продакшн"
                />
              </div>
              <div className="form-group">
                <label>Опис (необов'язково):</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Додаткова інформація про конфігурацію"
                  rows="3"
                />
              </div>
              <div className="dialog-actions">
                <button onClick={() => setSaveDialogOpen(false)} className="cancel-btn">
                  Скасувати
                </button>
                <button onClick={handleSaveReport} className="save-btn">
                  Зберегти
                </button>
              </div>
            </div>
          </div>
        )}

        {!results && !loading && !error && (
          <div className="placeholder">
            <p>Налаштуйте параметри та натисніть "Розрахувати вартість"</p>
            <p>Система порівняє ціни на Azure, AWS та GCP</p>
            {!isAuthenticated && (
              <p className="auth-hint">
                💡 <strong>Увійдіть</strong>, щоб зберігати та порівнювати звіти
              </p>
            )}
          </div>
        )}
          </>
        )}
      </div>

      <footer className="App-footer">
        <p>Дипломна робота: Інформаційна система для підбору розподілених технологій за заданими критеріями</p>
        <p>Метод багатокритеріального аналізу: TOPSIS</p>
      </footer>
    </div>
  );
}

export default App;
