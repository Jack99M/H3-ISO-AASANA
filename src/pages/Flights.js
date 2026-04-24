import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { statusBadgeClass, STATUS_LABELS } from '../utils/flightStatus';
import './Flights.css';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'programado', label: 'Programado' },
  { value: 'abordando', label: 'Abordando' },
  { value: 'despego', label: 'Despegó' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'retrasado', label: 'Retrasado' },
];

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function formatDt(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('es-BO');
  } catch {
    return s;
  }
}

function Flights() {
  const [date, setDate] = useState(todayYMD);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [load, setLoad] = useState(true);
  const [err, setErr] = useState(null);
  const [pack, setPack] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [date, status]);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoad(true);
      setErr(null);
      try {
        const params = { page, per_page: 12 };
        if (date) params.date = date;
        if (status) params.status = status;
        const res = await api.get('/flights', { params });
        if (a) setPack(res.data.data);
      } catch (e) {
        if (a) setErr(e.response?.data?.message || 'Error al listar vuelos');
      } finally {
        if (a) setLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [date, status, page]);

  const rows = pack?.data || [];
  const last = pack?.last_page || 1;

  return (
    <div className="flights-page">
      <h1 className="page-title">Vuelos</h1>
      <p className="page-subtitle">Filtra por fecha de salida programada y estado operativo</p>

      <div className="flights-toolbar">
        <div className="flights-toolbar__group">
          <label className="aasana-label" htmlFor="flt-date">
            Fecha
          </label>
          <input id="flt-date" type="date" className="aasana-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flights-toolbar__group">
          <label className="aasana-label" htmlFor="flt-status">
            Estado
          </label>
          <select id="flt-status" className="aasana-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="aasana-error-text">{err}</p>}
      {load && <div className="aasana-loading">Cargando vuelos…</div>}

      {!load && !err && (
        <>
          <div className="flights-table-wrap">
            <table className="flights-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Aerolínea</th>
                  <th>Origen → Destino</th>
                  <th>Salida programada</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--aasana-text-muted)' }}>
                      No hay vuelos con esos criterios
                    </td>
                  </tr>
                )}
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.flight_code}</strong>
                    </td>
                    <td>{f.airline?.code}</td>
                    <td>
                      {f.origin_airport?.code} → {f.destination_airport?.code}
                    </td>
                    <td>{formatDt(f.scheduled_departure)}</td>
                    <td>
                      <span className={statusBadgeClass(f.status)}>{STATUS_LABELS[f.status] || f.status}</span>
                    </td>
                    <td>
                      <Link to={`/vuelos/${f.id}`} className="flights-table__link">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pack && last > 1 && (
            <div className="flights-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </button>
              <span>
                Página {page} de {last}
              </span>
              <button type="button" disabled={page >= last} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Flights;
