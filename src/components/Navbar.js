import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, role, logout, isAdmin, canRunOps } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const isActive = (p) => loc.pathname === p;
  const flightsActive = loc.pathname === '/vuelos' || loc.pathname.startsWith('/vuelos/');

  if (!user) {
    return null;
  }

  const roleClass =
    role === 'admin' ? 'aasana-nav__badge-role--admin' : role === 'operador' ? 'aasana-nav__badge-role--operador' : 'aasana-nav__badge-role--publico';

  return (
    <header className="aasana-nav">
      <div className="aasana-nav__inner">
        <Link to="/" className="aasana-nav__brand">
          <span className="aasana-nav__icon" aria-hidden>
            ✈️
          </span>
          <span className="aasana-nav__title">AASANA</span>
          <span className="aasana-nav__tag">Bolivia</span>
        </Link>

        <nav className="aasana-nav__links" aria-label="Principal">
          <Link to="/" className={`aasana-nav__link${isActive('/') ? ' aasana-nav__link--active' : ''}`}>
            Inicio
          </Link>
          <Link to="/vuelos" className={`aasana-nav__link${flightsActive ? ' aasana-nav__link--active' : ''}`}>
            Vuelos
          </Link>
          {isAdmin && (
            <Link to="/vuelos/nuevo" className={`aasana-nav__link${isActive('/vuelos/nuevo') ? ' aasana-nav__link--active' : ''}`}>
              Nuevo vuelo
            </Link>
          )}
          <Link to="/reportes" className={`aasana-nav__link${isActive('/reportes') ? ' aasana-nav__link--active' : ''}`}>
            Reportes
          </Link>
          {isAdmin && (
            <Link to="/aerolineas" className={`aasana-nav__link${isActive('/aerolineas') ? ' aasana-nav__link--active' : ''}`}>
              Aerolíneas
            </Link>
          )}
          {isAdmin && (
            <Link to="/aeropuertos" className={`aasana-nav__link${isActive('/aeropuertos') ? ' aasana-nav__link--active' : ''}`}>
              Aeropuertos
            </Link>
          )}
          <Link to="/tablero" target="_blank" rel="noreferrer" className="aasana-nav__link">
            Tablero público
          </Link>
        </nav>

        <div className="aasana-nav__user">
          <span className="aasana-nav__name" title={user.email}>
            {user.name}
          </span>
          <span className={`aasana-nav__badge-role ${roleClass}`}>{role}</span>
          {canRunOps && <span className="aasana-nav__badge-ops">Ops</span>}
          <button
            type="button"
            className="aasana-nav__logout"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
