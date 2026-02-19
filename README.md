# ReplyAI

> Odpowiadaj na opinie Google w 10 sekund — zasilane przez AI

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
![Claude](https://img.shields.io/badge/AI-Claude%20Haiku-FF6B35?style=flat-square)

---

## Spis treści

- [Wymagania](#wymagania)
- [Pierwsze uruchomienie](#pierwsze-uruchomienie-od-zera)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Konfiguracja Supabase](#konfiguracja-supabase)
- [Konfiguracja Stripe](#konfiguracja-stripe)
- [Konfiguracja Anthropic](#konfiguracja-anthropic)
- [Konfiguracja Resend](#konfiguracja-resend)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Struktura projektu](#struktura-projektu)
- [Deployment na Vercel](#deployment-na-vercel)
- [Przydatne komendy](#przydatne-komendy)
- [Troubleshooting](#troubleshooting)

---

## Wymagania

Przed startem upewnij się że masz zainstalowane:

| Narzędzie | Wersja | Jak sprawdzić |
|---|---|---|
| Node.js | 18.17+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | dowolna | `git --version` |

Jeśli nie masz Node.js — pobierz z [nodejs.org](https://nodejs.org) (wersja LTS).

---

## Pierwsze uruchomienie od zera

### Krok 1 — Sklonuj repozytorium

```bash
git clone https://github.com/WASZ_USERNAME/replyai.git
cd replyai
```

### Krok 2 — Zainstaluj zależności

```bash
npm install
```

> ⏱ Pierwsze `npm install` może zająć 1–2 minuty. To normalne.

### Krok 3 — Skopiuj plik zmiennych środowiskowych

```bash
cp .env.example .env.local
```

Teraz uzupełnij wartości w `.env.local` — szczegóły w sekcji [Zmienne środowiskowe](#zmienne-środowiskowe).

### Krok 4 — Uruchom lokalnie

```bash
npm run dev
```

Aplikacja działa pod adresem: **http://localhost:3000**

---

## Zmienne środowiskowe

Plik `.env.local` musi zawierać poniższe klucze.  
**Nigdy nie commituj tego pliku do Git** — jest już w `.gitignore`.

```bash
# ─── SUPABASE ────────────────────────────────────────────
# Znajdziesz w: supabase.com → projekt → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...     # ⚠️ tylko server-side, nigdy w przeglądarce

# ─── ANTHROPIC ───────────────────────────────────────────
# Znajdziesz w: console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-...

# ─── STRIPE ──────────────────────────────────────────────
# Znajdziesz w: dashboard.stripe.com → Developers → API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...           # generujesz przy tworzeniu webhooka

# IDs produktów z Stripe (stworzysz je w kroku Konfiguracja Stripe)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...

# ─── RESEND ──────────────────────────────────────────────
# Znajdziesz w: resend.com → API Keys
RESEND_API_KEY=re_...

# ─── APP ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000  # zmień na domenę po deployu
```

---

## Konfiguracja Supabase

### 1. Utwórz projekt

1. Wejdź na [supabase.com](https://supabase.com) → **New project**
2. Nazwa projektu: `replyai`
3. Region: **West EU (Ireland)** — ważne dla RODO
4. Hasło bazy danych: wygeneruj silne i zapisz w bezpiecznym miejscu

### 2. Uruchom migracje bazy danych

Otwórz **SQL Editor** w panelu Supabase i wklej poniższy kod:

```sql
-- Krok 1: Profile użytkowników
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Krok 2: Firmy
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry        TEXT NOT NULL,
  tone            TEXT NOT NULL DEFAULT 'friendly',
  language        TEXT NOT NULL DEFAULT 'pl',
  description     TEXT,
  owner_name      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Krok 3: Subskrypcje
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                   TEXT NOT NULL DEFAULT 'free',
  status                 TEXT NOT NULL DEFAULT 'active',
  current_period_end     TIMESTAMPTZ,
  generations_used       INT NOT NULL DEFAULT 0,
  generations_limit      INT NOT NULL DEFAULT 5,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Krok 4: Generacje
CREATE TABLE generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  review_text     TEXT NOT NULL,
  review_rating   INT CHECK (review_rating BETWEEN 1 AND 5),
  review_platform TEXT NOT NULL DEFAULT 'google',
  reply_text      TEXT NOT NULL,
  was_edited      BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_used     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Krok 5: Indeksy
CREATE INDEX idx_companies_owner       ON companies(owner_id);
CREATE INDEX idx_generations_company   ON generations(company_id);
CREATE INDEX idx_generations_created   ON generations(created_at DESC);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

-- Krok 6: Row Level Security
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: własne dane"
  ON profiles FOR ALL USING (id = auth.uid());

CREATE POLICY "Companies: własne firmy"
  ON companies FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Generations: własne generacje"
  ON generations FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Subscriptions: własne subskrypcje"
  ON subscriptions FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

-- Krok 7: Funkcja inkrementacji licznika generacji
CREATE OR REPLACE FUNCTION increment_generations(company_id UUID)
RETURNS void AS $$
  UPDATE subscriptions
  SET generations_used = generations_used + 1,
      updated_at = NOW()
  WHERE subscriptions.company_id = $1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Krok 8: Auto-reset licznika co miesiąc (opcjonalne — wymaga pg_cron)
-- Jeśli chcesz ręcznie resetować, możesz pominąć ten krok
-- SELECT cron.schedule('reset-monthly-generations', '0 0 1 * *',
--   'UPDATE subscriptions SET generations_used = 0 WHERE plan = ''free''');
```

Kliknij **Run** — jeśli widzisz `Success`, wszystko działa.

### 3. Skopiuj klucze API

Panel Supabase → **Settings** → **API**:
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Wyłącz potwierdzenie emaila (opcjonalnie na dev)

Panel Supabase → **Authentication** → **Settings** → wyłącz **Enable email confirmations**

> Przydatne podczas developmentu żeby nie klikać w maile przy każdym teście.

---

## Konfiguracja Stripe

### 1. Utwórz konto i produkty

1. Wejdź na [stripe.com](https://stripe.com) → zarejestruj się
2. Zostań w trybie **Test** (przełącznik na górze)
3. Przejdź do **Products** → **Add product**

**Produkt 1 — Pro:**
- Nazwa: `ReplyAI Pro`
- Cena: `79.00 PLN` / miesiąc, recurring
- Skopiuj `Price ID` → `STRIPE_PRO_PRICE_ID`

**Produkt 2 — Agency:**
- Nazwa: `ReplyAI Agency`
- Cena: `199.00 PLN` / miesiąc, recurring
- Skopiuj `Price ID` → `STRIPE_AGENCY_PRICE_ID`

### 2. Skonfiguruj webhook lokalny

Zainstaluj Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows — pobierz z https://github.com/stripe/stripe-cli/releases
```

Uruchom nasłuchiwanie (w osobnym terminalu, gdy `npm run dev` już działa):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Skopiuj `webhook signing secret` (zaczyna się od `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### 3. Karty testowe

| Scenariusz | Numer karty |
|---|---|
| Płatność OK | `4242 4242 4242 4242` |
| Karta odrzucona | `4000 0000 0000 0002` |
| Wymaga 3D Secure | `4000 0025 0000 3155` |

Data: dowolna przyszła, CVC: dowolne 3 cyfry.

---

## Konfiguracja Anthropic

1. Wejdź na [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Skopiuj klucz → `ANTHROPIC_API_KEY`

> Model używany w MVP: `claude-haiku-4-5-20251001` — najtańszy i wystarczająco dobry.  
> Koszt: ~$0.0015 per generacja (bardzo tanio).

**Limit wydatków:** ustaw w panelu Anthropic limit np. $10/mies. żeby nie dostać niespodziewanego rachunku podczas developmentu.

---

## Konfiguracja Resend

1. Wejdź na [resend.com](https://resend.com) → utwórz konto
2. **API Keys** → **Create API Key**
3. Skopiuj → `RESEND_API_KEY`
4. Dodaj i zweryfikuj domenę wysyłki (lub użyj `onboarding@resend.dev` na testy)

---

## Uruchomienie lokalne

```bash
# Tryb development z hot-reload
npm run dev

# Build produkcyjny (test przed deployem)
npm run build
npm run start

# Linting
npm run lint

# Sprawdzenie typów TypeScript
npm run type-check
```

Aplikacja: **http://localhost:3000**  
Supabase Studio: panel na supabase.com → twój projekt

---

## Struktura projektu

```
replyai/
├── app/
│   ├── (public)/               # Strony bez autoryzacji
│   │   ├── page.tsx            # Landing page
│   │   ├── pricing/page.tsx    # Cennik
│   │   └── login/page.tsx      # Logowanie / rejestracja
│   ├── (dashboard)/            # Strony wymagające logowania
│   │   ├── layout.tsx          # Wspólny layout z nawigacją
│   │   ├── dashboard/page.tsx  # ⭐ Główny generator
│   │   ├── history/page.tsx    # Historia odpowiedzi
│   │   ├── settings/page.tsx   # Profil firmy
│   │   └── billing/page.tsx    # Subskrypcja
│   └── api/
│       ├── generate/route.ts   # POST /api/generate
│       └── webhooks/
│           └── stripe/route.ts # Stripe webhook handler
├── components/
│   ├── ui/                     # Shadcn/ui (nie edytuj ręcznie)
│   ├── GeneratorForm.tsx       # Formularz z opinią
│   ├── ReplyOutput.tsx         # Wynik + przycisk kopiuj
│   ├── CompanySetup.tsx        # Onboarding — profil firmy
│   └── UsageBar.tsx            # Licznik X/5 generacji
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   ├── anthropic.ts            # Claude API wrapper
│   ├── stripe.ts               # Stripe helper + PLANS config
│   └── prompts.ts              # System prompt + buildPrompt()
├── middleware.ts               # Auth guard — chroni /dashboard/*
├── .env.example                # Szablon zmiennych (commituj to)
├── .env.local                  # Twoje klucze (NIE commituj!)
└── README.md                   # Ten plik
```

---

## Deployment na Vercel

### Pierwsze wdrożenie

1. Wejdź na [vercel.com](https://vercel.com) → **Add New Project**
2. Połącz z GitHubem i wybierz repo `replyai`
3. Framework: **Next.js** (wykryje automatycznie)
4. Dodaj wszystkie zmienne z `.env.local` w sekcji **Environment Variables**
5. Kliknij **Deploy**

### Webhook Stripe na produkcji

Po deployu zaktualizuj webhook w Stripe:

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://twojadomena.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Skopiuj nowy `whsec_...` → zaktualizuj `STRIPE_WEBHOOK_SECRET` w Vercel

### Zmienne środowiskowe na Vercel

Pamiętaj o zmianie:
```
NEXT_PUBLIC_APP_URL=https://twojadomena.vercel.app
```

---

## Przydatne komendy

```bash
# Dodaj komponent Shadcn/ui
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add card

# Sprawdź typy bez buildu
npx tsc --noEmit

# Wyczyść cache Next.js (gdy coś dziwnego się dzieje)
rm -rf .next && npm run dev

# Sprawdź czy webhook Stripe działa lokalnie
stripe trigger checkout.session.completed
```

---

## Troubleshooting

### ❌ `Error: Invalid API Key` przy generacji

Sprawdź czy `ANTHROPIC_API_KEY` jest poprawnie ustawiony w `.env.local`  
i czy plik jest w głównym folderze projektu (nie w podfolderze).

### ❌ `relation "companies" does not exist`

SQL migration nie została uruchomiona. Wróć do [Konfiguracja Supabase → krok 2](#2-uruchom-migracje-bazy-danych) i uruchom SQL w edytorze Supabase.

### ❌ Stripe webhook zwraca `400 Bad Request`

Najczęstsza przyczyna: `STRIPE_WEBHOOK_SECRET` nie zgadza się z tym który pokazuje `stripe listen`.  
Zatrzymaj CLI, uruchom ponownie `stripe listen ...` i skopiuj nowy `whsec_`.

### ❌ Użytkownik po zalogowaniu jest przekierowywany z powrotem na `/login`

Sprawdź czy `middleware.ts` poprawnie odczytuje sesję Supabase.  
Częsty błąd: używanie `createClient` z `client.ts` zamiast `server.ts` w middleware.

### ❌ `npm install` kończy się błędem na Windows

Uruchom PowerShell jako administrator:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Następnie spróbuj ponownie.

### ❌ Coś innego nie działa

1. Sprawdź logi w terminalu gdzie działa `npm run dev`
2. Sprawdź konsolę przeglądarki (F12 → Console)
3. Sprawdź zakładkę Network (F12) — szukaj czerwonych requestów
4. Wróć do tego README i upewnij się że żaden krok nie został pominięty

---

## Kontakt i pytania

Macie pytania do siebie nawzajem? Używajcie komentarzy w PR lub Issues na GitHubie.

---

*ReplyAI MVP — budujemy razem, krok po kroku.*
