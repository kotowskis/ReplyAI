# Analiza integracji Google Business Profile API

> **Data:** Luty 2026 | **Autor:** Zespół ReplyAI
> **Cel:** Ocena możliwości integracji z Google Business Profile API (dawniej Google My Business API)

---

## Spis treści

1. [Stan API i ekosystem](#1-stan-api-i-ekosystem)
2. [Możliwości API kluczowe dla ReplyAI](#2-możliwości-api-kluczowe-dla-replyai)
3. [Autentykacja i autoryzacja](#3-autentykacja-i-autoryzacja)
4. [Reviews API — szczegóły techniczne](#4-reviews-api--szczegóły-techniczne)
5. [Powiadomienia o nowych opiniach](#5-powiadomienia-o-nowych-opiniach)
6. [Statystyki i metryki](#6-statystyki-i-metryki)
7. [Limity i koszty](#7-limity-i-koszty)
8. [Wymagania wdrożeniowe](#8-wymagania-wdrożeniowe)
9. [Proponowane funkcjonalności](#9-proponowane-funkcjonalności)
10. [Zmiany w bazie danych](#10-zmiany-w-bazie-danych)
11. [Nowe endpointy API](#11-nowe-endpointy-api)
12. [Ryzyka i ograniczenia](#12-ryzyka-i-ograniczenia)

---

## 1. Stan API i ekosystem

Monolityczne Google My Business API v4 zostało rozbite na **8 oddzielnych API v1**, z wyjątkiem Reviews API, które nadal działa na v4.

### API do włączenia w Google Cloud Console

| # | Nazwa API | Endpoint | Zastosowanie |
|---|-----------|----------|--------------|
| 1 | My Business Account Management API | `mybusinessaccountmanagement.googleapis.com` | Zarządzanie kontami i uprawnieniami |
| 2 | My Business Business Information API | `mybusinessbusinessinformation.googleapis.com` | Dane lokalizacji |
| 3 | My Business Notifications API | `mybusinessnotifications.googleapis.com` | Konfiguracja Pub/Sub |
| 4 | My Business Verifications API | `mybusinessverifications.googleapis.com` | Weryfikacja lokalizacji |
| 5 | My Business Lodging API | `mybusinesslodging.googleapis.com` | Dane noclegowe (hotele) |
| 6 | My Business Place Actions API | `mybusinessplaceactions.googleapis.com` | Linki rezerwacji |
| 7 | Business Profile Performance API | `businessprofileperformance.googleapis.com` | Statystyki i metryki |
| 8 | Google My Business API (v4) | `mybusiness.googleapis.com` | **Opinie**, posty, media |

### Kluczowe deprecjacje

| API | Status | Data |
|-----|--------|------|
| My Business Q&A API | Wycofane | 3 listopada 2025 |
| My Business Business Calls API | Wycofane | 30 maja 2023 |
| v4 reportInsights | Wycofane | Zastąpione przez Performance API |
| **v4 Reviews** | **Aktywne** | **Brak daty deprecjacji** |

### Dostęp do API

API jest **bramkowane** — nie jest publicznie dostępne. Wymagane kroki:
1. Złożenie wniosku przez [formularz GBP API](https://developers.google.com/my-business/content/prereqs) (opcja "Application for Basic API Access")
2. Google weryfikuje use case i przyznaje dostęp na poziomie projektu Cloud
3. Domyślny limit po zatwierdzeniu: **300 QPM** (zapytań na minutę)
4. QPM = 0 oznacza, że projekt nie został jeszcze zatwierdzony

---

## 2. Możliwości API kluczowe dla ReplyAI

| Funkcja | Możliwe? | API | Szczegóły |
|---------|----------|-----|-----------|
| **Pobieranie opinii** | TAK | v4 Reviews | Lista opinii z paginacją, sortowanie po `rating` lub `updateTime` |
| **Odpowiadanie na opinie** | TAK | v4 Reviews | `PUT .../reviews/{id}/reply` — publikacja odpowiedzi |
| **Usuwanie odpowiedzi** | TAK | v4 Reviews | `DELETE .../reviews/{id}/reply` |
| **Powiadomienia o nowych opiniach** | TAK | Notifications v1 | Google Cloud Pub/Sub (`NEW_REVIEW`, `UPDATED_REVIEW`) |
| **Statystyki lokalizacji** | TAK | Performance v1 | Wyświetlenia, kliknięcia, frazy wyszukiwania |
| **Lista kont** | TAK | Account Management v1 | Konta, admini, zaproszenia |
| **Lista lokalizacji** | TAK | Business Information v1 | Lokalizacje powiązane z kontem |
| **Weryfikacja lokalizacji** | TAK | Verifications v1 | Status weryfikacji (wymagany do odpowiadania) |

---

## 3. Autentykacja i autoryzacja

### Kluczowe ograniczenie: brak obsługi service accounts

Google Business Profile API **nie obsługuje service accounts**. Wymagana jest autentykacja OAuth 2.0 z konsentem rzeczywistego użytkownika (właściciel/manager profilu biznesowego).

### Wymagany scope OAuth

```
https://www.googleapis.com/auth/business.manage
```

Jeden scope obejmuje wszystkie operacje GBP API (odczyt i zapis).

### Flow OAuth 2.0 dla ReplyAI

```
1. Użytkownik klika "Połącz z Google" w ustawieniach
2. Redirect do Google Authorization Server z parametrami:
   - client_id
   - redirect_uri = /api/auth/google/callback
   - scope = business.manage
   - access_type = offline (dla refresh token)
   - prompt = consent
3. Użytkownik loguje się kontem Google i wyraża zgodę
4. Google redirectuje z authorization code
5. Backend wymienia code na access_token + refresh_token
6. Refresh token zapisywany (zaszyfrowany) w bazie danych
7. Access token odświeżany automatycznie (wygasa po ~1h)
```

### Przechowywanie tokenów

```
companies
  └── google_oauth_tokens (JSONB, zaszyfrowane)
        ├── access_token
        ├── refresh_token
        ├── expires_at
        └── token_type
```

Tokeny muszą być **szyfrowane at-rest** (np. AES-256-GCM z kluczem z env).

---

## 4. Reviews API — szczegóły techniczne

### Endpointy

| Operacja | Metoda | Endpoint |
|----------|--------|----------|
| Lista opinii | `GET` | `/v4/accounts/{accountId}/locations/{locationId}/reviews` |
| Pojedyncza opinia | `GET` | `/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}` |
| Batch pobranie | `POST` | `/v4/accounts/{accountId}/locations:batchGetReviews` |
| **Odpowiedz na opinię** | **`PUT`** | `/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply` |
| Usuń odpowiedź | `DELETE` | `/v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply` |

### Struktura obiektu Review

```json
{
  "name": "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}",
  "reviewId": "string",
  "reviewer": {
    "displayName": "string",
    "profilePhotoUrl": "string",
    "isAnonymous": false
  },
  "starRating": "FIVE",
  "comment": "Fantastyczne jedzenie i obsługa!",
  "createTime": "2026-02-15T14:30:00Z",
  "updateTime": "2026-02-15T14:30:00Z",
  "reviewReply": {
    "comment": "Dziękujemy za miłe słowa!",
    "updateTime": "2026-02-16T09:00:00Z"
  }
}
```

### Star Rating — enum stringowy

| Wartość | Gwiazdki |
|---------|----------|
| `"ONE"` | 1 |
| `"TWO"` | 2 |
| `"THREE"` | 3 |
| `"FOUR"` | 4 |
| `"FIVE"` | 5 |

### Parametry listy opinii

| Parametr | Typ | Opis |
|----------|-----|------|
| `pageSize` | int | Liczba opinii na stronę |
| `pageToken` | string | Token paginacji |
| `orderBy` | string | `"rating"`, `"rating desc"`, `"updateTime desc"` |

### Publikacja odpowiedzi

```http
PUT /v4/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply
Content-Type: application/json

{
  "comment": "Dziękujemy za opinię! Zapraszamy ponownie."
}
```

Tworzy odpowiedź jeśli nie istnieje, lub nadpisuje istniejącą. **Lokalizacja musi być zweryfikowana.**

---

## 5. Powiadomienia o nowych opiniach

### Mechanizm: Google Cloud Pub/Sub (nie tradycyjne webhooks)

#### Konfiguracja

1. Utworzyć temat Pub/Sub w projekcie Google Cloud
2. Nadać uprawnienia `pubsub.topics.publish` dla `mybusiness-api-pubsub@system.gserviceaccount.com`
3. Utworzyć subskrypcję (push do endpointu lub pull)
4. Powiązać temat z kontem GBP:

```http
PATCH /v1/accounts/{accountId}/notificationSetting?updateMask=notificationTypes,pubsubTopic

{
  "name": "accounts/{accountId}/notificationSetting",
  "pubsubTopic": "projects/{projectId}/topics/{topicName}",
  "notificationTypes": ["NEW_REVIEW", "UPDATED_REVIEW"]
}
```

### Typy powiadomień

| Typ | Opis |
|-----|------|
| `NEW_REVIEW` | Nowa opinia |
| `UPDATED_REVIEW` | Edytowana opinia |
| `GOOGLE_UPDATE` | Google sugeruje aktualizację danych firmy |
| `NEW_CUSTOMER_MEDIA` | Klient dodał zdjęcie |
| `DUPLICATE_LOCATION` | Wykryto duplikat lokalizacji |

### Ograniczenie

Jedno ustawienie powiadomień per konto, jeden temat Pub/Sub per konto. Powiadomienie informuje **którą lokalizację** dotyczy — trzeba pobrać szczegóły opinii osobno.

### Alternatywa: polling

Prostsze rozwiązanie na start — odpytywanie `reviews.list` co 15 minut z `orderBy=updateTime desc`. Przy limicie 300 QPM i umiarkowanej liczbie lokalizacji jest to wykonalne.

---

## 6. Statystyki i metryki

### Business Profile Performance API v1

```http
GET /v1/locations/{locationId}:fetchMultiDailyMetricsTimeSeries
    ?dailyMetrics=WEBSITE_CLICKS
    &dailyMetrics=CALL_CLICKS
    &dailyMetrics=BUSINESS_DIRECTION_REQUESTS
    &daily_range.start_date.year=2026&daily_range.start_date.month=1&daily_range.start_date.day=1
    &daily_range.end_date.year=2026&daily_range.end_date.month=2&daily_range.end_date.day=21
```

### Dostępne metryki dzienne

| Metryka | Opis |
|---------|------|
| `BUSINESS_IMPRESSIONS_DESKTOP_MAPS` | Wyświetlenia na Google Maps (desktop) |
| `BUSINESS_IMPRESSIONS_DESKTOP_SEARCH` | Wyświetlenia w wyszukiwarce (desktop) |
| `BUSINESS_IMPRESSIONS_MOBILE_MAPS` | Wyświetlenia na Maps (mobile) |
| `BUSINESS_IMPRESSIONS_MOBILE_SEARCH` | Wyświetlenia w wyszukiwarce (mobile) |
| `WEBSITE_CLICKS` | Kliknięcia w stronę WWW |
| `CALL_CLICKS` | Kliknięcia w numer telefonu |
| `BUSINESS_DIRECTION_REQUESTS` | Zapytania o trasę dojazdu |
| `BUSINESS_BOOKINGS` | Rezerwacje |
| `BUSINESS_FOOD_ORDERS` | Zamówienia jedzenia |
| `BUSINESS_CONVERSATIONS` | Wiadomości/konwersacje |

### Frazy wyszukiwania

```http
GET /v1/locations/{locationId}/searchkeywords/impressions/monthly
```

Zwraca miesięczny rozkład fraz, po których użytkownicy trafiali na profil firmy.

---

## 7. Limity i koszty

### Limity API

| Limit | Wartość |
|-------|---------|
| Domyślny QPM (po zatwierdzeniu) | 300 zapytań/min |
| Per-user limit | 2 400 zapytań/min/użytkownik |
| Edycje profilu | 10/min/profil (nie do zwiększenia) |
| Tworzenie lokalizacji | 100/dzień |
| Aktualizacja lokalizacji | 10 000/dzień |

### Kody błędów rate limit

| Kod | Błąd | Opis |
|-----|------|------|
| 403 | `userRateLimitExceeded` | Limit per-user |
| 403 | `quotaExceeded` | Limit równoczesnych zapytań |
| 429 | `rateLimitExceeded` | Ogólny limit QPM |

### Koszty

**API jest darmowe.** Brak opłat za zapytania ani za przesyłane dane.

### Zwiększenie limitów

- Wniosek przez formularz GBP API (opcja "Quota Increase Request")
- Google wymaga konsekwentnego wykorzystania >50-70% obecnego limitu
- Wymagane: exponential backoff i cache

---

## 8. Wymagania wdrożeniowe

### Konto Google Cloud

1. Projekt w Google Cloud Console
2. Włączone wymagane API (minimum: Account Management, Business Information, Reviews v4, Notifications)
3. OAuth 2.0 Client ID (typ: Web Application)
4. Consent screen skonfigurowany z domeną `replyai.pl`

### Zatwierdzenie dostępu do API

- Wniosek przez formularz z opisem use case
- Czas oczekiwania: typowo 1-3 tygodnie
- Wymagana domena biznesowa (nie gmail.com)

### Nowe zmienne środowiskowe

```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://replyai.pl/api/auth/google/callback

# Szyfrowanie tokenów
GOOGLE_TOKEN_ENCRYPTION_KEY=    # 32-byte klucz AES-256-GCM

# Pub/Sub (opcjonalne — dla real-time notyfikacji)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_PUBSUB_TOPIC=
```

---

## 9. Proponowane funkcjonalności

### Priorytet 1 — Połączenie konta Google

**Opis:** Użytkownik łączy swoje konto Google Business Profile z ReplyAI.

**Flow:**
1. Ustawienia → "Połącz z Google" → OAuth consent
2. Po autoryzacji: wyświetl listę kont → wybierz konto → wyświetl lokalizacje → wybierz lokalizację
3. Zapisz `google_account_id`, `google_location_id`, zaszyfrowane tokeny

**Wymagane:**
- Endpoint OAuth callback
- UI wyboru konta/lokalizacji
- Szyfrowanie tokenów w DB

---

### Priorytet 2 — Widok opinii Google z filtrowaniem

**Opis:** Dedykowana strona `/reviews` z opiniami pobranymi z Google.

**Funkcje:**
- Lista opinii z avatarami, gwiazdkami, treścią, datą
- **Filtrowanie po ocenie** (1-5 gwiazdek, wielokrotny wybór)
- **Filtrowanie po statusie** odpowiedzi (bez odpowiedzi / z odpowiedzią)
- **Sortowanie** po dacie lub ocenie
- Oznaczenie opinii bez odpowiedzi (alert: X opinii czeka na odpowiedź)
- Paginacja

**Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ Opinie Google                                           │
│                                                         │
│ Filtry: [★★★★★] [★★★★☆] [★★★☆☆] [★★☆☆☆] [★☆☆☆☆]     │
│         [Wszystkie ▾]  [Bez odpowiedzi ▾]              │
│         Sortuj: [Najnowsze ▾]                           │
│                                                         │
│  ⚠ 3 opinie czekają na odpowiedź                       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ★★★★★  Anna K.         15 lut 2026                 │ │
│ │ "Fantastyczne jedzenie, super obsługa!"             │ │
│ │                                                     │ │
│ │ [Generuj odpowiedź]  [Odpowiedz ręcznie]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ★★☆☆☆  Marek P.        14 lut 2026    ✓ Odpowiedziano │
│ │ "Długi czas oczekiwania, zimne jedzenie."           │ │
│ │                                                     │ │
│ │ Twoja odpowiedź:                                    │ │
│ │ "Dzień dobry, przepraszamy za niedogodności..."     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Synchronizacja:** Polling co 15 min (cron) lub on-demand (przycisk "Odśwież").

---

### Priorytet 3 — Generuj i opublikuj odpowiedź

**Opis:** Przy każdej opinii przycisk "Generuj odpowiedź" → AI tworzy tekst → użytkownik edytuje → "Opublikuj na Google".

**Flow:**
1. Kliknij "Generuj odpowiedź" przy opinii
2. AI generuje odpowiedź (istniejący system promptów)
3. Podgląd odpowiedzi z możliwością edycji (istniejący ReplyOutput)
4. Kliknij "Opublikuj na Google"
5. `PUT /v4/.../reviews/{id}/reply` → odpowiedź pojawia się w Google Maps
6. Status opinii zmienia się na "Odpowiedziano"

**Korzyść:** Użytkownik nie musi już kopiować odpowiedzi ręcznie — pełna automatyzacja od generacji do publikacji.

---

### Priorytet 4 — Dashboard opinii (statystyki)

**Opis:** Widżety na stronie głównej dashboardu z podsumowaniem opinii.

**Metryki:**
- Średnia ocen (ogólna i trend)
- Rozkład gwiazdek (wykres słupkowy)
- Liczba opinii bez odpowiedzi
- Średni czas odpowiedzi
- Trend opinii (ostatnie 30/90 dni)

**Mockup:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Średnia   │ │ Opinie   │ │  Bez     │ │ Śr. czas │
│  ★ 4.3   │ │  łącznie │ │odpowiedzi│ │odpowiedzi│
│  ↑ 0.2   │ │    127   │ │     3    │ │   2.1h   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

### Priorytet 5 — Powiadomienia o nowych opiniach

**Wariant A (prostszy):** Email przy nowej opinii — wysyłany przez cron-based polling.
**Wariant B (zaawansowany):** Pub/Sub push → natychmiastowy email + notyfikacja in-app.

Rekomendacja na start: **Wariant A** — prostszy, nie wymaga konfiguracji Pub/Sub.

---

### Priorytet 6 — Statystyki z Google (Performance API)

**Opis:** Strona `/analytics` z danymi z Google Business Profile Performance API.

**Dane:**
- Wyświetlenia profilu (Maps + Search, desktop + mobile)
- Kliknięcia: strona, telefon, nawigacja
- Popularne frazy wyszukiwania
- Wykres trendu (linia, ostatnie 30/90 dni)

---

## 10. Zmiany w bazie danych

### Nowa migracja: `00005_google_integration.sql`

```sql
-- Rozszerzenie tabeli companies o dane Google
ALTER TABLE companies
  ADD COLUMN google_account_id    TEXT,           -- np. "accounts/123456789"
  ADD COLUMN google_location_id   TEXT,           -- np. "locations/987654321"
  ADD COLUMN google_location_name TEXT,           -- "Pizzeria Da Vinci - Kraków"
  ADD COLUMN google_oauth_tokens  TEXT,           -- zaszyfrowany JSON (AES-256-GCM)
  ADD COLUMN google_connected_at  TIMESTAMPTZ;

-- Indeks do szybkiego wyszukiwania połączonych firm
CREATE INDEX idx_companies_google ON companies(google_account_id)
  WHERE google_account_id IS NOT NULL;

-- Tabela cache'u opinii Google
CREATE TABLE google_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  google_review_id    TEXT NOT NULL,             -- ID opinii z Google
  reviewer_name       TEXT,
  reviewer_photo_url  TEXT,
  star_rating         INT NOT NULL,             -- 1-5
  comment             TEXT,
  review_created_at   TIMESTAMPTZ,
  review_updated_at   TIMESTAMPTZ,
  reply_text          TEXT,                     -- odpowiedź właściciela (z Google)
  reply_updated_at    TIMESTAMPTZ,
  reply_source        TEXT DEFAULT 'google',    -- 'google' | 'replyai'
  generation_id       UUID REFERENCES generations(id), -- jeśli odpowiedź wygenerowana przez ReplyAI
  synced_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, google_review_id)
);

-- Indeksy dla filtrowania i sortowania
CREATE INDEX idx_google_reviews_company ON google_reviews(company_id);
CREATE INDEX idx_google_reviews_rating ON google_reviews(company_id, star_rating);
CREATE INDEX idx_google_reviews_unreplied ON google_reviews(company_id)
  WHERE reply_text IS NULL;
CREATE INDEX idx_google_reviews_synced ON google_reviews(synced_at DESC);

-- RLS
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own google reviews"
  ON google_reviews FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admins can read all google reviews"
  ON google_reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 11. Nowe endpointy API

### Autentykacja Google

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/auth/google` | Redirect do Google OAuth consent screen |
| GET | `/api/auth/google/callback` | Callback OAuth — wymiana code na tokeny |
| POST | `/api/google/disconnect` | Odłączenie konta Google (usunięcie tokenów) |

### Zarządzanie kontem Google

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/google/accounts` | Lista kont GBP użytkownika |
| GET | `/api/google/locations` | Lista lokalizacji wybranego konta |
| POST | `/api/google/select-location` | Zapisz wybraną lokalizację |

### Opinie

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/google/reviews` | Lista opinii (z filtrami i paginacją) |
| POST | `/api/google/reviews/sync` | Wymuszenie synchronizacji opinii |
| POST | `/api/google/reviews/{id}/publish` | Opublikuj odpowiedź na Google |
| DELETE | `/api/google/reviews/{id}/reply` | Usuń odpowiedź z Google |

### Statystyki

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/google/performance` | Metryki lokalizacji (wyświetlenia, kliknięcia) |
| GET | `/api/google/keywords` | Frazy wyszukiwania |

---

## 12. Ryzyka i ograniczenia

### Ryzyka wysokie

| Ryzyko | Wpływ | Mitigacja |
|--------|-------|-----------|
| **Odrzucenie wniosku o dostęp do API** | Blokuje całą integrację | Dokładnie opisać use case; złożyć wniosek wcześnie |
| **Brak service accounts** | Każdy user musi się autoryzować osobno | Intuicyjny flow OAuth, jasna komunikacja co i dlaczego |
| **Wycofanie Reviews v4** | Utrata głównej funkcji | Monitorować deprecation schedule; API jest aktywne bez daty wycofania |

### Ryzyka średnie

| Ryzyko | Wpływ | Mitigacja |
|--------|-------|-----------|
| Refresh token wygaśnie/zostanie odwołany | Użytkownik traci połączenie | Wykrywanie błędów 401, UI "Połącz ponownie" |
| Rate limit 300 QPM przy wzroście | Opóźnienia synchronizacji | Cache opinii w DB, inteligentny polling, wniosek o wyższy limit |
| Opóźnienie Pub/Sub | Powiadomienia nie w real-time | Polling jako fallback |

### Ograniczenia

- Lokalizacja **musi być zweryfikowana** w Google, żeby publikować odpowiedzi
- Jedno ustawienie Pub/Sub per konto (nie per lokalizacja)
- Brak sandboxa — testowanie tylko na prawdziwych danych
- Google może zmienić strukturę API bez dużego wyprzedzenia

---

*Dokument referencyjny — aktualizować w miarę postępu integracji.*
