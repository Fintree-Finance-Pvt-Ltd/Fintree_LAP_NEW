# LAP LOS

Production-oriented modular monolith scaffold for a LAP-LIP loan origination, loan management, payments and collections platform.

## Stack

- Frontend: React, Vite, JavaScript, Material UI, Tailwind CSS, Redux Toolkit, TanStack React Query, Axios, Recharts, React Router
- Backend: NestJS, TypeScript, TypeORM, MySQL, JWT, Passport, class-validator, Swagger
- Database: MySQL 8+

## Setup

```bash
npm install
```

Create the database and user:

```sql
CREATE DATABASE fintree_lap_lip CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lap_app'@'%' IDENTIFIED BY 'replace_with_secure_password';
GRANT ALL PRIVILEGES ON fintree_lap_lip.* TO 'lap_app'@'%';
FLUSH PRIVILEGES;
```

Copy and edit environment files:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Run migrations and seeds:

```bash
npm run migration:run
npm run seed
```

Start both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/docs

## Development Users

All seed users use `Password@123` in development. Password hashes are stored with bcrypt.

- admin@fintree.in
- rm@fintree.in
- bm@fintree.in
- cm@fintree.in
- credit.maker@fintree.in
- credit.checker@fintree.in
- legal@fintree.in
- valuation@fintree.in
- sanction@fintree.in
- ops.maker@fintree.in
- ops.checker@fintree.in
- lms@fintree.in
- collection@fintree.in

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run migration:run
npm run seed
```

## First Vertical Flow

Implemented skeleton:

1. Login with JWT access token and HttpOnly refresh cookie.
2. Load role and permission claims.
3. Dashboard.
4. Create, list, open and update applications.
5. Record visits.
6. Upload one document.
7. Submit application to BM.
8. BM approval transition.
9. Workflow history and audit log creation.

Advanced LAP-LIP modules are scaffolded as module folders and should be implemented incrementally behind backend permission checks.
