# BrowseIt

## Setup

```bash
npm install
```

Create `.env.local`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/browseit
```

## Seed

```bash
npm run seed
```

Idempotent — safe to run more than once.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run build
npm start
```
