import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Polityka prywatności — ReplyAI",
  description: "Polityka prywatności serwisu ReplyAI",
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-zinc-900">
            ReplyAI
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Strona główna
        </Link>

        <h1 className="text-3xl font-bold text-zinc-900">
          Polityka prywatności
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ostatnia aktualizacja: 21 lutego 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
          {/* §1 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §1. Administrator danych
            </h2>
            <p className="mt-3">
              Administratorem danych osobowych jest [Nazwa firmy], z siedzibą
              w [Adres], NIP: [NIP], REGON: [REGON] (dalej: „Administrator").
              Kontakt z Administratorem możliwy jest pod adresem e-mail:
              [adres e-mail kontaktowy].
            </p>
          </section>

          {/* §2 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §2. Zakres zbieranych danych
            </h2>
            <p className="mt-3">
              W ramach korzystania z Serwisu przetwarzamy następujące dane
              osobowe:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Adres e-mail — rejestracja i komunikacja z Użytkownikiem</li>
              <li>Imię i nazwisko — personalizacja konta</li>
              <li>
                Nazwa firmy, branża, opis — konfiguracja profilu firmowego
                potrzebnego do generowania odpowiedzi
              </li>
              <li>
                Historia generacji — treści opinii wklejanych przez
                Użytkownika oraz wygenerowanych odpowiedzi
              </li>
              <li>
                Dane płatnicze — obsługiwane wyłącznie przez Stripe Inc.;
                Administrator nie przechowuje numerów kart płatniczych
              </li>
              <li>
                Dane techniczne — adres IP, typ przeglądarki, pliki cookies
                (patrz §6)
              </li>
            </ul>
          </section>

          {/* §3 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §3. Cel i podstawa przetwarzania
            </h2>
            <p className="mt-3">Dane osobowe przetwarzane są w celu:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Świadczenia Usługi (art. 6 ust. 1 lit. b RODO) — wykonanie
                umowy o świadczenie usług drogą elektroniczną
              </li>
              <li>
                Rozliczeń finansowych (art. 6 ust. 1 lit. c RODO) —
                obowiązek prawny wynikający z przepisów podatkowych i
                rachunkowych
              </li>
              <li>
                Komunikacji z Użytkownikiem (art. 6 ust. 1 lit. f RODO) —
                prawnie uzasadniony interes Administratora (obsługa zapytań,
                reklamacji)
              </li>
              <li>
                Doskonalenia Usługi (art. 6 ust. 1 lit. f RODO) — prawnie
                uzasadniony interes Administratora (analityka, poprawa
                jakości)
              </li>
            </ul>
          </section>

          {/* §4 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §4. Odbiorcy danych
            </h2>
            <p className="mt-3">
              Dane osobowe mogą być udostępniane następującym kategoriom
              odbiorców:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Supabase Inc.</strong> — hosting bazy danych
                (infrastruktura w UE)
              </li>
              <li>
                <strong>OpenAI / Anthropic</strong> — przetwarzanie treści
                opinii w celu generowania odpowiedzi (dane anonimizowane,
                bez identyfikatorów osobowych)
              </li>
              <li>
                <strong>Stripe Inc.</strong> — obsługa płatności (certyfikat
                PCI DSS Level 1)
              </li>
              <li>
                <strong>Resend Inc.</strong> — wysyłka wiadomości e-mail
                transakcyjnych
              </li>
              <li>
                <strong>Vercel Inc.</strong> — hosting aplikacji webowej
              </li>
            </ul>
          </section>

          {/* §5 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §5. Okres przechowywania danych
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Dane konta — przez okres posiadania konta w Serwisie, a po
                jego usunięciu przez 30 dni (okres karencji)
              </li>
              <li>
                Historia generacji — przez okres posiadania konta; Użytkownik
                może usunąć poszczególne wpisy w dowolnym momencie
              </li>
              <li>
                Dane rozliczeniowe — przez 5 lat od końca roku, w którym
                dokonano transakcji (obowiązek prawny)
              </li>
              <li>
                Dane techniczne (logi) — maksymalnie 90 dni
              </li>
            </ul>
          </section>

          {/* §6 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §6. Pliki cookies
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Serwis wykorzystuje pliki cookies niezbędne do prawidłowego
                działania (sesja logowania, preferencje).
              </li>
              <li>
                Nie stosujemy cookies marketingowych ani śledzących firm
                trzecich.
              </li>
              <li>
                Użytkownik może zarządzać plikami cookies w ustawieniach
                przeglądarki. Wyłączenie cookies niezbędnych może uniemożliwić
                korzystanie z Serwisu.
              </li>
            </ol>
          </section>

          {/* §7 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §7. Prawa Użytkownika
            </h2>
            <p className="mt-3">
              Na podstawie RODO przysługują Państwu następujące prawa:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Prawo dostępu do swoich danych osobowych</li>
              <li>Prawo do sprostowania (poprawienia) danych</li>
              <li>
                Prawo do usunięcia danych („prawo do bycia zapomnianym")
              </li>
              <li>Prawo do ograniczenia przetwarzania</li>
              <li>Prawo do przenoszenia danych</li>
              <li>
                Prawo sprzeciwu wobec przetwarzania opartego na prawnie
                uzasadnionym interesie
              </li>
              <li>
                Prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych
                Osobowych (ul. Stawki 2, 00-193 Warszawa)
              </li>
            </ul>
            <p className="mt-3">
              W celu realizacji powyższych praw prosimy o kontakt na adres:
              [adres e-mail kontaktowy].
            </p>
          </section>

          {/* §8 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §8. Przekazywanie danych poza EOG
            </h2>
            <p className="mt-3">
              Część naszych podwykonawców (OpenAI, Anthropic, Stripe, Vercel)
              ma siedzibę w Stanach Zjednoczonych. Transfer danych odbywa się
              na podstawie standardowych klauzul umownych (SCC) zatwierdzonych
              przez Komisję Europejską lub decyzji o adekwatności (EU-US Data
              Privacy Framework).
            </p>
          </section>

          {/* §9 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §9. Bezpieczeństwo danych
            </h2>
            <p className="mt-3">
              Administrator stosuje odpowiednie środki techniczne i
              organizacyjne w celu ochrony danych osobowych, w tym:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Szyfrowanie połączeń (TLS/SSL)</li>
              <li>Szyfrowanie danych w spoczynku</li>
              <li>
                Polityka Row Level Security (RLS) w bazie danych — każdy
                Użytkownik ma dostęp wyłącznie do swoich danych
              </li>
              <li>
                Regularne aktualizacje oprogramowania i monitorowanie
                bezpieczeństwa
              </li>
            </ul>
          </section>

          {/* §10 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §10. Zmiany Polityki prywatności
            </h2>
            <p className="mt-3">
              Administrator zastrzega sobie prawo do zmiany niniejszej Polityki
              prywatności. O istotnych zmianach Użytkownicy zostaną
              poinformowani drogą mailową z co najmniej 14-dniowym
              wyprzedzeniem.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4 px-4 text-sm text-zinc-400">
          <span>&copy; 2026 ReplyAI</span>
          <span className="text-zinc-200">|</span>
          <Link
            href="/regulamin"
            className="hover:text-zinc-600 transition-colors"
          >
            Regulamin
          </Link>
          <span className="text-zinc-200">|</span>
          <span className="font-medium text-zinc-500">
            Polityka prywatności
          </span>
        </div>
      </footer>
    </div>
  );
}
