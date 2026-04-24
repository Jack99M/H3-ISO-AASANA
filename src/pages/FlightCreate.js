import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { STATUS_LABELS } from '../utils/flightStatus';
import './FlightCreate.css';

const statusOptions = ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'];

function FlightCreate() {
  const nav = useNavigate();
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState({
    flight_code: '',
    airline_id: '',
    origin_airport_id: '',
    destination_airport_id: '',
    scheduled_departure: '',
    scheduled_arrival: '',
    status: 'programado',
    gate: '',
  });
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const [ar, ap] = await Promise.all([
          api.get('/airlines', { params: { per_page: 100 } }),
          api.get('/airports', { params: { per_page: 200 } }),
        ]);
        if (a) {
          setAirlines(ar.data.data.data || ar.data.data || []);
          setAirports(ap.data.data.data || ap.data.data || []);
        }
      } catch {
        if (a) setErr('No se pudieron cargar listas (aerolíneas / aeropuertos)');
      }
    })();
    return () => {
      a = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (form.origin_airport_id === form.destination_airport_id) {
      setErr('Origen y destino deben ser distintos');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        flight_code: form.flight_code,
        airline_id: Number(form.airline_id),
        origin_airport_id: Number(form.origin_airport_id),
        destination_airport_id: Number(form.destination_airport_id),
        scheduled_departure: toBackendDatetime(form.scheduled_departure),
        scheduled_arrival: toBackendDatetime(form.scheduled_arrival),
        status: form.status,
        gate: form.gate || null,
      };
      const res = await api.post('/flights', payload);
      const newId = res.data.data.id;
      nav(`/vuelos/${newId}`, { replace: true });
    } catch (e2) {
      const d = e2.response?.data;
      setErr(d?.message || (d?.errors && JSON.stringify(d.errors)) || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fc-page">
      <Link to="/vuelos" className="fc-back">
        ← Volver a vuelos
      </Link>
      <div className="fc-card">
        <h1>Nuevo vuelo</h1>
        <p className="page-subtitle">Registro de itinerario (solo administrador)</p>
        {err && <p className="aasana-error-text">{err}</p>}
        <form onSubmit={onSubmit}>
          <div className="fc-field">
            <label htmlFor="fc-code">Código de vuelo</label>
            <input
              id="fc-code"
              required
              className="aasana-input"
              value={form.flight_code}
              onChange={(e) => setForm((f) => ({ ...f, flight_code: e.target.value }))}
              placeholder="Ej. OB701"
            />
          </div>
          <div className="fc-field">
            <label htmlFor="fc-airline">Aerolínea</label>
            <select
              id="fc-airline"
              required
              className="aasana-select"
              value={form.airline_id}
              onChange={(e) => setForm((f) => ({ ...f, airline_id: e.target.value }))}
            >
              <option value="">Seleccione…</option>
              {airlines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
          <div className="fc-field">
            <label htmlFor="fc-orig">Aeropuerto de origen</label>
            <select
              id="fc-orig"
              required
              className="aasana-select"
              value={form.origin_airport_id}
              onChange={(e) => setForm((f) => ({ ...f, origin_airport_id: e.target.value }))}
            >
              <option value="">Seleccione…</option>
              {airports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.code} ({r.city})
                </option>
              ))}
            </select>
          </div>
          <div className="fc-field">
            <label htmlFor="fc-dest">Aeropuerto de destino</label>
            <select
              id="fc-dest"
              required
              className="aasana-select"
              value={form.destination_airport_id}
              onChange={(e) => setForm((f) => ({ ...f, destination_airport_id: e.target.value }))}
            >
              <option value="">Seleccione…</option>
              {airports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.code} ({r.city})
                </option>
              ))}
            </select>
          </div>
          <div className="fc-field">
            <label htmlFor="fc-dep">Salida programada</label>
            <input
              id="fc-dep"
              required
              type="datetime-local"
              className="aasana-input"
              value={form.scheduled_departure}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_departure: e.target.value }))}
            />
          </div>
          <div className="fc-field">
            <label htmlFor="fc-arr">Llegada programada</label>
            <input
              id="fc-arr"
              required
              type="datetime-local"
              className="aasana-input"
              value={form.scheduled_arrival}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_arrival: e.target.value }))}
            />
          </div>
          <div className="fc-field">
            <label htmlFor="fc-st">Estado inicial</label>
            <select
              id="fc-st"
              className="aasana-select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="fc-field">
            <label htmlFor="fc-gate">Puerta (opcional)</label>
            <input
              id="fc-gate"
              className="aasana-input"
              value={form.gate}
              onChange={(e) => setForm((f) => ({ ...f, gate: e.target.value }))}
              placeholder="Ej. A12"
            />
          </div>
          <button type="submit" className="fc-submit" disabled={saving}>
            {saving ? 'Creando vuelo…' : 'Guardar vuelo'}
          </button>
        </form>
      </div>
    </div>
  );
}

function toBackendDatetime(v) {
  if (!v) return null;
  return `${v.replace('T', ' ')}:00`;
}

export default FlightCreate;
