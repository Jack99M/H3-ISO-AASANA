import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { STATUS_LABELS, statusBadgeClass } from '../utils/flightStatus';
import './FlightDetail.css';

const statusOptions = ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'];

function formatDt(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('es-BO');
  } catch {
    return s;
  }
}

function FlightDetail() {
  const { id } = useParams();
  const { canRunOps } = useAuth();
  const [flight, setFlight] = useState(null);
  const [err, setErr] = useState(null);
  const [load, setLoad] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: 'programado', reason: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoad(true);
      setErr(null);
      try {
        const res = await api.get(`/flights/${id}`);
        if (a) {
          setFlight(res.data.data);
          setForm((f) => ({ ...f, status: res.data.data.status || 'programado' }));
        }
      } catch (e) {
        if (a) setErr(e.response?.status === 404 ? 'Vuelo no encontrado' : 'Error al cargar');
      } finally {
        if (a) setLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [id]);

  const refresh = async () => {
    const res = await api.get(`/flights/${id}`);
    setFlight(res.data.data);
  };

  const onSubmitStatus = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await api.patch(`/flights/${id}/status`, {
        status: form.status,
        reason: form.reason || null,
      });
      setMsg('Estado actualizado.');
      await refresh();
    } catch (e2) {
      setMsg(e2.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (load) return <div className="aasana-loading">Cargando vuelo…</div>;
  if (err) {
    return (
      <p className="aasana-error-text">
        {err} ·{' '}
        <Link to="/vuelos" className="fd-back">
          Volver a vuelos
        </Link>
      </p>
    );
  }
  if (!flight) return null;

  const o = flight.origin_airport || flight.originAirport;
  const d = flight.destination_airport || flight.destinationAirport;
  const al = flight.airline;
  const logs = flight.status_logs || flight.statusLogs || [];

  return (
    <div className="fd-page">
      <Link to="/vuelos" className="fd-back">
        ← Vuelos
      </Link>

      <header className="fd-header">
        <h1 className="fd-title">{flight.flight_code}</h1>
        <p className="fd-sub">
          {al?.name} ({al?.code})
        </p>
        <p style={{ margin: '0.5rem 0 0' }}>
          <span className={statusBadgeClass(flight.status)}>{STATUS_LABELS[flight.status] || flight.status}</span>
        </p>
      </header>

      <section className="fd-main-card">
        <h2>Itinerario y operación</h2>
        <dl className="fd-grid">
          <div className="fd-item">
            <dt>Origen</dt>
            <dd>
              {o?.name} ({o?.code})
            </dd>
          </div>
          <div className="fd-item">
            <dt>Destino</dt>
            <dd>
              {d?.name} ({d?.code})
            </dd>
          </div>
          <div className="fd-item">
            <dt>Salida programada</dt>
            <dd>{formatDt(flight.scheduled_departure)}</dd>
          </div>
          <div className="fd-item">
            <dt>Llegada programada</dt>
            <dd>{formatDt(flight.scheduled_arrival)}</dd>
          </div>
          {flight.gate && (
            <div className="fd-item">
              <dt>Puerta</dt>
              <dd>{flight.gate}</dd>
            </div>
          )}
          <div className="fd-item">
            <dt>Salida real</dt>
            <dd>{formatDt(flight.actual_departure)}</dd>
          </div>
          <div className="fd-item">
            <dt>Llegada real</dt>
            <dd>{formatDt(flight.actual_arrival)}</dd>
          </div>
        </dl>
      </section>

      {canRunOps && (
        <form className="fd-actions" onSubmit={onSubmitStatus}>
          <h3>Cambiar estado (operador / admin)</h3>
          <p className="page-subtitle" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
            Seleccione un estado o use los accesos rápidos
          </p>
          <div className="fd-quick">
            {statusOptions.map((s) => (
              <button
                key={s}
                type="button"
                className={`fd-quick-btn fd-quick-btn--${s}${form.status === s ? ' fd-quick-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, status: s }))}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <label className="aasana-label" htmlFor="fd-status">
            Estado confirmado
          </label>
          <select
            id="fd-status"
            className="aasana-select"
            style={{ width: '100%', maxWidth: 320 }}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <label className="aasana-label" htmlFor="fd-reason" style={{ marginTop: '0.85rem' }}>
            Motivo (opcional)
          </label>
          <input
            id="fd-reason"
            className="aasana-input"
            style={{ width: '100%', maxWidth: 480 }}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Ej. meteorología, mantenimiento…"
          />
          <button type="submit" className="fd-submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar cambio de estado'}
          </button>
          {msg && (
            <p className={`fd-msg ${msg.startsWith('Estado') ? 'fd-msg--ok' : 'fd-msg--err'}`}>{msg}</p>
          )}
        </form>
      )}

      {logs.length > 0 && (
        <section className="fd-timeline">
          <h3>Historial de estados</h3>
          <ul className="fd-timeline-list">
            {logs.map((log) => (
              <li key={log.id} className="fd-timeline-item">
                <div className="fd-timeline-time">{formatDt(log.created_at)}</div>
                <div className="fd-timeline-body">
                  {log.previous_status ? (
                    <span className={statusBadgeClass(log.previous_status)}>
                      {STATUS_LABELS[log.previous_status] || log.previous_status}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--aasana-text-muted)', fontWeight: 600 }}>Inicio</span>
                  )}
                  {' → '}
                  <span className={statusBadgeClass(log.new_status)}>{STATUS_LABELS[log.new_status] || log.new_status}</span>
                </div>
                {log.reason && <div className="fd-timeline-reason">{log.reason}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default FlightDetail;
