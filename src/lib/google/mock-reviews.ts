/**
 * Mock reviews dla trybu deweloperskiego.
 *
 * ⚠️  WYŁĄCZ PRZED PRODUKCJĄ!
 * Ustaw NEXT_PUBLIC_MOCK_GOOGLE_REVIEWS=false lub usuń zmienną.
 * Patrz: ReplyAI_MVP_Projekt_Techniczny.md — sekcja "Mock Google Reviews"
 */

export interface MockGoogleReview {
  id: string;
  google_review_id: string;
  reviewer_name: string;
  reviewer_photo_url: string | null;
  star_rating: number;
  comment: string | null;
  review_created_at: string;
  review_updated_at: string;
  reply_text: string | null;
  reply_updated_at: string | null;
  reply_source: string | null;
  generation_id: string | null;
  synced_at: string;
}

const now = new Date();
function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function uuid(n: number): string {
  return `mock-review-${String(n).padStart(3, "0")}`;
}

export const MOCK_REVIEWS: MockGoogleReview[] = [
  // ===== 5 gwiazdek (pozytywne) =====
  {
    id: uuid(1),
    google_review_id: "gr_001",
    reviewer_name: "Katarzyna Nowak",
    reviewer_photo_url: null,
    star_rating: 5,
    comment:
      "Najlepsza pizza w mieście! Ciasto cienkie i chrupiące, składniki świeże. Obsługa bardzo miła, polecam każdemu.",
    review_created_at: daysAgo(2),
    review_updated_at: daysAgo(2),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(2),
    google_review_id: "gr_002",
    reviewer_name: "Tomasz Wiśniewski",
    reviewer_photo_url: null,
    star_rating: 5,
    comment:
      "Byliśmy tu na urodzinach córki i wszystko było perfekcyjne. Jedzenie wyśmienite, atmosfera przytulna. Na pewno wrócimy!",
    review_created_at: daysAgo(5),
    review_updated_at: daysAgo(5),
    reply_text:
      "Dziękujemy za wizytę i ciepłe słowa! Cieszymy się, że urodziny córki były udane. Zapraszamy ponownie! — Marcin",
    reply_updated_at: daysAgo(4),
    reply_source: "google",
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(3),
    google_review_id: "gr_003",
    reviewer_name: "Magdalena Kowalczyk",
    reviewer_photo_url: null,
    star_rating: 5,
    comment:
      "Zamówiłam catering na firmowe spotkanie — 30 osób i wszyscy byli zachwyceni. Profesjonalna obsługa od A do Z.",
    review_created_at: daysAgo(8),
    review_updated_at: daysAgo(8),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(4),
    google_review_id: "gr_004",
    reviewer_name: "Piotr Zieliński",
    reviewer_photo_url: null,
    star_rating: 5,
    comment:
      "Rewelacyjne tiramisu! Dawno nie jadłem tak dobrego deseru. Kawa też na najwyższym poziomie.",
    review_created_at: daysAgo(12),
    review_updated_at: daysAgo(12),
    reply_text:
      "Panie Piotrze, bardzo dziękujemy! Tiramisu to nasz firmowy deser — cieszę się, że przypadło do gustu. Zapraszamy na kawę! — Marcin",
    reply_updated_at: daysAgo(11),
    reply_source: "replyai",
    generation_id: null,
    synced_at: daysAgo(0),
  },

  // ===== 4 gwiazdki (bardzo dobre) =====
  {
    id: uuid(5),
    google_review_id: "gr_005",
    reviewer_name: "Anna Lewandowska",
    reviewer_photo_url: null,
    star_rating: 4,
    comment:
      "Bardzo dobre jedzenie i miła atmosfera. Jedyny minus to trochę za długi czas oczekiwania na zamówienie (ok. 35 min). Poza tym super!",
    review_created_at: daysAgo(3),
    review_updated_at: daysAgo(3),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(6),
    google_review_id: "gr_006",
    reviewer_name: "Marek Kamiński",
    reviewer_photo_url: null,
    star_rating: 4,
    comment:
      "Solidna kuchnia włoska. Makaron al dente, sosy domowej roboty. Ceny adekwatne do jakości. Polecam spaghetti carbonara.",
    review_created_at: daysAgo(7),
    review_updated_at: daysAgo(7),
    reply_text:
      "Dziękujemy za pozytywną opinię! Carbonara to jeden z naszych bestsellerów — miło, że smakowała. Zapraszamy! — Marcin",
    reply_updated_at: daysAgo(6),
    reply_source: "google",
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(7),
    google_review_id: "gr_007",
    reviewer_name: "Ewa Szymańska",
    reviewer_photo_url: null,
    star_rating: 4,
    comment:
      "Przytulne wnętrze i dobra pizza. Mogłoby być więcej opcji wegetariańskich w menu, ale to co jest — jest naprawdę smaczne.",
    review_created_at: daysAgo(14),
    review_updated_at: daysAgo(14),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(8),
    google_review_id: "gr_008",
    reviewer_name: "Jakub Dąbrowski",
    reviewer_photo_url: null,
    star_rating: 4,
    comment:
      "Zamawiam regularnie na dowóz — pizza zawsze ciepła i dobrze zapakowana. Kurier punktualny. Brakuje tylko aplikacji do zamówień.",
    review_created_at: daysAgo(18),
    review_updated_at: daysAgo(18),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },

  // ===== 3 gwiazdki (średnie) =====
  {
    id: uuid(9),
    google_review_id: "gr_009",
    reviewer_name: "Michał Wójcik",
    reviewer_photo_url: null,
    star_rating: 3,
    comment:
      "Jedzenie OK, ale nic specjalnego. Margherita była poprawna, choć bez wow efektu. Lokal czysty, obsługa uprzejma.",
    review_created_at: daysAgo(4),
    review_updated_at: daysAgo(4),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(10),
    google_review_id: "gr_010",
    reviewer_name: "Joanna Kaczmarek",
    reviewer_photo_url: null,
    star_rating: 3,
    comment:
      "Przyszliśmy w piątek wieczorem i musieliśmy czekać 20 minut na stolik mimo rezerwacji. Jedzenie potem było dobre, ale to pierwsze wrażenie psuje odbiór.",
    review_created_at: daysAgo(10),
    review_updated_at: daysAgo(10),
    reply_text:
      "Pani Joanno, przepraszamy za niedogodność z rezerwacją. Piątkowe wieczory bywają intensywne, ale to nie usprawiedliwia opóźnienia. Poprawimy nasz system rezerwacji. Zapraszamy ponownie — następnym razem będzie lepiej! — Marcin",
    reply_updated_at: daysAgo(9),
    reply_source: "replyai",
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(11),
    google_review_id: "gr_011",
    reviewer_name: "Robert Mazur",
    reviewer_photo_url: null,
    star_rating: 3,
    comment:
      "Średnio. Pizza nieco za słona, a cola ciepła. Lokalizacja fajna, ale jakość mogłaby być lepsza jak na te ceny.",
    review_created_at: daysAgo(16),
    review_updated_at: daysAgo(16),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(12),
    google_review_id: "gr_012",
    reviewer_name: "Agnieszka Jankowska",
    reviewer_photo_url: null,
    star_rating: 3,
    comment:
      "Wnętrze ładne, ale muzyka za głośno — trudno było rozmawiać. Jedzenie smaczne, porcje mogłyby być większe.",
    review_created_at: daysAgo(21),
    review_updated_at: daysAgo(21),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },

  // ===== 2 gwiazdki (słabe) =====
  {
    id: uuid(13),
    google_review_id: "gr_013",
    reviewer_name: "Krzysztof Pawlak",
    reviewer_photo_url: null,
    star_rating: 2,
    comment:
      "Rozczarowanie. Zamówiłem pizzę pepperoni — ciasto surowe w środku, a pepperoni jak z najtańszego sklepu. Za 45 zł oczekiwałem więcej.",
    review_created_at: daysAgo(6),
    review_updated_at: daysAgo(6),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(14),
    google_review_id: "gr_014",
    reviewer_name: "Monika Grabowska",
    reviewer_photo_url: null,
    star_rating: 2,
    comment:
      "Kelner zapomniał o naszym zamówieniu i czekaliśmy godzinę. Przeprosiny były, ale wrażenie już zepsute. Jedzenie było ok, ale nie wrócę.",
    review_created_at: daysAgo(13),
    review_updated_at: daysAgo(13),
    reply_text:
      "Pani Moniko, jest nam bardzo przykro z powodu tej sytuacji. Godzinne oczekiwanie jest niedopuszczalne. Przeprowadziliśmy rozmowę z personelem i wdrożyliśmy nowy system zamówień. Chętnie zaprosimy Państwa na obiad na nasz koszt — proszę o kontakt mailowy. — Marcin",
    reply_updated_at: daysAgo(12),
    reply_source: "replyai",
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(15),
    google_review_id: "gr_015",
    reviewer_name: "Paweł Sikora",
    reviewer_photo_url: null,
    star_rating: 2,
    comment:
      "Toaleta brudna, na stoliku okruszki po poprzednich gościach. Nie czuję się komfortowo jedząc w takich warunkach.",
    review_created_at: daysAgo(20),
    review_updated_at: daysAgo(20),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(16),
    google_review_id: "gr_016",
    reviewer_name: "Natalia Woźniak",
    reviewer_photo_url: null,
    star_rating: 2,
    comment:
      "Pizza dostawowa przyjechała zimna i w rozjechanym pudełku. Dzwoniłam reklamować — nikt nie odebrał. Słaby serwis.",
    review_created_at: daysAgo(25),
    review_updated_at: daysAgo(25),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },

  // ===== 1 gwiazdka (negatywne) =====
  {
    id: uuid(17),
    google_review_id: "gr_017",
    reviewer_name: "Damian Kowalski",
    reviewer_photo_url: null,
    star_rating: 1,
    comment:
      "Tragedia. Po pizzy z owocami morza cała rodzina miała problemy żołądkowe. Nie polecam nikomu — kwestia bezpieczeństwa jedzenia.",
    review_created_at: daysAgo(9),
    review_updated_at: daysAgo(9),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(18),
    google_review_id: "gr_018",
    reviewer_name: "Aleksandra Zawadzka",
    reviewer_photo_url: null,
    star_rating: 1,
    comment:
      "Kelner był wręcz niegrzeczny — przewracał oczami gdy pytaliśmy o skład dań (mamy alergię pokarmową!). Nigdy więcej.",
    review_created_at: daysAgo(15),
    review_updated_at: daysAgo(15),
    reply_text:
      "Pani Aleksandro, jest nam niezmiernie przykro. Alergie pokarmowe to sprawa absolutnie poważna i nasz personel powinien to rozumieć. Przeprowadziliśmy dodatkowe szkolenie z obsługi alergików. Proszę dać nam szansę — chętnie zaprosimy Państwa ponownie. — Marcin",
    reply_updated_at: daysAgo(14),
    reply_source: "google",
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(19),
    google_review_id: "gr_019",
    reviewer_name: "Łukasz Adamczyk",
    reviewer_photo_url: null,
    star_rating: 1,
    comment:
      "Zamówiłem przez telefon, podali złe danie i jeszcze kazali dopłacić za poprawkę. Zero szacunku do klienta. OMIJAĆ.",
    review_created_at: daysAgo(22),
    review_updated_at: daysAgo(22),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
  {
    id: uuid(20),
    google_review_id: "gr_020",
    reviewer_name: "Sylwia Nowicka",
    reviewer_photo_url: null,
    star_rating: 1,
    comment: null,
    review_created_at: daysAgo(28),
    review_updated_at: daysAgo(28),
    reply_text: null,
    reply_updated_at: null,
    reply_source: null,
    generation_id: null,
    synced_at: daysAgo(0),
  },
];
