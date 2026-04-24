import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/axios';
import './Airlines.css';
import './Airports.css';

function getRows(pack) {
  if (!pack) return [];
  if (Array.isArray(pack)) return pack;
  return pack.data || [];
}

function Airports() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', city: '', department: '' });
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const [load, setLoad] = useState(true);

  const fetchList = useCallback(async () => {
    const res = await api.get('/airports', { params: { per_page: 200 } });
    setList(getRows(res.data.data));
  }, []);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoad(true);
      setErr(null);
      try {
        await fetchList();
      } catch {
        if (a) setErr('No se pudo cargar aeropuertos');
      } finally {
        if (a) setLoad(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [fetchList]);

  const onCreate = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post('/airports', {
        code: form.code,
        name: form.name,
        city: form.city,
        department: form.department,
      });
      setForm({ code: '', name: '', city: '', department: '' });
      await fetchList();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Error al crear');
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setErr(null);
    try {
      await api.put(`/airports/${editing.id}`, {
        name: editing.name,
        code: editing.code,
        city: editing.city,
        department: editing.department,
      });
      setEditing(null);
      await fetchList();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Error al guardar');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar este aeropuerto?')) return;
    setErr(null);
    try {
      await api.delete(`/airports/${id}`);
      await fetchList();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'No se pudo eliminar (¿hay vuelos asociados?)');
    }
  };

  if (load && list.length === 0) {
    return <div className="aasana-loading">Cargando aeropuertos…</div>;
  }

  return (
    <div>
      <h1 className="page-title">Aeropuertos</h1>
      <p className="page-subtitle">Catálogo nacional de terminales (solo administrador)</p>
      {err && <p className="aasana-error-text">{err}</p>}

      <form className="crud-form" onSubmit={onCreate} style={{ maxWidth: 680 }}>
        <h2>Nuevo aeropuerto</h2>
        <div className="crud-form__grid--2">
          <input
            required
            placeholder="Código (ej. VVI)"
            className="aasana-input"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <input
            required
            placeholder="Nombre"
            className="aasana-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            placeholder="Ciudad"
            className="aasana-input"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            required
            placeholder="Departamento"
            className="aasana-input"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          />
        </div>
        <button type="submit" className="crud-btn-primary">
          Añadir aeropuerto
        </button>
      </form>

      <div className="crud-table-wrap">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Depto.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <strong>{row.code}</strong>
                </td>
                <td>{row.name}</td>
                <td>{row.city}</td>
                <td>{row.department}</td>
                <td>
                  <div className="crud-actions">
                    <button type="button" className="crud-btn-edit" onClick={() => setEditing({ ...row })}>
                      Editar
                    </button>
                    <button type="button" className="crud-btn-del" onClick={() => onDelete(row.id)}>
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="crud-modal" role="dialog" aria-modal="true">
          <form className="crud-modal__card" onSubmit={onUpdate}>
            <h2>Editar aeropuerto</h2>
            {[
              { key: 'name', label: 'Nombre' },
              { key: 'code', label: 'Código' },
              { key: 'city', label: 'Ciudad' },
              { key: 'department', label: 'Departamento' },
            ].map(({ key, label }) => (
              <div key={key} className="crud-field">
                <label htmlFor={`ap-${key}`}>{label}</label>
                <input
                  id={`ap-${key}`}
                  className="aasana-input"
                  value={editing[key]}
                  onChange={(e) => setEditing((s) => ({ ...s, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="crud-modal__actions">
              <button type="button" className="crud-btn-ghost" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit" className="crud-btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Airports;
