import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple client-side auth (replace with backend in production)
    if (username === 'admin' && password === 'password123') {
      setIsAuthenticated(true);
      setSuccess(t('login.success'));
      setError('');
      if (newsletter) {
        const emailList = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');
        if (!emailList.includes(username)) {
          emailList.push(username);
          localStorage.setItem('newsletterEmails', JSON.stringify(emailList));
        }
      }
      setTimeout(() => navigate('/calculator'), 1000);
    } else {
      setError(t('login.error'));
      setSuccess('');
    }
  };

  return (
    <div className="login-container">
      <h1 className="text-2xl font-bold mb-6">{t('login.title')}</h1>
      <p className="text-gray-600 mb-4">{t('login.description')}</p>
      {error && <p className="login-error">{error}</p>}
      {success && <p className="login-success">{success}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder={t('login.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
          required
        />
        <input
          type="password"
          placeholder={t('login.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />
        <label className="login-checkbox">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span className="ml-2">{t('login.newsletter')}</span>
        </label>
        <button type="submit" className="login-button">
          {t('login.loginButton')}
        </button>
      </form>
    </div>
  );
}

export default Login;