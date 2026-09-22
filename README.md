# Ecommerce-surfshop (WESTLINE)

Application code for the WESTLINE e-commerce store. Planning docs live in the
sibling hub repo [Ecommerce-surfshopOS](https://github.com/keren-elbaz-m/Ecommerce-surfshopOS)
(SoftwareOS — `softwareos/`).

## Structure

Two independent top-level apps, each with its own `package.json`. No shared
tooling/monorepo layer — there's no shared code between them yet.

```
web/   # Next.js (React 18) + TypeScript + Tailwind CSS, SSR frontend
cms/   # Strapi (TypeScript) headless CMS/backend, PostgreSQL via Strapi's data layer
```

## Getting started

### web/

```
cd web
npm run dev
```

### cms/

```
cd cms
npm run develop
```

Requires a local PostgreSQL instance — connection details live in `cms/.env`
(not committed; scaffolded with placeholder local values — update
`DATABASE_HOST`/`DATABASE_PORT`/`DATABASE_NAME`/`DATABASE_USERNAME`/
`DATABASE_PASSWORD` for your local DB). `cms/.env.example` documents the
non-DB secrets (`APP_KEYS`, `JWT_SECRET`, etc.) that Strapi needs generated
per environment.
