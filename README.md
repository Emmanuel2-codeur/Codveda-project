# Codveda – Projet Full-Stack (Niveaux 1 & 2)

Stack : Express + Sequelize + PostgreSQL (Supabase) + JWT/bcrypt + Next.js

## 1. Backend

```bash
cd backend
npm install
```

Copie `.env.example` en `.env` et remplis `DATABASE_URL` (mot de passe Supabase) et `JWT_SECRET`.

Avant le premier lancement, dans Supabase > SQL Editor (repart sur des tables propres) :

```sql
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Puis :

```bash
npm run dev
```

Les tables sont créées automatiquement (Sequelize `sync`).

## 2. Frontend (Next.js)

Remplace le contenu de `codveda-frontend/app/page.tsx` par `frontend/app/page.tsx`, puis :

```bash
cd codveda-frontend
npm run dev
```

## 3. Passer un compte en admin (SQL Editor Supabase)

```sql
UPDATE users SET role = 'admin' WHERE email = 'test@test.com';
```
Puis se reconnecter pour obtenir un nouveau token.

## 4. Routes

| Méthode | Route | Accès |
|---|---|---|
| POST | /api/auth/signup | public |
| POST | /api/auth/login | public |
| GET | /api/products (?categoryId=) | public |
| GET | /api/products/:id | public |
| POST / PUT | /api/products | connecté |
| DELETE | /api/products/:id | admin |
| GET | /api/categories | public |
| POST | /api/categories | connecté |
| DELETE | /api/categories/:id | admin |
