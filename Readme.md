# KriyaChain

**A QR-code-based provenance and ownership tracking system for Indonesian wastra (traditional woven textile) craftsmanship.**

Counterfeit and unverifiable-origin goods are a persistent problem in handcrafted textile markets. KriyaChain gives each wastra/batik piece a unique QR code plus a physical secret claim code, together acting as a portable certificate of authenticity. Anyone can scan the QR to view a piece's registered origin and full ownership history; the current owner can formally transfer it to a new owner, permanently appended to that piece's history.

> **A note on the name:** despite "Chain," this isn't built on blockchain/distributed ledger technology — there's no Web3 or smart contract layer here. Ownership history is modeled as an append-only ledger table (`TransferHistory`) in a standard PostgreSQL database. The chain-of-custody *concept* is blockchain-inspired; the implementation is a conventional relational backend. Worth being upfront about, since the name alone might suggest otherwise.

---

## How It Works

There are two distinct account types, plus one fully public surface:

- **Artisan** (verified account, register/login required) — registers new products, uploads photos, edits product details. Verification gating here matters: only registered artisans can mint new provenance records, which is what keeps the registry trustworthy.
- **Owner** (account required) — claims a product using its QR code **and** a physical secret claim code (not the QR code alone — see Security below), and can initiate/accept/reject ownership transfers.
- **Public explorer** — anyone, no account needed, can scan a QR code and see a product's registered details and full ownership history. Verifiability shouldn't require an account.

**Buying online works fine, no marketplace features needed.** KriyaChain doesn't handle checkout or payment — a sale happens through whatever channel the artisan already uses (WhatsApp, Instagram, Shopee, in person). The QR code and its physical claim code travel *with the shipped item*; the buyer claims ownership after the item arrives, regardless of distance.

**New owner without an account yet?** A transfer can be initiated toward someone who isn't registered yet via an invite token — they follow the invite link and register + accept the transfer in one step (`accept-with-register`), rather than needing an account to exist beforehand.

## Security Notes

- **Claiming requires more than the QR code.** The QR alone identifies a product; claiming it also requires a separate secret claim code (bcrypt-hashed, same as passwords) — meant to be physically attached to the item, not just derivable from a photo of the QR that might circulate online.
- **CORS is an explicit allowlist** (`ALLOWED_ORIGINS` env, comma-separated) — requests from origins outside the list get no CORS headers at all (rejected by the browser), and blocked attempts are logged.
- **JWT secret has a development fallback** with a loud one-time startup warning if `JWT_SECRET` isn't set — so a misconfigured `.env` in production is visible in the logs rather than silent.
- Passwords (Artisan and Owner) are bcrypt-hashed.

## Features

- Product registration with photo upload (Artisan)
- QR + secret claim code generation per product
- Public QR scan lookup — product details + full ownership history, no login required
- Ownership claim (QR + claim code, requires Owner account)
- Two-step ownership transfer: initiate (by Owner or Artisan) → recipient accepts or rejects
- Invite-token transfer flow for recipients who don't have an account yet
- Stats dashboard, CSV export of the product registry
- Per-IP rate limiting (token bucket)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (`frontend/`) | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| QR handling | `react-qr-code` (generation), `@yudiel/react-qr-scanner` (scanning) |
| Backend (`backend/`) | Go, Gin, GORM, PostgreSQL |
| Auth | JWT (`golang-jwt/jwt/v5`), bcrypt |
| Rate limiting | Per-IP token bucket (`golang.org/x/time/rate`) |

## API Reference

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/artisan/register`, `/login` | `POST` | Public | Artisan account |
| `/api/auth/owner/register`, `/login` | `POST` | Public | Owner account |
| `/api/auth/refresh` | `POST` | Public | Refresh access token |
| `/api/products` | `GET` | Public | List all registered products |
| `/api/products/scan/:qr_code` | `GET` | Public | Look up a product by QR code |
| `/api/products/history/:qr_code` | `GET` | Public | Full ownership history |
| `/api/products/export` | `GET` | Public | Export registry as CSV |
| `/api/stats` | `GET` | Public | Aggregate statistics |
| `/api/upload` | `POST` | Artisan | Upload product photo |
| `/api/products` | `POST` | Artisan | Register a new product |
| `/api/products/edit/:qr_code` | `PATCH` | Artisan | Edit product details |
| `/api/products/claim/:qr_code` | `PUT` | Owner | Claim ownership (QR + claim code) |
| `/api/products/transfer/:qr_code` | `POST` | Owner | Initiate transfer |
| `/api/products/transfer-by-artisan/:qr_code` | `POST` | Artisan | Artisan-initiated transfer |
| `/api/transfers/pending` | `GET` | Owner | List pending transfers |
| `/api/transfers/accept`, `/reject` | `PATCH` | Owner | Respond to a pending transfer |
| `/api/transfers/invite/:token` | `GET` | Public | View a transfer invite |
| `/api/transfers/accept-with-register` | `POST` | Public | Register + accept a transfer in one step |

## Getting Started

### Prerequisites
- Go 1.25+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
cp .env.example .env   # set database credentials, JWT_SECRET, ALLOWED_ORIGINS
go mod tidy
go run main.go          # auto-migrates schema, runs on :8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Screenshots

<table>
  <tr>
    <td align="center"><img src="assets/batik1.png" width="100%"/></td>
    <td align="center"><img src="assets/batik2.png" width="100%"/></td>
    <td align="center"><img src="assets/batik3.png" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/batik4.png" width="100%"/></td>
    <td align="center"><img src="assets/batik5.png" width="100%"/></td>
    <td align="center"><img src="assets/batik6.png" width="100%"/></td>
  </tr>
</table>

## Known Limitations

- The rate limiter tracks IPs in an in-memory map, which resets on restart and won't work correctly across multiple server instances — acceptable for a single-instance deployment, not for horizontal scaling
- Go module name (`prepdev-backend`) is a leftover from an earlier folder structure and doesn't match the current `backend/` directory name — cosmetic, not functional
- Transfer invites (`accept-with-register`) don't yet expire — a stale invite token could theoretically be used long after it was issued; worth adding a TTL

---

*Built with Go, Gin, and Next.js.*
