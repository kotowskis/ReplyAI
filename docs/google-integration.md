# Integracja Google Business Profile — Dokumentacja techniczna

> **Wersja:** 1.0 | **Data:** Luty 2026 | **Sprint:** Tydzień 9-10
> **Status:** Zaimplementowane (OAuth + konta + lokalizacje)

---

## Spis treści

1. [Architektura](#1-architektura)
2. [Nowe pliki](#2-nowe-pliki)
3. [Zmienne środowiskowe](#3-zmienne-środowiskowe)
4. [Migracja bazy danych](#4-migracja-bazy-danych)
5. [OAuth 2.0 — flow autoryzacji](#5-oauth-20--flow-autoryzacji)
6. [Szyfrowanie tokenów](#6-szyfrowanie-tokenów)
7. [Endpointy API](#7-endpointy-api)
8. [Komponenty UI](#8-komponenty-ui)
9. [Zarządzanie tokenami](#9-zarządzanie-tokenami)
10. [Obsługa błędów](#10-obsługa-błędów)
11. [Bezpieczeństwo](#11-bezpieczeństwo)
12. [Konfiguracja Google Cloud](#12-konfiguracja-google-cloud)
13. [Testowanie lokalne](#13-testowanie-lokalne)

---

## 1. Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                     PRZEGLĄDARKA                             │
│                                                              │
│  AccountTabs → zakładka "Google"                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ GoogleConnection     │  │ GoogleLocationSelector       │ │
│  │ Section              │  │ (modal: konta → lokalizacje) │ │
│  └──────────┬───────────┘  └──────────────┬───────────────┘ │
└─────────────┼──────────────────────────────┼─────────────────┘
              │                              │
              │ fetch()                      │ fetch()
              ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                         │
│                                                              │
│  /api/auth/google          → redirect do Google consent      │
│  /api/auth/google/callback → wymiana code na tokeny          │
│  /api/google/accounts      → lista kont GBP                 │
│  /api/google/locations     → lista lokalizacji               │
│  /api/google/select-location → zapis wybranej lokalizacji   │
│  /api/google/disconnect    → odłączenie konta                │
│                                                              │
│  Wspólne: auth check → token decrypt → auto-refresh →        │
│           Google API call → zapis odświeżonych tokenów       │
└──────┬───────────────────────────┬───────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────┐          ┌────────────────────────────────────┐
│  SUPABASE    │          │  GOOGLE APIs                       │
│              │          │                                    │
│  companies   │          │  Account Management API v1         │
│  (tokeny,    │          │  Business Information API v1       │
│   lokalizacja│          │  OAuth 2.0 Token Endpoint          │
│   konto)     │          │                                    │
└──────────────┘          └────────────────────────────────────┘
```

---

## 2. Nowe pliki

### Biblioteki (`src/lib/google/`)

| Plik | Opis |
|------|------|
| `crypto.ts` | Szyfrowanie/deszyfrowanie tokenów OAuth (AES-256-GCM) |
| `client.ts` | Klient Google API: OAuth flow, token management, GBP API calls |

### Endpointy API (`src/app/api/`)

| Plik | Metoda | Opis |
|------|--------|------|
| `auth/google/route.ts` | GET | Redirect do Google OAuth consent screen |
| `auth/google/callback/route.ts` | GET | Callback OAuth — wymiana code na tokeny |
| `google/accounts/route.ts` | GET | Lista kont Google Business Profile |
| `google/locations/route.ts` | GET | Lista lokalizacji wybranego konta |
| `google/select-location/route.ts` | POST | Zapis wybranej lokalizacji w DB |
| `google/disconnect/route.ts` | POST | Odłączenie konta Google (czyszczenie tokenów) |

### Komponenty UI (`src/components/`)

| Plik | Opis |
|------|------|
| `GoogleConnectionSection.tsx` | Status połączenia, connect/disconnect, wyświetlanie lokalizacji |
| `GoogleLocationSelector.tsx` | Modal dwuetapowy: wybór konta → wybór lokalizacji |

### Migracja DB (`supabase/migrations/`)

| Plik | Opis |
|------|------|
| `00005_google_integration.sql` | Nowe kolumny w `companies` + tabela `google_reviews` |

### Zmodyfikowane pliki

| Plik | Zmiany |
|------|--------|
| `.env.example` | Dodane 4 nowe zmienne Google |
| `src/app/(dashboard)/account/page.tsx` | Pobieranie pól Google z `companies`, maskowanie tokenów |
| `src/components/AccountTabs.tsx` | Nowa zakładka "Google", import `GoogleConnectionSection` |

---

## 3. Zmienne środowiskowe

Dodane w `.env.example`:

```bash
# Google Business Profile OAuth
GOOGLE_CLIENT_ID=           # OAuth 2.0 Client ID z Google Cloud Console
GOOGLE_CLIENT_SECRET=       # OAuth 2.0 Client Secret
GOOGLE_REDIRECT_URI=        # http://localhost:3000/api/auth/google/callback (dev)
                            # https://replyai.pl/api/auth/google/callback (prod)

# Klucz szyfrowania tokenów OAuth w bazie danych
GOOGLE_TOKEN_ENCRYPTION_KEY=  # 32-byte base64, generuj:
                              # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Ważne:** `GOOGLE_TOKEN_ENCRYPTION_KEY` jest stały dla całej instalacji. Zmiana klucza unieważnia wszystkie zapisane tokeny — użytkownicy muszą ponownie połączyć konta Google.

---

## 4. Migracja bazy danych

### Plik: `supabase/migrations/00005_google_integration.sql`

### 4.1 Nowe kolumny w `companies`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `google_account_id` | TEXT | ID konta GBP, np. `"accounts/123456789"` |
| `google_location_id` | TEXT | ID lokalizacji, np. `"locations/987654321"` |
| `google_location_name` | TEXT | Nazwa lokalizacji wyświetlana w UI, np. `"Pizzeria Da Vinci"` |
| `google_oauth_tokens` | TEXT | Zaszyfrowane tokeny OAuth (AES-256-GCM, base64) |
| `google_connected_at` | TIMESTAMPTZ | Data/czas połączenia konta Google |

Indeks warunkowy: `idx_companies_google` na `google_account_id WHERE IS NOT NULL`.

### 4.2 Nowa tabela `google_reviews`

Przygotowana na tydzień 11-12 (cache opinii Google):

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | UUID PK | Klucz główny |
| `company_id` | UUID FK → companies | Firma właściciel |
| `google_review_id` | TEXT UNIQUE(+company) | ID opinii z Google |
| `reviewer_name` | TEXT | Nazwa autora opinii |
| `reviewer_photo_url` | TEXT | URL awatara |
| `star_rating` | INT (1-5) | Ocena gwiazdkowa |
| `comment` | TEXT | Treść opinii |
| `review_created_at` | TIMESTAMPTZ | Data utworzenia opinii w Google |
| `review_updated_at` | TIMESTAMPTZ | Data ostatniej edycji opinii |
| `reply_text` | TEXT | Treść odpowiedzi właściciela |
| `reply_updated_at` | TIMESTAMPTZ | Data odpowiedzi |
| `reply_source` | TEXT | `'google'` (ręczna) lub `'replyai'` (wygenerowana) |
| `generation_id` | UUID FK → generations | Powiązanie z generacją AI |
| `synced_at` | TIMESTAMPTZ | Ostatnia synchronizacja |

**Indeksy:**
- `idx_google_reviews_company` — wyszukiwanie po firmie
- `idx_google_reviews_rating` — filtrowanie po ocenie (composite: company + rating)
- `idx_google_reviews_unreplied` — opinie bez odpowiedzi (partial: WHERE reply_text IS NULL)
- `idx_google_reviews_synced` — sortowanie po dacie synchronizacji

**RLS:** Users widzą opinie swoich firm, admini widzą wszystkie (SELECT).

### Uruchomienie migracji

```bash
# W Supabase SQL Editor:
# Wklej zawartość supabase/migrations/00005_google_integration.sql
```

---

## 5. OAuth 2.0 — flow autoryzacji

### Diagram przepływu

```
    Użytkownik                ReplyAI                    Google
    ─────────                ───────                    ──────
         │                       │                          │
    1.   │ Klik "Połącz z Google"│                          │
         │──────────────────────>│                          │
         │                       │                          │
    2.   │                       │ Generuj state token      │
         │                       │ Zapisz w cookie          │
         │                       │                          │
    3.   │ Redirect 302          │                          │
         │<──────────────────────│                          │
         │                       │                          │
    4.   │ GET consent screen ──────────────────────────────>│
         │                       │                          │
    5.   │ Użytkownik wyraża zgodę                          │
         │<──────────────────────────────────────── code ───│
         │                       │                          │
    6.   │ GET /callback?code=...&state=...                 │
         │──────────────────────>│                          │
         │                       │                          │
    7.   │                       │ Sprawdź state (CSRF)     │
         │                       │                          │
    8.   │                       │ POST /token {code} ──────>│
         │                       │<── access + refresh token│
         │                       │                          │
    9.   │                       │ Zaszyfruj tokeny         │
         │                       │ Zapisz w companies       │
         │                       │                          │
   10.   │ Redirect /account?tab=google&step=select         │
         │<──────────────────────│                          │
         │                       │                          │
   11.   │ Otwiera się modal     │                          │
         │ wyboru lokalizacji    │                          │
```

### Parametry OAuth

```
client_id:     GOOGLE_CLIENT_ID
redirect_uri:  GOOGLE_REDIRECT_URI
response_type: code
scope:         https://www.googleapis.com/auth/business.manage
access_type:   offline        ← wymusza wydanie refresh_token
prompt:        consent        ← zawsze pokazuje consent screen
state:         <random 32B hex> ← CSRF protection
```

### Plik: `src/app/api/auth/google/route.ts`

1. Sprawdza auth (Supabase session)
2. Generuje losowy `state` (32 bajty hex)
3. Zapisuje `state` w cookie `google_oauth_state` (HttpOnly, 10 min TTL)
4. Redirect do `accounts.google.com/o/oauth2/v2/auth`

### Plik: `src/app/api/auth/google/callback/route.ts`

1. Odczytuje `code`, `state`, `error` z query string
2. Porównuje `state` z cookie → jeśli nie pasuje = błąd CSRF
3. Usuwa cookie `google_oauth_state`
4. Sprawdza auth (Supabase session)
5. Wymienia `code` na tokeny (`exchangeCodeForTokens`)
6. Szyfruje tokeny (`encryptTokens`)
7. Zapisuje w `companies.google_oauth_tokens` + ustawia `google_connected_at`
8. Redirect do `/account?tab=google&step=select` → otwiera modal wyboru lokalizacji

---

## 6. Szyfrowanie tokenów

### Plik: `src/lib/google/crypto.ts`

**Algorytm:** AES-256-GCM (authenticated encryption)

**Format danych w bazie:** `base64(IV || ciphertext || authTag)`

| Segment | Rozmiar | Opis |
|---------|---------|------|
| IV (Initialization Vector) | 12 bajtów | Losowy per-szyfrowanie |
| Ciphertext | N bajtów | Zaszyfrowany JSON tokenów |
| Auth Tag | 16 bajtów | Tag integralności GCM |

**Struktura tokenu (przed szyfrowaniem):**

```typescript
interface GoogleOAuthTokens {
  access_token: string;   // Token dostępu (~1h ważności)
  refresh_token: string;  // Token odświeżania (długoterminowy)
  expires_at: number;     // Unix timestamp (ms) wygaśnięcia access_token
  token_type: string;     // "Bearer"
}
```

**Klucz szyfrowania:**
- Przechowywany w `GOOGLE_TOKEN_ENCRYPTION_KEY` (env)
- Format: base64-encoded, 32 bajty (256 bitów)
- Generowanie: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Funkcje

```typescript
encryptTokens(tokens: GoogleOAuthTokens): string
// → base64 string do zapisu w DB

decryptTokens(encryptedData: string): GoogleOAuthTokens
// → odszyfrowany obiekt tokenów
```

---

## 7. Endpointy API

### GET `/api/auth/google`

Inicjuje OAuth flow. Redirect do Google consent screen.

**Auth:** wymagana sesja Supabase
**Parametry:** brak
**Odpowiedź:** HTTP 302 redirect

---

### GET `/api/auth/google/callback`

Callback po autoryzacji Google.

**Auth:** wymagana sesja Supabase
**Parametry (query string):**
| Param | Opis |
|-------|------|
| `code` | Authorization code z Google |
| `state` | Token CSRF (musi zgadzać się z cookie) |
| `error` | Opcjonalny kod błędu (np. `access_denied`) |

**Odpowiedź:** redirect do `/account?tab=google&step=select` lub `&error=...`

---

### GET `/api/google/accounts`

Pobiera konta Google Business Profile użytkownika.

**Auth:** wymagana sesja Supabase + połączone konto Google
**Parametry:** brak

**Odpowiedź 200:**
```json
{
  "accounts": [
    {
      "id": "accounts/123456789",
      "name": "Moja Firma Sp. z o.o.",
      "type": "ORGANIZATION"
    }
  ]
}
```

**Typy kont:** `PERSONAL` | `ORGANIZATION` | `LOCATION_GROUP`

**Błędy:**
| HTTP | Kod | Kiedy |
|------|-----|-------|
| 400 | `google_not_connected` | Brak tokenów Google |
| 401 | `google_token_expired` | Token wygasł i refresh failed |
| 500 | `server_error` | Błąd API Google |

---

### GET `/api/google/locations?accountId=accounts/123`

Pobiera lokalizacje dla wybranego konta GBP.

**Auth:** wymagana sesja Supabase + połączone konto Google
**Parametry:**
| Param | Typ | Wymagany | Opis |
|-------|-----|----------|------|
| `accountId` | string | tak | ID konta, np. `accounts/123456789` |

**Odpowiedź 200:**
```json
{
  "locations": [
    {
      "id": "locations/987654321",
      "title": "Pizzeria Da Vinci",
      "address": "ul. Floriańska 15, Kraków, 31-019",
      "websiteUri": "https://pizzeriadavinci.pl"
    }
  ]
}
```

**Błędy:** jak `/api/google/accounts`

---

### POST `/api/google/select-location`

Zapisuje wybraną lokalizację w profilu firmy.

**Auth:** wymagana sesja Supabase + połączone konto Google
**Body:**
```json
{
  "accountId": "accounts/123456789",
  "locationId": "locations/987654321",
  "locationName": "Pizzeria Da Vinci"
}
```

**Odpowiedź 200:**
```json
{ "success": true }
```

---

### POST `/api/google/disconnect`

Odłącza konto Google — czyści tokeny i dane lokalizacji.

**Auth:** wymagana sesja Supabase
**Body:** brak

**Odpowiedź 200:**
```json
{ "success": true }
```

**Pola czyszczone w `companies`:**
- `google_account_id` → `null`
- `google_location_id` → `null`
- `google_location_name` → `null`
- `google_oauth_tokens` → `null`
- `google_connected_at` → `null`

---

## 8. Komponenty UI

### GoogleConnectionSection

**Plik:** `src/components/GoogleConnectionSection.tsx`
**Typ:** Client Component (`"use client"`)

**Props:**
| Prop | Typ | Opis |
|------|-----|------|
| `companyId` | string | ID firmy |
| `isConnected` | boolean | Czy konto Google jest połączone |
| `locationName` | string \| null | Nazwa wybranej lokalizacji |
| `connectedAt` | string \| null | Data połączenia (ISO) |
| `showSelector` | boolean | Automatycznie otwórz modal selekcji |
| `oauthError` | string \| null | Kod błędu OAuth z query string |

**Stany widoku:**

1. **Niepołączony:** przycisk "Połącz z Google" (link do `/api/auth/google`)
2. **Połączony bez lokalizacji:** status "Połączono" + przycisk "Wybierz lokalizację"
3. **Połączony z lokalizacją:** status "Połączono" + nazwa lokalizacji + "Zmień" + "Odłącz"
4. **Odłączony (po disconnect):** komunikat + przycisk ponownego połączenia
5. **Błąd OAuth:** komunikat z opisem błędu

**Obsługiwane kody błędów:**
| Kod | Komunikat |
|-----|-----------|
| `oauth_cancelled` | Autoryzacja została anulowana. |
| `oauth_start_failed` | Nie udało się rozpocząć autoryzacji Google. |
| `missing_params` | Brakujące parametry w odpowiedzi Google. |
| `invalid_state` | Nieprawidłowy token bezpieczeństwa. Spróbuj ponownie. |
| `no_company` | Nie znaleziono firmy. Przejdź onboarding. |
| `save_failed` | Nie udało się zapisać tokenów. Spróbuj ponownie. |
| `callback_failed` | Wystąpił błąd podczas autoryzacji. Spróbuj ponownie. |

---

### GoogleLocationSelector

**Plik:** `src/components/GoogleLocationSelector.tsx`
**Typ:** Client Component (`"use client"`)

**Props:**
| Prop | Typ | Opis |
|------|-----|------|
| `onSelect` | `(locationName: string) => void` | Callback po wyborze lokalizacji |
| `onClose` | `() => void` | Callback zamknięcia modala |

**Dwuetapowy flow:**

```
Krok 1: Lista kont GBP                    Krok 2: Lista lokalizacji
┌────────────────────────────┐            ┌────────────────────────────┐
│ Wybierz konto Google       │            │ Wybierz lokalizację        │
│                            │            │ ← Wróć do wyboru konta     │
│ ┌────────────────────────┐ │  kliknij   │ ┌────────────────────────┐ │
│ │ 🏢 Moja Firma Sp. z o.o.│ ├──────────>│ │ 📍 Pizzeria Da Vinci   │ │
│ │    Organizacja         │ │            │ │    ul. Floriańska 15   │ │
│ └────────────────────────┘ │            │ └────────────────────────┘ │
│                            │            │ ┌────────────────────────┐ │
│ ┌────────────────────────┐ │            │ │ 📍 Pizzeria Da Vinci 2 │ │
│ │ 👤 Jan Kowalski        │ │            │ │    ul. Dietla 40       │ │
│ │    Konto osobiste      │ │            │ └────────────────────────┘ │
│ └────────────────────────┘ │            │                            │
└────────────────────────────┘            └────────────────────────────┘
```

**Optymalizacja:** jeśli jest tylko 1 konto, pomija krok 1 i od razu pobiera lokalizacje.

**Obsługa wygasłych tokenów:** wyświetla dedykowany dialog z przyciskiem "Połącz ponownie" → redirect do `/api/auth/google`.

---

## 9. Zarządzanie tokenami

### Plik: `src/lib/google/client.ts`

### Auto-refresh

Każdy endpoint korzystający z Google API wywołuje `getValidAccessToken()`:

```
1. Odszyfruj tokeny z bazy
2. Sprawdź expires_at vs. now + 5 min bufor
3a. Token ważny → zwróć access_token
3b. Token wygasł → odśwież przez refresh_token
4. Zaszyfruj nowe tokeny
5. Zwróć access_token + updatedEncryptedTokens (do zapisu w DB)
```

### Zapis odświeżonych tokenów

Endpointy API po wywołaniu `getValidAccessToken()` sprawdzają `updatedEncryptedTokens`:
```typescript
if (updatedEncryptedTokens) {
  await supabase.from("companies")
    .update({ google_oauth_tokens: updatedEncryptedTokens })
    .eq("id", company.id);
}
```

### Cascade błędów

```
refresh_token odwołany/wygasły
  → refreshAccessToken() rzuca GoogleTokenExpiredError
    → endpoint API zwraca { error: "google_token_expired" } (401)
      → GoogleLocationSelector pokazuje dialog "Połącz ponownie"

access_token wygasł (HTTP 401 z Google API)
  → listAccounts() / listLocations() rzuca GoogleTokenExpiredError
    → endpoint API zwraca { error: "google_token_expired" } (401)
      → UI jak wyżej
```

---

## 10. Obsługa błędów

### Warstwa backend → frontend

| Źródło błędu | HTTP | Kod error | Komunikat PL |
|---------------|------|-----------|--------------|
| Brak sesji Supabase | 401 | `Unauthorized` | — (redirect do /login) |
| Brak tokenów Google | 400 | `google_not_connected` | Google nie jest połączony |
| Token wygasł/odwołany | 401 | `google_token_expired` | Sesja Google wygasła. Połącz konto ponownie. |
| Google API error | 500 | `server_error` | Nie udało się pobrać kont/lokalizacji Google. |
| OAuth anulowany | 302 | `oauth_cancelled` | Autoryzacja została anulowana. |
| CSRF state mismatch | 302 | `invalid_state` | Nieprawidłowy token bezpieczeństwa. |
| Brak firmy | 400 | — | Nie znaleziono firmy |
| Brak wymaganych pól | 400 | — | accountId, locationId i locationName są wymagane |

### Warstwa OAuth callback

Błędy OAuth nie są zwracane jako JSON — callback robi redirect do `/account?tab=google&error=<kod>`, a `GoogleConnectionSection` wyświetla komunikat.

---

## 11. Bezpieczeństwo

### Szyfrowanie tokenów at-rest

- Algorytm: AES-256-GCM (authenticated encryption z integrity check)
- Klucz: 256-bitowy, przechowywany wyłącznie w zmiennych środowiskowych
- Losowy IV per szyfrowanie (12 bajtów) — zapobiega pattern analysis
- Auth Tag (16 bajtów) — wykrywa manipulację zaszyfrowanych danych

### CSRF protection na OAuth

- Losowy `state` token (32 bajty hex) generowany per-request
- Zapisywany w HttpOnly cookie (nie w URL/localStorage)
- TTL: 10 minut
- Weryfikacja: callback porównuje `state` z query z wartością z cookie
- Cookie usuwana po weryfikacji (jednorazowa)

### Brak wycieku tokenów do klienta

Account page zamienia zaszyfrowane tokeny na flagę przed przekazaniem do React:
```typescript
google_oauth_tokens: companyRaw.google_oauth_tokens ? "__connected__" : null,
```

### RLS

Tabela `google_reviews` ma Row Level Security:
- Users: SELECT/INSERT/UPDATE na opiniach swoich firm
- Admins: SELECT na wszystkich opiniach

### Cookie security

```typescript
{
  httpOnly: true,                          // nie dostępne z JS
  secure: process.env.NODE_ENV === "production",  // HTTPS only w prod
  sameSite: "lax",                         // ochrona CSRF
  maxAge: 600,                             // 10 minut
  path: "/",
}
```

---

## 12. Konfiguracja Google Cloud

### Wymagane kroki

1. **Google Cloud Console** → utwórz projekt lub użyj istniejącego
2. **APIs & Services → Library** → włącz:
   - My Business Account Management API
   - My Business Business Information API
3. **APIs & Services → Credentials** → utwórz OAuth 2.0 Client:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (dev) + domena produkcyjna
4. **OAuth consent screen**:
   - User type: **External**
   - App name: ReplyAI
   - Scopes: `business.manage`
   - Zweryfikuj domenę (jeśli produkcja)
5. **Skopiuj Client ID i Client Secret** do `.env.local`

### Wniosek o dostęp do API

Google Business Profile API jest bramkowane. Po konfiguracji projektu:
1. Wejdź na [GBP API prerequisites](https://developers.google.com/my-business/content/prereqs)
2. Wypełnij formularz "Application for Basic API Access"
3. Czas oczekiwania: 1-3 tygodnie
4. Domyślny limit po zatwierdzeniu: 300 QPM

---

## 13. Testowanie lokalne

### Przygotowanie

```bash
# 1. Wygeneruj klucz szyfrowania
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. Dodaj do .env.local
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=<wygenerowany klucz>

# 3. Uruchom migrację w Supabase SQL Editor
# (wklej zawartość supabase/migrations/00005_google_integration.sql)

# 4. Uruchom dev server
npm run dev
```

### Test flow

1. Zaloguj się do ReplyAI
2. Przejdź do **Konto → Google**
3. Klik **"Połącz z Google"**
4. Zaloguj się kontem Google z dostępem do GBP
5. Wybierz konto → lokalizację
6. Sprawdź czy lokalizacja wyświetla się w zakładce Google
7. Klik **"Odłącz konto Google"** → potwierdź
8. Sprawdź czy status wrócił do "Niepołączony"

### Testowanie obsługi błędów

- **Anulowanie OAuth:** na consent screen kliknij "Cancel" → sprawdź komunikat
- **Token expired:** w Supabase ręcznie wyedytuj `google_oauth_tokens` na `"invalid"` → kliknij "Wybierz lokalizację" → sprawdź dialog "Połącz ponownie"
- **Brak kont GBP:** użyj konta Google bez profili biznesowych → sprawdź empty state

---

*Dokumentacja aktualizowana wraz z postępem integracji. Następny etap: Tydzień 11-12 (pobieranie opinii + widok z filtrami).*
