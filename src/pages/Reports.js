import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { statusBadgeClass, STATUS_LABELS } from '../utils/flightStatus';
import './Reports.css';

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function getDelayRows(pack) {
  if (!pack) return [];
  if (Array.isArray(pack)) return pack;
  return pack.data || [];
}

function formatDt(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('es-BO');
  } catch {
    return s;
  }
}

function Reports() {
  const [tab, setTab] = useState('punctuality');
  const [airlines, setAirlines] = useState([]);

  const [pAirline, setPAirline] = useState('');
  const [pDate, setPDate] = useState('');
  const [punct, setPunct] = useState(null);
  const [pLoad, setPLoad] = useState(false);
  const [pErr, setPErr] = useState(null);

  const [dDate, setDDate] = useState(todayYMD());
  const [daily, setDaily] = useState(null);
  const [dLoad, setDLoad] = useState(false);
  const [dErr, setDErr] = useState(null);

  const [delAir, setDelAir] = useState('');
  const [delDate, setDelDate] = useState('');
  const [delays, setDelays] = useState(null);
  const [delPage, setDelPage] = useState(1);
  const [deLoad, setDeLoad] = useState(false);
  const [deErr, setDeErr] = useState(null);
  const [delPack, setDelPack] = useState(null);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const res = await api.get('/airlines', { params: { per_page: 200 } });
        const rows = res.data.data?.data || res.data.data || [];
        if (a) setAirlines(Array.isArray(rows) ? rows : []);
      } catch {
        if (a) setAirlines([]);
      }
    })();
    return () => {
      a = false;
    };
  }, []);

  const runPunctuality = async (e) => {
    e.preventDefault();
    if (!pAirline) {
      setPErr('Elige una aerolínea');
      return;
    }
    setPLoad(true);
    setPErr(null);
    try {
      const params = { airline_id: pAirline };
      if (pDate) params.date = pDate;
      const res = await api.get('/reports/punctuality', { params });
      setPunct(res.data.data);
    } catch (e2) {
      setPErr(e2.response?.data?.message || 'Error');
      setPunct(null);
    } finally {
      setPLoad(false);
    }
  };

  const runDaily = async (e) => {
    e.preventDefault();
    setDLoad(true);
    setDErr(null);
    try {
      const res = await api.get('/reports/daily-summary', { params: { date: dDate } });
      setDaily(res.data.data);
    } catch (e2) {
      setDErr(e2.response?.data?.message || 'Error');
      setDaily(null);
    } finally {
      setDLoad(false);
    }
  };

  useEffect(() => {
    let a = true;
    (async () => {
      setDeLoad(true);
      setDeErr(null);
      try {
        const params = { page: delPage, per_page: 15 };
        if (delAir) params.airline_id = delAir;
        if (delDate) params.date = delDate;
        const res = await api.get('/reports/delays', { params });
        if (a) {
          setDelPack(res.data.data);
          setDelays(res.data.data);
        }
      } catch (e2) {
        if (a) {
          setDeErr(e2.response?.data?.message || 'Error');
          setDelays(null);
        }
      } finally {
        if (a) setDeLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [delAir, delDate, delPage]);

  const delayRows = getDelayRows(delays);
  const pct = punct?.punctuality_percent != null ? Math.min(100, Math.max(0, punct.punctuality_percent)) : 0;

  return (
    <div className="reports-page">
      <h1 className="page-title">Reportes operativos</h1>
      <p className="page-subtitle">Indicadores de puntualidad, resumen diario y vuelos con retraso</p>

      <div className="reports-tabs" role="tablist" aria-label="Tipo de reporte">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'punctuality'}
          className={`reports-tab${tab === 'punctuality' ? ' reports-tab--active' : ''}`}
          onClick={() => setTab('punctuality')}
        >
          Puntualidad
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'daily'}
          className={`reports-tab${tab === 'daily' ? ' reports-tab--active' : ''}`}
          onClick={() => setTab('daily')}
        >
          Resumen diario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'delays'}
          className={`reports-tab${tab === 'delays' ? ' reports-tab--active' : ''}`}
          onClick={() => setTab('delays')}
        >
          Retrasos
        </button>
      </div>

      {tab === 'punctuality' && (
        <section className="reports-panel" aria-labelledby="rep-p-title">
          <h2 id="rep-p-title">Puntualidad por aerolínea</h2>
          <form onSubmit={runPunctuality} className="reports-toolbar">
            <div>
              <label className="aasana-label" htmlFor="rp-air">
                Aerolínea
              </label>
              <select id="rp-air" className="aasana-select" style={{ minWidth: 220 }} value={pAirline} onChange={(e) => setPAirline(e.target.value)}>
                <option value="">— Seleccione —</option>
                {airlines.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.name} ({al.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="aasana-label" htmlFor="rp-date">
                Fecha (opcional)
              </label>
              <input id="rp-date" type="date" className="aasana-input" value={pDate} onChange={(e) => setPDate(e.target.value)} />
            </div>
            <button type="submit" className="reports-btn-primary" disabled={pLoad}>
              {pLoad ? '…' : 'Generar'}
            </button>
          </form>
          {pErr && <p className="aasana-error-text">{pErr}</p>}
          {punct && (
            <>
              <div className="reports-stats">
                <div className="reports-stat">
                  Total vuelos
                  <strong>{punct.total_flights}</strong>
                </div>
                <div className="reports-stat">
                  A tiempo
                  <strong>{punct.a_tiempo}</strong>
                </div>
                <div className="reports-stat">
                  Retrasados
                  <strong>{punct.retrasados}</strong>
                </div>
                <div className="reports-stat">
                  Cancelados
                  <strong>{punct.cancelados}</strong>
                </div>
              </div>
              {punct.punctuality_percent != null && (
                <div className="reports-progress">
                  <div className="reports-progress__label">
                    <span>Puntualidad</span>
                    <span className="reports-progress__value">{punct.punctuality_percent}%</span>
                  </div>
                  <div className="reports-progress__track">
                    <div className="reports-progress__fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'daily' && (
        <section className="reports-panel" aria-labelledby="rep-d-title">
          <h2 id="rep-d-title">Resumen diario (salida programada)</h2>
          <form onSubmit={runDaily} className="reports-toolbar">
            <div>
              <label className="aasana-label" htmlFor="rd-date">
                Fecha
              </label>
              <input id="rd-date" type="date" className="aasana-input" value={dDate} onChange={(e) => setDDate(e.target.value)} required />
            </div>
            <button type="submit" className="reports-btn-primary" disabled={dLoad}>
              {dLoad ? '…' : 'Cargar'}
            </button>
          </form>
          {dErr && <p className="aasana-error-text">{dErr}</p>}
          {daily && (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Vuelos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{daily.total_flights}</strong>
                    </td>
                  </tr>
                  {Object.keys(daily.by_status || {}).map((k) => (
                    <tr key={k}>
                      <td>
                        <span className={statusBadgeClass(k)}>{STATUS_LABELS[k] || k}</span>
                      </td>
                      <td>{daily.by_status[k]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'delays' && (
        <section className="reports-panel" aria-labelledby="rep-del-title">
          <h2 id="rep-del-title">Vuelos con retraso</h2>
          <div className="reports-toolbar">
            <div>
              <label className="aasana-label" htmlFor="del-air">
                Aerolínea
              </label>
              <select
                id="del-air"
                className="aasana-select"
                style={{ minWidth: 180 }}
                value={delAir}
                onChange={(e) => {
                  setDelAir(e.target.value);
                  setDelPage(1);
                }}
              >
                <option value="">Todas</option>
                {airlines.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="aasana-label" htmlFor="del-dt">
                Fecha
              </label>
              <input
                id="del-dt"
                type="date"
                className="aasana-input"
                value={delDate}
                onChange={(e) => {
                  setDelDate(e.target.value);
                  setDelPage(1);
                }}
              />
            </div>
          </div>
          {deLoad && <div className="reports-inline-loading">Cargando…</div>}
          {deErr && <p className="aasana-error-text">{deErr}</p>}
          {!deLoad && !deErr && (
            <>
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Aerolínea</th>
                      <th>Ruta</th>
                      <th>Salida prog.</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayRows.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--aasana-text-muted)' }}>
                          Sin registros con estos filtros
                        </td>
                      </tr>
                    )}
                    {delayRows.map((f) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {delPack && delPack.last_page > 1 && (
                <div className="reports-pagination">
                  <button type="button" disabled={delPage <= 1} onClick={() => setDelPage((p) => p - 1)}>
                    Anterior
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--aasana-text-muted)' }}>
                    Pág. {delPage} / {delPack.last_page}
                  </span>
                  <button type="button" disabled={delPage >= (delPack.last_page || 1)} onClick={() => setDelPage((p) => p + 1)}>
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default Reports;
