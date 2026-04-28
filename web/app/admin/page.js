'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'tsovic_admin_secret';

function useAdminSecret() {
  const [secret, setSecret] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem(STORAGE_KEY);
    if (s) setSecret(s);
    setHydrated(true);
  }, []);

  const saveSecret = useCallback((value) => {
    const v = value.trim();
    if (v) sessionStorage.setItem(STORAGE_KEY, v);
    else sessionStorage.removeItem(STORAGE_KEY);
    setSecret(v);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret('');
  }, []);

  return { secret, saveSecret, logout, hydrated };
}

export default function AdminPage() {
  const { secret, saveSecret, logout, hydrated } = useAdminSecret();
  const [loginInput, setLoginInput] = useState('');
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const clearEditTarget = useCallback(() => setEditTarget(null), []);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    }),
    [secret]
  );

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/figures', { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setFigures([]);
        return;
      }
      setFigures(data.figures || []);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [secret, authHeaders]);

  useEffect(() => {
    if (hydrated && secret) load();
  }, [hydrated, secret, load]);

  const handleLogin = (e) => {
    e.preventDefault();
    saveSecret(loginInput);
    setLoginInput('');
  };

  const downloadQr = async (id) => {
    setMessage('');
    try {
      const res = await fetch(`/api/admin/qr/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'QR download failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`Downloaded QR for “${id}” (payload is exactly this id for the app scanner).`);
    } catch {
      setError('QR download failed');
    }
  };

  const deleteFigure = async (id) => {
    if (!confirm(`Delete figure “${id}”?`)) return;
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/figures/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Delete failed');
      return;
    }
    setMessage(`Deleted “${id}”.`);
    load();
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading…</div>
    );
  }

  if (!secret) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Tsovic-Tsov admin</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the same value as <code className="rounded bg-slate-100 px-1">ADMIN_SECRET</code> in{' '}
            <code className="rounded bg-slate-100 px-1">web/.env.local</code>.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Admin secret</label>
            <input
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Paste ADMIN_SECRET"
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700"
            >
              Sign in
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link href="/" className="text-indigo-600 hover:underline">
              ← Back to site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Figures & QR</h1>
            <p className="text-sm text-slate-500">
              Data is stored in <code className="text-slate-700">web/data/figures.json</code>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign out
            </button>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:underline"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        ) : null}

        <FigureEditor
          authHeaders={authHeaders}
          onSaved={load}
          editTarget={editTarget}
          onEditConsumed={clearEditTarget}
        />

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">ID (QR payload)</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Image URL</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {figures.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700">{f.id}</td>
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
                    {f.image || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditTarget(f)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadQr(f.id)}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        QR PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFigure(f.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && figures.length === 0 ? (
            <p className="p-6 text-center text-slate-500">No figures yet.</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function FigureEditor({ authHeaders, onSaved, editTarget, onEditConsumed }) {
  const [mode, setMode] = useState('create');
  const [editId, setEditId] = useState('');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!editTarget) return;
    setMode('edit');
    setEditId(editTarget.id);
    setId(editTarget.id);
    setName(editTarget.name);
    setDescription(editTarget.description);
    setImage(editTarget.image || '');
    setSortOrder(
      editTarget.sortOrder !== undefined && editTarget.sortOrder !== null
        ? String(editTarget.sortOrder)
        : ''
    );
    setLocalError('');
    onEditConsumed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [editTarget, onEditConsumed]);

  const reset = () => {
    setMode('create');
    setEditId('');
    setId('');
    setName('');
    setDescription('');
    setImage('');
    setSortOrder('');
    setLocalError('');
  };

  const startEdit = (f) => {
    setMode('edit');
    setEditId(f.id);
    setId(f.id);
    setName(f.name);
    setDescription(f.description);
    setImage(f.image || '');
    setSortOrder(String(f.sortOrder ?? ''));
    setLocalError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || null,
      };
      if (sortOrder.trim() !== '' && Number.isFinite(Number(sortOrder))) {
        payload.sortOrder = Number(sortOrder);
      }
      let res;
      if (mode === 'create') {
        res = await fetch('/api/admin/figures', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            ...payload,
            id: id.trim(),
          }),
        });
      } else {
        res = await fetch(`/api/admin/figures/${encodeURIComponent(editId)}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            ...payload,
            id: id.trim(),
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLocalError(data.error || 'Save failed');
        return;
      }
      reset();
      onSaved();
    } catch {
      setLocalError('Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Add figure' : `Edit figure: ${editId}`}
        </h2>
        {mode === 'edit' ? (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel edit
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        The mobile app unlocks when the QR raw text equals the figure <strong>id</strong>.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Id</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. martiros-saryan"
            required
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Sort order</label>
          <input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            type="number"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="optional"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Image URL</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="https://…"
          />
        </div>
        {localError ? (
          <div className="sm:col-span-2 text-sm text-red-600">{localError}</div>
        ) : null}
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
          </button>
        </div>
      </form>
      <p className="mt-4 text-xs text-slate-400">
        Tip: pick a row to edit from the table — use the same id in QR. Row actions: QR PNG, Delete.
      </p>
    </section>
  );
}
