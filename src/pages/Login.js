import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || '/';

  if (user) {
    return (
      <div className="login-root">
        <div className="login-card">
          <p style={{ marginTop: 0 }}>Ya has iniciado sesión.</p>
          <Link to="/" style={{ fontWeight: 700, color: 'var(--aasana-blue)' }}>
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (e2) {
      setErr(
        e2.response?.data?.message ||
          (e2.response?.data?.errors && JSON.stringify(e2.response.data.errors)) ||
          'Error al iniciar sesión'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-hero">
          <span className="login-plane" aria-hidden>
            ✈️
          </span>
          <h1 className="login-title">AASANA</h1>
          <p className="login-sub">Sistema de información de vuelos — Bolivia</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="login-field">
            <label htmlFor="em">Correo electrónico</label>
            <input
              id="em"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="pw">Contraseña</label>
            <input
              id="pw"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && <p className="login-error">{err}</p>}
          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? 'Ingresando…' : 'Entrar al sistema'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/tablero">Ver tablero público (sin inicio de sesión)</Link>
          <p className="login-hint">
            Usuarios de prueba: admin@aasana.bo · operador@aasana.bo · publico@aasana.bo — contraseña: password
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
