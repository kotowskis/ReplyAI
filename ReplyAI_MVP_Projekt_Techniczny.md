# ReplyAI — Projekt Techniczny MVP

> **Wersja:** 1.0 | **Data:** Luty 2026 | **Zespół:** 2 osoby  
> **Cel:** Działający produkt z płacącymi klientami w 8 tygodni

---

## Spis treści

1. [Definicja MVP](#1-definicja-mvp)
2. [Stack technologiczny](#2-stack-technologiczny)
3. [Architektura systemu](#3-architektura-systemu)
4. [Schemat bazy danych](#4-schemat-bazy-danych)
5. [Moduły aplikacji](#5-moduły-aplikacji)
6. [AI — Prompt Engineering](#6-ai--prompt-engineering)
7. [Integracje zewnętrzne](#7-integracje-zewnętrzne)
8. [Bezpieczeństwo i RODO](#8-bezpieczeństwo-i-rodo)
9. [Plan 8 tygodni](#9-plan-8-tygodni)
10. [Podział zadań](#10-podział-zadań)
11. [Definicja Done](#11-definicja-done)
12. [Co odpuszczamy w MVP](#12-co-odpuszczamy-w-mvp)

---

## 1. Definicja MVP

### Co robi ReplyAI v1.0

Użytkownik:
1. Rejestruje konto i wypełnia profil firmy (nazwa, branża, ton komunikacji)
2. Wkleja treść opinii z Google / Facebooka
3. Klika "Generuj odpowiedź"
4. Dostaje gotową odpowiedź — przegląda, opcjonalnie edytuje
5. Kopiuje do schowka i wkleja w Google Maps

### Co NIE wchodzi do MVP

- Auto-publikowanie odpowiedzi przez API
- Integracja z Google My Business API
- Analityka i wykresy nastrojów
- Aplikacja mobilna
- Współpraca wielu użytkowników w jednym koncie
- Własne domeny dla white-label

### Miernik sukcesu MVP

> **10 płacących klientów w 30 dni od launchu**

---

## 2. Stack technologiczny

### Uzasadnienie wyboru

Stack zoptymalizowany pod **2-osobowy zespół bez DevOps** — minimalny czas od kodu do produkcji.

```
Frontend + Backend:  Next.js 14 (App Router)
Baza danych:         Supabase (PostgreSQL + Auth + Storage)
AI:                  Anthropic Claude API (claude-haiku-4 — szybki i tani)
Płatności:           Stripe (Subscriptions + Customer Portal)
Hosting:             Vercel (frontend + API routes)
Email:               Resend (transakcyjne emaile)
Monitoring błędów:   Sentry (free tier)
Analytics:           Vercel Analytics (wbudowane, RODO-friendly)
```

### Dlaczego ten stack, nie inny

| Alternatywa | Dlaczego odrzucona |
|---|---|
| Vue / Nuxt | Mniejszy ekosystem, mniej przykładów SaaS |
| Express osobno | Więcej konfiguracji, osobny hosting |
| Firebase | Vendor lock-in, drożeje przy wzroście |
| MongoDB | PostgreSQL lepszy dla relacyjnych danych subskrypcji |
| OpenAI GPT-4 | 10x droższy od Claude Haiku przy tym samym efekcie |

### Koszty miesięczne (przy 0–100 klientach)

| Usługa | Koszt |
|---|---|
| Vercel (Hobby → Pro) | $0–20/mies. |
| Supabase (Free → Pro) | $0–25/mies. |
| Claude API (Haiku) | ~$0.25 per 1000 generacji |
| Stripe | 2.9% + $0.30 per transakcja |
| Resend | $0 (do 3000 emaili/mies.) |
| Sentry | $0 (free tier) |
| **Łącznie przy 50 klientach** | **~$50–70/mies.** |

---

## 3. Architektura systemu

```
┌─────────────────────────────────────────────────────┐
│                    PRZEGLĄDARKA                      │
│              Next.js App (React)                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│               VERCEL EDGE                           │
│         Next.js API Routes (/api/*)                 │
│                                                     │
│  /api/generate    → Claude API                      │
│  /api/webhooks    → Stripe webhooks                 │
│  /api/auth/*      → Supabase Auth                   │
└──────┬────────────────────────┬────────────────────┘
       │                        │
┌──────▼──────┐        ┌───────▼────────┐
│  SUPABASE   │        │  ANTHROPIC API │
│  PostgreSQL │        │  Claude Haiku  │
│  Auth       │        └────────────────┘
│  Storage    │
└──────┬──────┘        ┌────────────────┐
       │               │    STRIPE      │
       └───────────────│  Subscriptions │
                       │  Webhooks      │
                       └────────────────┘
```

### Flow główny — generowanie odpowiedzi

```
1. User klika "Generuj"
2. POST /api/generate { review_text, company_id }
3. Middleware: sprawdź auth token (Supabase)
4. Middleware: sprawdź limit generacji (plan Free = 5/mies.)
5. Pobierz profil firmy z Supabase
6. Zbuduj prompt (system + user)
7. Wywołaj Claude API (streaming opcjonalnie)
8. Zapisz generację w tabeli `generations`
9. Zwróć odpowiedź do frontendu
10. User kopiuje i zamknij
```

---

## 4. Schemat bazy danych

```sql
-- UŻYTKOWNICY (rozszerza Supabase Auth)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  email         TEXT NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- FIRMY / PROFILE BIZNESOWE
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles(id),
  name            TEXT NOT NULL,           -- "Pizzeria Da Vinci"
  industry        TEXT NOT NULL,           -- "restaurant" | "hotel" | "salon" | ...
  tone            TEXT NOT NULL,           -- "formal" | "friendly" | "casual"
  language        TEXT DEFAULT 'pl',       -- "pl" | "en"
  description     TEXT,                   -- Dodatkowy kontekst o firmie
  owner_name      TEXT,                   -- Imię właściciela do podpisu
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSKRYPCJE
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies(id),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                  TEXT DEFAULT 'free',  -- "free" | "pro" | "agency"
  status                TEXT DEFAULT 'active', -- "active" | "canceled" | "past_due"
  current_period_end    TIMESTAMPTZ,
  generations_used      INT DEFAULT 0,
  generations_limit     INT DEFAULT 5,        -- 5 free, -1 = unlimited
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- GENERACJE ODPOWIEDZI
CREATE TABLE generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  review_text     TEXT NOT NULL,
  review_rating   INT,                     -- 1-5 gwiazdek (opcjonalne)
  review_platform TEXT DEFAULT 'google',  -- "google" | "facebook" | "booking"
  reply_text      TEXT NOT NULL,
  was_edited      BOOLEAN DEFAULT FALSE,
  tokens_used     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- INDEKSY
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_generations_company ON generations(company_id);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

-- ROW LEVEL SECURITY
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own companies"
  ON companies FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users see own generations"
  ON generations FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );
```

---

## 5. Moduły aplikacji

### 5.1 Struktura plików Next.js

```
replyai/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/page.tsx      # Cennik
│   │   └── login/page.tsx        # Logowanie / rejestracja
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout z nawigacją
│   │   ├── dashboard/page.tsx    # Główny ekran generatora
│   │   ├── history/page.tsx      # Historia odpowiedzi
│   │   ├── settings/page.tsx     # Profil firmy
│   │   └── billing/page.tsx      # Subskrypcja i faktury
│   └── api/
│       ├── generate/route.ts     # POST — generuj odpowiedź
│       ├── webhooks/
│       │   └── stripe/route.ts   # Stripe webhook handler
│       └── billing/
│           └── portal/route.ts   # Stripe Customer Portal redirect
├── components/
│   ├── ui/                       # Shadcn/ui komponenty
│   ├── GeneratorForm.tsx         # Główny formularz
│   ├── ReplyOutput.tsx           # Output z przyciskiem kopiuj
│   ├── CompanySetup.tsx          # Onboarding — profil firmy
│   ├── UsageBar.tsx              # Pasek wykorzystania limitu
│   └── PlanBadge.tsx             # Free / Pro badge
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── anthropic.ts              # Claude API wrapper
│   ├── stripe.ts                 # Stripe klient i helpers
│   └── prompts.ts                # Szablony promptów
└── middleware.ts                  # Auth guard dla /dashboard/*
```

### 5.2 Ekrany aplikacji

#### Ekran 1 — Generator (główny widok)

```
┌─────────────────────────────────────────┐
│ ReplyAI  [Profil firmy ▾]  [Pro ✓]  [☰]│
├─────────────────────────────────────────┤
│                                         │
│  Wklej opinię klienta                  │
│  ┌─────────────────────────────────┐   │
│  │ Byłem tu wczoraj...             │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Platforma: [Google ▾]  ★ ★ ★ ☆ ☆     │
│                                         │
│  [    Generuj odpowiedź →    ]          │
│                                         │
├─────────────────────────────────────────┤
│  Gotowa odpowiedź:                      │
│  ┌─────────────────────────────────┐   │
│  │ Dzień dobry, dziękujemy za...   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  [✎ Edytuj]  [📋 Kopiuj do schowka]   │
│                                         │
│  Użyte: 3/5 generacji  [Upgrade →]     │
└─────────────────────────────────────────┘
```

#### Ekran 2 — Onboarding (pierwsze logowanie)

```
┌─────────────────────────────────────────┐
│  Krok 1/3 — Opowiedz nam o firmie      │
│                                         │
│  Nazwa firmy *                          │
│  [Pizzeria Da Vinci              ]      │
│                                         │
│  Branża *                               │
│  [Restauracja / Gastronomia      ▾]    │
│                                         │
│  Ton komunikacji *                      │
│  ○ Formalny   ● Przyjazny   ○ Casualowy│
│                                         │
│  Imię właściciela (do podpisu)          │
│  [Marcin                         ]      │
│                                         │
│  [Dalej →]                              │
└─────────────────────────────────────────┘
```

---

## 6. AI — Prompt Engineering

### System prompt (niezmienny)

```
Jesteś ekspertem od zarządzania reputacją online dla lokalnych firm.
Twoje zadanie: napisać profesjonalną, spersonalizowaną odpowiedź
na opinię klienta w imieniu właściciela firmy.

Zasady odpowiedzi:
- Długość: 80–160 słów (nie za krótka, nie za długa)
- Zawsze podziękuj za opinię
- Przy negatywnej: przeproś bez przyznawania winy, zaproponuj rozwiązanie
- Przy pozytywnej: podziękuj ciepło, zaproś ponownie
- Podpisz imieniem właściciela jeśli podane
- NIE używaj szablonowych fraz typu "Dziękujemy za Państwa opinię"
- Pisz jak prawdziwy właściciel, nie jak dział obsługi klienta
- Język odpowiedzi musi być taki sam jak język opinii
```

### User prompt (dynamiczny)

```typescript
// lib/prompts.ts

export function buildPrompt(params: {
  review: string
  rating: number | null
  platform: string
  company: {
    name: string
    industry: string
    tone: string
    ownerName: string | null
    description: string | null
  }
}): string {
  const { review, rating, platform, company } = params

  const toneMap = {
    formal:   'formalny i profesjonalny',
    friendly: 'przyjazny i ciepły',
    casual:   'casualowy i bezpośredni',
  }

  return `
Firma: ${company.name}
Branża: ${company.industry}
Ton komunikacji: ${toneMap[company.tone] ?? 'przyjazny'}
${company.ownerName ? `Właściciel: ${company.ownerName}` : ''}
${company.description ? `Dodatkowy kontekst: ${company.description}` : ''}

Platforma: ${platform}
${rating ? `Ocena: ${rating}/5 gwiazdek` : ''}

Opinia klienta:
"""
${review}
"""

Napisz odpowiedź na tę opinię. Odpowiedz TYLKO treścią odpowiedzi,
bez żadnych komentarzy ani wyjaśnień.
  `.trim()
}
```

### Obsługa odpowiedzi Claude

```typescript
// app/api/generate/route.ts

import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  // 1. Auth check
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Rate limit check
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (sub.plan === 'free' && sub.generations_used >= sub.generations_limit) {
    return Response.json({ error: 'limit_reached' }, { status: 402 })
  }

  // 3. Generate
  const { review, rating, platform, company } = await req.json()

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt({ review, rating, platform, company }) }]
  })

  const reply = message.content[0].type === 'text' ? message.content[0].text : ''

  // 4. Save + increment counter
  await supabase.from('generations').insert({
    company_id: companyId,
    review_text: review,
    review_rating: rating,
    review_platform: platform,
    reply_text: reply,
    tokens_used: message.usage.input_tokens + message.usage.output_tokens
  })

  await supabase.rpc('increment_generations', { company_id: companyId })

  return Response.json({ reply })
}
```

### Koszt na generację

| Model | Input (~400 tok) | Output (~200 tok) | Koszt |
|---|---|---|---|
| Claude Haiku 4 | $0.00025 | $0.00125 | **~$0.0015** |
| GPT-4o | $0.005 | $0.015 | ~$0.02 |

> Przy 1000 generacji miesięcznie: **$1.50 vs $20** — Claude Haiku wygrywa.

---

## 7. Integracje zewnętrzne

### 7.1 Stripe — płatności

```typescript
// lib/stripe.ts

export const PLANS = {
  free: {
    name: 'Starter',
    price: 0,
    generationsLimit: 5,
  },
  pro: {
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 79, // PLN
    generationsLimit: -1, // unlimited
  },
  agency: {
    name: 'Sieć / Agencja',
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID!,
    price: 199,
    generationsLimit: -1,
  }
}
```

**Webhook events do obsłużenia:**

```
checkout.session.completed    → aktywuj subskrypcję Pro
customer.subscription.updated → zmiana planu
customer.subscription.deleted → downgrade do Free
invoice.payment_failed        → email z alertem
```

### 7.2 Resend — emaile transakcyjne

Trzy emaile w MVP:

```
1. Powitanie po rejestracji
   - Temat: "Witaj w ReplyAI — zacznij odpowiadać mądrze"
   - Treść: link do onboardingu, 3 wskazówki

2. Limit osiągnięty (Free)
   - Temat: "Wykorzystałeś/aś 5 odpowiedzi w tym miesiącu"
   - Treść: korzyści Pro + link do upgrade

3. Potwierdzenie subskrypcji Pro
   - Temat: "Masz teraz nieograniczone odpowiedzi ✓"
   - Treść: potwierdzenie, link do faktury
```

### 7.3 Supabase Auth

Obsługiwane metody logowania w MVP:
- Email + hasło (obowiązkowe)
- Magic link przez email (opcjonalne — łatwe do dodania)
- Google OAuth (opcjonalne — v2)

---

## 8. Bezpieczeństwo i RODO

### Wymagania obowiązkowe przed launchem

- [ ] HTTPS wszędzie (Vercel zapewnia automatycznie)
- [ ] Row Level Security włączone na wszystkich tabelach
- [ ] Klucze API w zmiennych środowiskowych (nigdy w kodzie)
- [ ] Dane przechowywane w regionie EU (Supabase EU West)
- [ ] Polityka prywatności + regulamin przed rejestracją
- [ ] Checkbox zgody na przetwarzanie danych

### Zmienne środowiskowe

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
```

### Co NIE jest przechowywane

- Hasła (zarządza Supabase Auth)
- Numery kart (zarządza Stripe)
- Pełne dane osobowe klientów firm (tylko treść opinii)

---

## 9. Plan 8 tygodni

### Tydzień 1–2 — Fundament

**Cel: działa rejestracja, logowanie i onboarding**

```
☐ Setup projektu Next.js + Supabase + Vercel
☐ Schemat bazy danych + RLS policies
☐ Rejestracja i logowanie (email + hasło)
☐ Middleware auth guard dla /dashboard/*
☐ Onboarding — formularz profilu firmy (3 kroki)
☐ Layout dashboardu z nawigacją
```

**Definicja done tygodnia:** Można założyć konto, przejść onboarding i zobaczyć pusty dashboard.

---

### Tydzień 3–4 — Serce produktu

**Cel: działa generowanie odpowiedzi**

```
☐ Integracja Claude API (lib/anthropic.ts)
☐ System promptów + buildPrompt()
☐ Endpoint POST /api/generate z auth guard
☐ Formularz generatora (textarea + platforma + gwiazdki)
☐ Wyświetlanie odpowiedzi + przycisk "Kopiuj"
☐ Zapis generacji w bazie
☐ Licznik wykorzystania (X/5 generacji)
```

**Definicja done tygodnia:** Można wkleić opinię i dostać sensowną odpowiedź.

---

### Tydzień 5–6 — Monetyzacja

**Cel: działa płatność i upgrade**

```
☐ Konta Stripe (produkty, ceny PLN)
☐ Checkout session dla planu Pro i Agency
☐ Webhook handler (checkout.session.completed)
☐ Webhook handler (subscription.deleted)
☐ Blokada generacji po przekroczeniu limitu Free
☐ Strona /billing z aktualnym planem
☐ Stripe Customer Portal (zarządzanie subskrypcją)
☐ Emaile przez Resend (powitanie, limit, potwierdzenie)
```

**Definicja done tygodnia:** Można zapłacić kartą i dostać plan Pro.

---

### Tydzień 7 — Historia i szlify

**Cel: produkt gotowy do pokazania klientom**

```
☐ Strona /history z listą poprzednich odpowiedzi
☐ Edycja profilu firmy w /settings
☐ Obsługa błędów (timeout API, brak internetu)
☐ Loading states wszędzie
☐ Responsywność mobilna (dashboard używany na telefonie)
☐ Testy manualne pełnego flow: rejestracja → generacja → płatność
```

---

### Tydzień 8 — Launch

**Cel: produkt publicznie dostępny**

```
☐ Domena własna (np. replyai.pl)
☐ Sentry — monitoring błędów
☐ Regulamin + Polityka prywatności
☐ Strona statusu (opcjonalnie: status.replyai.pl)
☐ Pierwsze 10 emaili do potencjalnych klientów
☐ Post na LinkedIn / grupach Facebook restauratorów
☐ Aktualizacja landing page z linkiem do rejestracji
```

---

## 10. Podział zadań

### Osoba A — Frontend & UX

```
Tydzień 1-2:  Layout, nawigacja, formularze onboardingu
Tydzień 3-4:  Generator UI, output z kopiowaniem, licznik
Tydzień 5-6:  Strony billing, integracja Stripe Checkout (frontend)
Tydzień 7:    Historia, settings, responsywność, loading states
Tydzień 8:    Landing page aktualizacja, testy, szlify
```

### Osoba B — Backend & AI

```
Tydzień 1-2:  Supabase setup, schemat DB, RLS, auth middleware
Tydzień 3-4:  Claude API, prompt engineering, /api/generate
Tydzień 5-6:  Stripe webhooks, subskrypcje w DB, Resend emaile
Tydzień 7:    Obsługa błędów, rate limiting, monitoring Sentry
Tydzień 8:    Deployment produkcyjny, domena, zmienne env
```

### Spotkania synchronizacyjne

- **Daily standup:** 15 min codziennie (co robiłem, co będę robić, bloker)
- **Demo piątkowe:** 30 min — pokazujecie sobie nawzajem co zrobiliście
- **Planning poniedziałkowy:** 45 min — podział zadań na nowy tydzień

---

## 11. Definicja Done

Cały MVP jest skończony gdy:

- [ ] Użytkownik może się zarejestrować i przejść onboarding
- [ ] Użytkownik na planie Free ma limit 5 generacji/mies.
- [ ] Generacja odpowiedzi działa w < 5 sekund
- [ ] Użytkownik może przejść na plan Pro przez Stripe
- [ ] Użytkownik na Pro nie ma limitu generacji
- [ ] Użytkownik może zobaczyć historię ostatnich 30 odpowiedzi
- [ ] Aplikacja działa poprawnie na telefonie (375px+)
- [ ] Brak błędów krytycznych w Sentry przez 48h po launchu
- [ ] Trzech znajomych przetestowało produkt i nie mieli blokerów

---

## 12. Co odpuszczamy w MVP

Poniższe funkcje są **świadomie pominięte** — nie dlatego że nieważne, ale żeby nie opóźnić launchu.

| Funkcja | Dlaczego na później | Kiedy dodać |
|---|---|---|
| Auto-publikowanie w Google | Wymaga Google My Business API (weryfikacja firmy) | v2 po potwierdzeniu popytu |
| Analityka nastrojów | Ładne, ale nie decyduje o zakupie | v2 |
| Wielojęzyczny interfejs | MVP tylko PL, API i tak obsłuży EN | v2 |
| Aplikacja mobilna | PWA wystarczy na start | v3 |
| White-label | Złożone, małe zapotrzebowanie w MVP | v3 |
| Import opinii CSV | Niszowe, komplikuje UX | v2 |
| Team accounts | Jeden właściciel = jeden klient MVP | v2 |
| API dla zewnętrznych | Za wcześnie na ekosystem | v3 |

---

## Linki i zasoby

- [Next.js App Router docs](https://nextjs.org/docs)
- [Supabase Auth helpers dla Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Stripe Subscriptions quickstart](https://stripe.com/docs/billing/quickstart)
- [Claude API docs](https://docs.anthropic.com)
- [Resend Next.js integration](https://resend.com/docs/send-with-nextjs)
- [Shadcn/ui komponenty](https://ui.shadcn.com)

---

*Dokument żyjący — aktualizować po każdym tygodniu sprintu.*
