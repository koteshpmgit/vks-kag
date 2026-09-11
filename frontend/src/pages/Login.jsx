import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <span className="logo">KA</span>
          <h1>Key Artifact Generator</h1>
        </div>
        <h2>Log in</h2>
        {error && <div className="auth-error">{error}</div>}
        <label className="auth-field">
          <span>Email</span>
          <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-accent auth-submit" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="auth-switch">No account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  );
}
