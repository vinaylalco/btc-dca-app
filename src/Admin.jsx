import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';

function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const { t } = useTranslation();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple client-side admin check (replace with backend in production)
    if (username === 'admin' && password === 'password123') {
      setIsAdmin(true);
      setError('');
    } else {
      setError(t('admin.loginError'));
    }
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const emailList = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');
    // Simulate sending email (replace with backend API in production)
    console.log('Sending email:', { subject, message, recipients: emailList });
    setStatus(t('admin.emailSent', { count: emailList.length }));
    setSubject('');
    setMessage('');
  };

  const handleExportEmails = () => {
    const emailList = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');
    const csvContent = 'Email\n' + emailList.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'newsletter_emails.csv');
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <h1 className="text-2xl font-bold mb-6">{t('admin.login')}</h1>
        {error && <p className="signup-error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder={t('admin.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="signup-input"
            required
          />
          <input
            type="password"
            placeholder={t('admin.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signup-input"
            required
          />
          <button type="submit" className="signup-button">
            {t('admin.loginButton')}
          </button>
        </form>
      </div>
    );
  }

  const emailList = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');

  return (
    <div className="admin-container">
      <h1 className="text-2xl font-bold mb-6">{t('admin.title')}</h1>
      <h2 className="text-lg font-semibold mb-4">{t('admin.emailList')}</h2>
      {emailList.length > 0 ? (
        <ul className="list-disc pl-5 mb-6">
          {emailList.map((email, index) => (
            <li key={index} className="text-gray-700">{email}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 mb-6">{t('admin.noSubscribers')}</p>
      )}
      <h2 className="text-lg font-semibold mb-4">{t('admin.sendEmail')}</h2>
      {status && <p className="text-green-500 mb-4">{status}</p>}
      <form onSubmit={handleSendEmail}>
        <input
          type="text"
          placeholder={t('admin.subject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="signup-input"
          required
        />
        <textarea
          placeholder={t('admin.message')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="admin-textarea"
          rows="5"
          required
        />
        <button type="submit" className="signup-button">
          {t('admin.sendButton')}
        </button>
      </form>
      <button
        onClick={handleExportEmails}
        className="signup-button mt-4"
        disabled={emailList.length === 0}
      >
        {t('admin.exportButton')}
      </button>
    </div>
  );
}

export default Admin;