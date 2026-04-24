import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { STATUS_ICONS, STATUS_LABELS } from '../utils/flightStatus';
import './Dashboard.css';

const STATUS_ORDER = ['programado', 'abordando', 'despego', 'retrasado', 'cancelado'];

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const [date, setDate] = useState(todayYMD);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoad(true);
      setErr(null);
      try {
        const res = await api.get('/reports/daily-summary', { params: { date } });
        if (a) setData(res.data.data);
      } catch (e) {
        if (a) setErr(e.response?.data?.message || 'No se pudo cargar el resumen');
      } finally {
        if (a) setLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [date]);

  if (load && !data) {
    return <div className="aasana-loading">Cargando resumen diario…</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Panel operativo</h1>
      <p className="page-subtitle">Vuelos con salida programada en la fecha seleccionada, agrupados por estado</p>

      <div className="dashboard__toolbar">
        <div>
          <label className="aasana-label" htmlFor="dash-date">
            Fecha (salida programada)
          </label>
          <input
            id="dash-date"
            type="date"
            className="aasana-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {err && <p className="aasana-error-text">{err}</p>}

      {data && (
        <>
          <div className="dashboard-summary">
            <div>
              <div className="dashboard-summary__label">Día operativo</div>
              <div className="dashboard-summary__date">{data.date}</div>
              <p className="dashboard-summary__hint">Total de movimientos programados</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="dashboard-summary__label">Total vuelos</div>
              <div className="dashboard-summary__total">{data.total_flights}</div>
            </div>
          </div>

          <div className="dashboard-grid">
            {STATUS_ORDER.map((k) => (
              <div key={k} className={`dashboard-card dashboard-card--${k}`}>
                <div className="dashboard-card__icon" aria-hidden>
                  {STATUS_ICONS[k]}
                </div>
                <div className="dashboard-card__label">{STATUS_LABELS[k]}</div>
                <div className="dashboard-card__count">{data.by_status[k] ?? 0}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
