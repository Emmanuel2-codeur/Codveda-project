'use client';

import { useState, useEffect, FormEvent } from 'react';
import LivePanel from './LivePanel';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API = `${BASE}/api`;

type Category = { id: number; name: string };
type Product = {
  id: number;
  name: string;
  price: string | number;
  quantity: number;
  categoryId: number | null;
  Category?: Category | null;
};
type User = { id: number; email: string; role: string };

export default function Home() {
  // ---------- état ----------
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });

  const emptyForm = { id: null as number | null, name: '', price: '', quantity: '', categoryId: '' };
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState('');

  // ---------- chargement initial ----------
  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        fetch(`${API}/products`).then((r) => r.json()),
        fetch(`${API}/categories`).then((r) => r.json()),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
    } catch {
      setMessage('Impossible de joindre le serveur API (il est peut-être en veille, réessaie dans une minute).');
    } finally {
      setLoading(false);
    }
  }

  // ---------- helper fetch avec token ----------
  async function api(path: string, method: string, body?: unknown) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur');
    return data;
  }

  // ---------- authentification ----------
  async function handleSignup() {
    try {
      await api('/auth/signup', 'POST', authForm);
      setMessage('Compte créé ! Tu peux maintenant te connecter.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await api('/auth/login', 'POST', authForm);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthForm({ email: '', password: '' });
      setMessage('');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ---------- produits ----------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
    };
    try {
      if (form.id) await api(`/products/${form.id}`, 'PUT', payload);
      else await api('/products', 'POST', payload);
      setForm(emptyForm);
      setMessage('');
      loadAll();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await api(`/products/${id}`, 'DELETE');
      loadAll();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/categories', 'POST', { name: newCategory });
      setNewCategory('');
      setMessage('');
      loadAll();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  const input = 'border rounded px-3 py-2 flex-1 min-w-[120px]';

  // ---------- rendu ----------
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Gestion de Produits</h1>

      <LivePanel token={token} user={user} setProducts={setProducts} />

      {message && (
        <p className="mb-4 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{message}</p>
      )}

      {/* ----- Connexion ----- */}
      {!user ? (
        <form onSubmit={handleLogin} className="flex flex-wrap gap-2 mb-8">
          <input
            className={input}
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            required
          />
          <input
            className={input}
            type="password"
            placeholder="Mot de passe"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">
            Connexion
          </button>
          <button
            type="button"
            onClick={handleSignup}
            className="black px-4 py-2 rounded font-semibold"
          >
            Inscription
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center mb-8 text-sm">
          <span>
            Connecté : <strong>{user.email}</strong> ({user.role})
          </span>
          <button onClick={handleLogout} className="black px-3 py-1 rounded">
            Déconnexion
          </button>
        </div>
      )}

      {/* ----- Formulaires (connecté uniquement) ----- */}
      {user && (
        <>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              className={input}
              placeholder="Nouvelle catégorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
            />
            <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold">
              + Catégorie
            </button>
          </form>

          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-8">
            <input
              className={input}
              placeholder="Nom du produit"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className={input}
              type="number"
              step="0.01"
              placeholder="Prix"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              className={input}
              type="number"
              placeholder="Quantité"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
            <select
              className={input}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">
              {form.id ? 'Modifier' : 'Ajouter'}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="bg-gray-200 px-4 py-2 rounded font-semibold"
              >
                Annuler
              </button>
            )}
          </form>
        </>
      )}

      {/* ----- Liste ----- */}
      {loading ? (
        <p>Chargement...</p>
      ) : products.length === 0 ? (
        <p>Aucun produit pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex justify-between items-center border rounded-lg p-4">
              <div>
                <strong className="block">{p.name}</strong>
                <span className="text-gray-600 text-sm">
                  {p.price} € — Qté : {p.quantity}
                  {p.Category ? ` — ${p.Category.name}` : ''}
                </span>
              </div>
              {user && (
                <div className="space-x-2">
                  <button
                    onClick={() =>
                      setForm({
                        id: p.id,
                        name: p.name,
                        price: String(p.price),
                        quantity: String(p.quantity),
                        categoryId: p.categoryId ? String(p.categoryId) : '',
                      })
                    }
                    className="bg-yellow-400 px-3 py-1 rounded text-sm"
                  >
                    Modifier
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}