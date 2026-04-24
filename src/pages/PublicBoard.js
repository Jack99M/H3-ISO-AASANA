import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { STATUS_LABELS } from '../utils/flightStatus';
import './PublicBoard.css';

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function getRows(pack) {
  if (!pack) return [];
  if (Array.isArray(pack)) return pack;
  return pack.data || [];
}

function splitSchedule(iso) {
  if (!iso) return { clock: '—', date: '' };
  try {
    const d = new Date(iso);
    return {
      clock: d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  } catch {
    return { clock: '—', date: '' };
  }
}

function pbBadgeClass(status) {
  const ok = ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'].includes(status);
  return `pb-badge${ok ? ` pb-badge--${status}` : ''}`;
}

/**
 * No requiere login: rutas /api/public/*
 */
function PublicBoard() {
  const [airports, setAirports] = useState([]);
  const [airportId, setAirportId] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [arrivals, setArrivals] = useState(null);
  const [departures, setDepartures] = useState(null);
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let a = true;
    (async () => {
      setErr(null);
      try {
        const res = await api.get('/public/airports', { params: { per_page: 200 } });
        const list = res.data.data?.data || res.data.data || [];
        if (a) {
          const ap = Array.isArray(list) ? list : [];
          setAirports(ap);
          if (ap.length > 0) {
            setAirportId((id) => id || String(ap[0].id));
          }
        }
      } catch {
        if (a) setErr('No se pudo cargar aeropuertos');
      }
    })();
    return () => {
      a = false;
    };
  }, []);

  useEffect(() => {
    if (!airportId) {
      return;
    }
    let a = true;
    (async () => {
      setLoad(true);
      setErr(null);
      try {
        const params = { airport_id: airportId, per_page: 30 };
        if (date) params.date = date;
        const [ar, de] = await Promise.all([
          api.get('/public/flights/arrivals', { params }),
          api.get('/public/flights/departures', { params }),
        ]);
        if (a) {
          setArrivals(ar.data.data);
          setDepartures(de.data.data);
        }
      } catch (e) {
        if (a) setErr(e.response?.data?.message || 'Error al cargar tablero');
      } finally {
        if (a) setLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [airportId, date]);

  const arr = getRows(arrivals);
  const dep = getRows(departures);

  return (
    <div className="pb-root">
      <div className="pb-inner">
        <header className="pb-header">
          <div className="pb-brand">
            <div className="pb-logo-row">
              <span className="pb-plane" aria-hidden>
                ✈️
              </span>
              <span className="pb-logo-text">AASANA</span>
            </div>
            <p className="pb-tagline">Tablero público de movimientos · Bolivia</p>
          </div>
          <Link to="/login" className="pb-login">
            Acceso operadores
          </Link>
        </header>

        <div className="pb-toolbar">
          <div>
            <label className="aasana-label" htmlFor="pb-ap">
              Aeropuerto
            </label>
            <select id="pb-ap" className="aasana-select" style={{ minWidth: 240 }} value={airportId} onChange={(e) => setAirportId(e.target.value)}>
              <option value="">— Seleccione —</option>
              {airports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="aasana-label" htmlFor="pb-dt">
              Día operativo
            </label>
            <input id="pb-dt" type="date" className="aasana-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {err && <p style={{ color: '#ffab91', marginBottom: '1rem' }}>{err}</p>}
        {!airportId && <p style={{ color: 'rgba(200,212,255,0.65)' }}>Seleccione un aeropuerto.</p>}
        {airportId && load && <p style={{ color: 'rgba(200,212,255,0.65)' }}>Cargando movimientos…</p>}

        {airportId && !load && !err && (
          <div className="pb-columns">
            <section className="pb-panel pb-panel--arr" aria-labelledby="pb-arr">
              <h2 id="pb-arr">Llegadas</h2>
              <table className="pb-table">
                <thead>
                  <tr>
                    <th>Vuelo</th>
                    <th>Desde</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {arr.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.25rem', color: 'rgba(200,212,255,0.5)' }}>
                        Sin arribos programados
                      </td>
                    </tr>
                  )}
                  {arr.map((f) => {
                    const t = splitSchedule(f.scheduled_arrival);
                    return (
                      <tr key={f.id}>
                        <td className="pb-flight">{f.flight_code}</td>
                        <td className="pb-route">{f.origin_airport?.code || '—'}</td>
                        <td>
                          <div className="pb-time-big">
                            <span className="pb-time-big__clock">{t.clock}</span>
                            <span className="pb-time-big__date">{t.date}</span>
                          </div>
                        </td>
                        <td>
                          <span className={pbBadgeClass(f.status)}>{STATUS_LABELS[f.status] || f.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="pb-panel pb-panel--dep" aria-labelledby="pb-dep">
              <h2 id="pb-dep">Salidas</h2>
              <table className="pb-table">
                <thead>
                  <tr>
                    <th>Vuelo</th>
                    <th>Hacia</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dep.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.25rem', color: 'rgba(200,212,255,0.5)' }}>
                        Sin salidas programadas
                      </td>
                    </tr>
                  )}
                  {dep.map((f) => {
                    const t = splitSchedule(f.scheduled_departure);
                    return (
                      <tr key={f.id}>
                        <td className="pb-flight">{f.flight_code}</td>
                        <td className="pb-route">{f.destination_airport?.code || '—'}</td>
                        <td>
                          <div className="pb-time-big">
                            <span className="pb-time-big__clock">{t.clock}</span>
                            <span className="pb-time-big__date">{t.date}</span>
                          </div>
                        </td>
                        <td>
                          <span className={pbBadgeClass(f.status)}>{STATUS_LABELS[f.status] || f.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicBoard;
