import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/axios';
import './Airlines.css';

function getRows(pack) {
  if (!pack) return [];
  if (Array.isArray(pack)) return pack;
  return pack.data || [];
}

function Airlines() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', country: 'Bolivia' });
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const [load, setLoad] = useState(true);

  const fetchList = useCallback(async () => {
    const res = await api.get('/airlines', { params: { per_page: 200 } });
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
        if (a) setErr('No se pudo cargar aerolíneas');
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
      await api.post('/airlines', {
        name: form.name,
        code: form.code,
        country: form.country,
      });
      setForm({ name: '', code: '', country: 'Bolivia' });
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
      await api.put(`/airlines/${editing.id}`, editing);
      setEditing(null);
      await fetchList();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Error al guardar');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta aerolínea?')) return;
    setErr(null);
    try {
      await api.delete(`/airlines/${id}`);
      await fetchList();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'No se pudo eliminar');
    }
  };

  if (load && list.length === 0) {
    return <div className="aasana-loading">Cargando aerolíneas…</div>;
  }

  return (
    <div>
      <h1 className="page-title">Aerolíneas</h1>
      <p className="page-subtitle">Alta, edición y baja de operadores aéreos (solo administrador)</p>
      {err && <p className="aasana-error-text">{err}</p>}

      <form className="crud-form" onSubmit={onCreate}>
        <h2>Nueva aerolínea</h2>
        <div className="crud-form__grid">
          <input
            required
            placeholder="Nombre"
            className="aasana-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            placeholder="Código IATA"
            className="aasana-input"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <input
            required
            placeholder="País"
            className="aasana-input"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          />
        </div>
        <button type="submit" className="crud-btn-primary">
          Añadir aerolínea
        </button>
      </form>

      <div className="crud-table-wrap">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>País</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <strong>{row.name}</strong>
                </td>
                <td>{row.code}</td>
                <td>{row.country}</td>
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
        <div className="crud-modal" role="dialog" aria-modal="true" aria-labelledby="edit-airline-title">
          <form className="crud-modal__card" onSubmit={onUpdate}>
            <h2 id="edit-airline-title">Editar aerolínea</h2>
            <div className="crud-field">
              <label htmlFor="e-an">Nombre</label>
              <input
                id="e-an"
                className="aasana-input"
                value={editing.name}
                onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="crud-field">
              <label htmlFor="e-ac">Código</label>
              <input
                id="e-ac"
                className="aasana-input"
                value={editing.code}
                onChange={(e) => setEditing((s) => ({ ...s, code: e.target.value }))}
              />
            </div>
            <div className="crud-field">
              <label htmlFor="e-ct">País</label>
              <input
                id="e-ct"
                className="aasana-input"
                value={editing.country}
                onChange={(e) => setEditing((s) => ({ ...s, country: e.target.value }))}
              />
            </div>
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

export default Airlines;
