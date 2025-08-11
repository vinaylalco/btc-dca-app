import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t('signup.error'));
      setSuccess('');
      return;
    }
    if (newsletter) {
      const emailList = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');
      if (emailList.includes(email)) {
        setError(t('signup.error'));
        setSuccess('');
      } else {
        emailList.push(email);
        localStorage.setItem('newsletterEmails', JSON.stringify(emailList));
        setSuccess(t('signup.success'));
        setError('');
        setEmail('');
        setTimeout(() => navigate('/'), 1000);
      }
    } else {
      setSuccess(t('signup.success'));
      setError('');
      setEmail('');
      setTimeout(() => navigate('/'), 1000);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="text-2xl font-bold mb-6">{t('signup.title')}</h1>
      {error && <p className="signup-error">{error}</p>}
      {success && <p className="signup-success">{success}</p>}
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder={t('signup.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
          required
        />
        <label className="signup-checkbox">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span className="ml-2">{t('signup.newsletter')}</span>
        </label>
        <button type="submit" className="signup-button">
          {t('signup.signupButton')}
        </button>
      </form>
    </div>
  );
}

export default Signup;