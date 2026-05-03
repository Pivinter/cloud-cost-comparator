import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = ({ onToggle }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль має бути мінімум 6 символів');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка при реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Реєстрація</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Ім'я:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Підтвердіть пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Реєструємося...' : 'Зареєструватися'}
          </button>
        </form>

        <p className="auth-toggle">
          Вже є акаунт?{' '}
          <span onClick={onToggle} className="toggle-link">
            Увійти
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
