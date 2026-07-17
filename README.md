<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/defh2c1db/image/upload/v1784135001/26dfac07e1011871921c87f63f302864_qaw2bj.png">
  <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/defh2c1db/image/upload/v1784135005/0bae6c9c62fdac00b88805b1275f0327_gqecc6.png">
  <img alt="docsignpro" src="https://res.cloudinary.com/defh2c1db/image/upload/v1784135005/0bae6c9c62fdac00b88805b1275f0327_gqecc6.png" width="300">
</picture>

A digital seal for data that has to stay exactly as you left it, no matter how many hands it passes through. It gives you a simple, permanent way to prove your records are authentic and verify them whenever you need to.

<br>

![Stars](https://img.shields.io/github/stars/vsaintz/docsign-pro?style=for-the-badge&labelColor=282A36&color=BD93F9)&nbsp;&nbsp;&nbsp;
![Issues](https://img.shields.io/github/issues/vsaintz/docsign-pro?style=for-the-badge&labelColor=282A36&color=FF79C6)&nbsp;&nbsp;&nbsp;
![Last Commit](https://img.shields.io/github/last-commit/vsaintz/docsign-pro?style=for-the-badge&labelColor=282A36&color=50FA7B)

![Python](https://img.shields.io/badge/Python-3.12-black?style=flat-square&labelColor=ECEFF4&color=5E81AC)&nbsp;
![Django](https://img.shields.io/badge/Django-6.0-black?style=flat-square&labelColor=ECEFF4&color=81A1C1)&nbsp;
![Angular](https://img.shields.io/badge/Angular-21-black?style=flat-square&labelColor=ECEFF4&color=88C0D0)
</div>

<br>

### What it does

DocSign Pro builds a cryptographically secure record of who signed a piece of data and exactly when. Content gets normalized before signing, so the seal reflects what the data actually means rather than the raw bytes it happens to be stored in. Later, checking a document just compares its current state against that original seal and tells you whether it still holds up, has been altered, or couldn't be read properly.

<br>
<img src="https://res.cloudinary.com/defh2c1db/image/upload/v1784136159/3fd9da4c706ff044f1f8665de2bb7c8b_f9kr7m.png" alt="landing page" />

### Features

Every document is locked down with RSA-PSS signatures over canonical SHA-256 hashes, fixing its content at the exact moment of signing. For spreadsheets, the backend extracts and normalizes data straight from uploaded CSV and Excel (XLS, XLSX) files, so the signature tracks the actual data instead of formatting noise that shifts between opens and saves.

Documents can be grouped into projects, color-coded, and pinned to fit however you like to organize your workspace. Every signed document also gets an 8-character short ID automatically, which anyone can use alongside the file itself to verify authenticity through the public portal.

<br>

<img src="https://res.cloudinary.com/defh2c1db/image/upload/v1784134971/71362cbdcd58e7545774592489807679_hrgvgz.png" alt="admin dashboard" />
Admins get a full dashboard covering system health, active users, and a live audit trail of every signature and verification attempt across the platform.

<br>
<br>

<img src="https://res.cloudinary.com/defh2c1db/image/upload/v1784123596/d839aebb98fa7c73b51b47000249322f_vbbpr7.png" alt="public verification" />
The public verification page doesn't require an account. Upload a document along with its short ID and the portal cross-checks the two instantly, letting you know if it's intact, altered, or unreadable.

<br>

### Getting started

Setup leans on Docker for the database, so you're not configuring Postgres by hand. You'll need:

- **Docker Desktop** for the PostgreSQL container.
- **Python 3.12** for the Django backend, API, and JWT auth.
- **Node.js & Yarn** for the Angular frontend.

### Backend

Navigate into `django/` and set up your environment file:

```Bash
cd django
cp .env.example .env
```

Generate a secret key and drop it into `SECRET_KEY` in your new `.env`:

```Bash
python -c "import secrets; chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'; print(''.join(secrets.choice(chars) for i in range(50)))"
```

With the rest of your `.env` filled in and Docker running, spin up the database from the project root:

```Bash
docker compose --env-file ./django/.env up -d
```

Then install dependencies and prep the database:

```Bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Stop the database with `docker compose down`, or wipe it entirely with `docker compose down -v`.

### Frontend

The frontend is an Angular 21 app handling the public pages, auth, and internal dashboards:

```Bash
yarn install
ng serve
```

### Project structure

The layout keeps things predictable so it's easy to jump in and find what you need.

On the frontend, functional domains are split cleanly, with path aliases like `@auth`, `@services`, and `@shared` keeping imports short:

- `app/auth/`: sign-in and sign-out flows.
- `app/guards/`: route access control, like redirecting staff to the admin view or keeping guests out of the dashboard.
- `app/services/`: data fetching and business logic.
- `app/interceptors/`: HTTP request/response middleware and token handling.
- `app/dashboard/` & `app/landing/`: the authenticated workspace and public-facing pages.
- `app/shared/`: components used across multiple areas.

On the backend, Django is split into focused apps:

- `users/`: custom user models, admin roles, and JWT auth.
- `documents/`: uploads, validation, spreadsheet extraction, and processing pipelines.
- `signatures/`: RSA-PSS logic, public verification endpoints, and tamper detection.
- `projects/`: workspace models for organizing and pinning documents.

### Contributing

The main branch stays stable, so even small fixes like a typo should go through a new branch rather than a direct push.
