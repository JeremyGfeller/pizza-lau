# Pizza Lau

Application e-commerce pizza mobile-first pour le marché suisse (CHF), construite avec Next.js App Router, TypeScript, TailwindCSS, shadcn/ui, Prisma v7, PostgreSQL, Stripe et auth JWT custom.

## Stack
- Next.js 16 + React 19
- TypeScript
- TailwindCSS (avec `tailwind.config.ts`)
- shadcn/ui (composants sous `components/ui`)
- Prisma ORM v7 + PostgreSQL
- Stripe Checkout + webhook
- Auth custom JWT + bcrypt
- Dashboard admin (commandes, produits, utilisateurs, reporting)
- Print queue cuisine avec retry + bridge local

## Fonctionnalités clés
- Auth obligatoire username/password (bcrypt + JWT cookie `httpOnly`)
- Boutique premium et responsive
- Panier et checkout Stripe
- Modes commande: livraison / retrait cuisine
- Tracking commande (timeline)
- Dashboard admin opérationnel
- Impression automatique des tickets lors du passage `PAID -> PREPARING`

## Modèle de données
Voir `prisma/schema.prisma`:
- `User`, `Session`, `Address`
- `PizzaCategory`, `Pizza`, `PizzaSizeOption`, `ExtraOption`, `PizzaExtra`
- `Cart`, `CartItem`, `CartItemExtra`
- `Order`, `OrderItem`, `OrderItemExtra`, `OrderStatusLog`, `Payment`
- `DeliveryZone`
- `PrintJob`, `PrintLog`

## Installation
```bash
# 1) installer dépendances
npm install

# 2) copier variables d'environnement
cp .env.example .env

# 3) générer le client Prisma
npm run db:generate

# 4) migration DB
npm run db:migrate

# 5) seed de démo
npm run db:seed

# 6) lancer l'app
npm run dev
```

## Variables d'environnement
Voir `.env.example`:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `PRINT_WORKER_KEY`, `PRINT_BRIDGE_URL`
- `TAX_RATE_PERCENT`

## Impression ticket cuisine
- Documentation: `docs/printing-architecture.md`
- Worker: `npm run print:worker`
- Bridge MVP local: `npm run print:bridge`

## Webhook Stripe (local)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Puis copier le secret webhook dans `STRIPE_WEBHOOK_SECRET`.

## Comptes seed
- `admin` / `Admin1234!`
- `kitchen` / `Staff1234!`

## Tests
```bash
npm run test
```

## QA checklist rapide
- Login/register/logout OK
- Ajout panier / update quantité / suppression OK
- Checkout Stripe -> webhook -> statut `PAID` OK
- Admin: transition `PAID -> PREPARING` crée `PrintJob` OK
- Worker impression -> `SUCCESS`/retry `FAILED` OK
- Tracking client met à jour le statut automatiquement
