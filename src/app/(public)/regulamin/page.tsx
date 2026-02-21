import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Regulamin — ReplyAI",
  description: "Regulamin korzystania z serwisu ReplyAI",
};

export default function RegulaminPage() {
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

        <h1 className="text-3xl font-bold text-zinc-900">Regulamin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ostatnia aktualizacja: 21 lutego 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
          {/* §1 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §1. Postanowienia ogólne
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Niniejszy Regulamin określa zasady korzystania z serwisu
                internetowego <strong>ReplyAI</strong> (dalej: „Serwis"),
                dostępnego pod adresem replyai.pl.
              </li>
              <li>
                Właścicielem i operatorem Serwisu jest [Nazwa firmy], z
                siedzibą w [Adres], NIP: [NIP], REGON: [REGON] (dalej:
                „Operator").
              </li>
              <li>
                Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu
                oraz{" "}
                <Link
                  href="/polityka-prywatnosci"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  Polityki Prywatności
                </Link>
                .
              </li>
            </ol>
          </section>

          {/* §2 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §2. Definicje
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                <strong>Użytkownik</strong> — osoba fizyczna, prawna lub
                jednostka organizacyjna, która korzysta z Serwisu.
              </li>
              <li>
                <strong>Konto</strong> — indywidualne konto Użytkownika w
                Serwisie, zabezpieczone loginem (adres e-mail) i hasłem.
              </li>
              <li>
                <strong>Usługa</strong> — generowanie odpowiedzi na opinie
                klientów przy pomocy sztucznej inteligencji.
              </li>
              <li>
                <strong>Plan</strong> — wybrany przez Użytkownika wariant
                Usługi (Starter, Pro lub Agency), różniący się zakresem
                funkcjonalności i limitem generacji.
              </li>
            </ol>
          </section>

          {/* §3 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §3. Rejestracja i Konto
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Rejestracja wymaga podania adresu e-mail i utworzenia hasła.
              </li>
              <li>
                Użytkownik zobowiązuje się do podania prawdziwych danych i
                nieudostępniania danych logowania osobom trzecim.
              </li>
              <li>
                Operator zastrzega sobie prawo do zawieszenia lub usunięcia
                Konta w przypadku naruszenia Regulaminu.
              </li>
            </ol>
          </section>

          {/* §4 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §4. Zakres Usługi
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Serwis umożliwia generowanie odpowiedzi na opinie klientów
                (Google, Facebook, Booking i inne platformy) za pomocą modeli
                AI.
              </li>
              <li>
                Wygenerowane odpowiedzi mają charakter propozycji. Użytkownik
                ponosi pełną odpowiedzialność za ich treść po opublikowaniu.
              </li>
              <li>
                Operator nie gwarantuje, że wygenerowane odpowiedzi będą
                wolne od błędów. Użytkownik powinien je zweryfikować przed
                publikacją.
              </li>
            </ol>
          </section>

          {/* §5 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §5. Plany i płatności
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Plan <strong>Starter</strong> jest bezpłatny i obejmuje 5
                generacji odpowiedzi miesięcznie.
              </li>
              <li>
                Plany płatne (<strong>Pro</strong>, <strong>Agency</strong>)
                rozliczane są w cyklach miesięcznych. Opłaty pobierane są z
                góry za dany okres rozliczeniowy.
              </li>
              <li>
                Płatności obsługiwane są przez zewnętrznego operatora płatności
                (Stripe). Operator Serwisu nie przechowuje danych kart
                płatniczych.
              </li>
              <li>
                Użytkownik może zrezygnować z planu płatnego w dowolnym
                momencie. Subskrypcja pozostanie aktywna do końca opłaconego
                okresu.
              </li>
            </ol>
          </section>

          {/* §6 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §6. Ograniczenia korzystania
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Zabronione jest korzystanie z Serwisu w sposób niezgodny z
                prawem, w tym generowanie treści obraźliwych, dyskryminujących
                lub naruszających prawa osób trzecich.
              </li>
              <li>
                Zabronione jest podejmowanie prób obejścia zabezpieczeń
                technicznych Serwisu, w tym limitów generacji.
              </li>
              <li>
                Operator zastrzega sobie prawo do ograniczenia dostępu do
                Serwisu w przypadku naruszenia niniejszych zasad.
              </li>
            </ol>
          </section>

          {/* §7 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §7. Odpowiedzialność
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Operator dokłada starań, aby Serwis działał nieprzerwanie i
                poprawnie, ale nie ponosi odpowiedzialności za przerwy
                wynikające z przyczyn technicznych, konserwacji lub siły
                wyższej.
              </li>
              <li>
                Operator nie ponosi odpowiedzialności za decyzje Użytkownika
                podjęte na podstawie wygenerowanych odpowiedzi.
              </li>
              <li>
                Odpowiedzialność Operatora ograniczona jest do kwoty
                zapłaconej przez Użytkownika za ostatni miesiąc korzystania
                z Usługi.
              </li>
            </ol>
          </section>

          {/* §8 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §8. Własność intelektualna
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Serwis, jego kod źródłowy, wygląd, struktura i treści
                stanowią własność intelektualną Operatora.
              </li>
              <li>
                Treści wygenerowane przez AI na zlecenie Użytkownika mogą być
                przez niego wykorzystywane bez ograniczeń.
              </li>
            </ol>
          </section>

          {/* §9 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §9. Reklamacje
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Reklamacje dotyczące działania Serwisu należy zgłaszać drogą
                elektroniczną na adres: [adres e-mail kontaktowy].
              </li>
              <li>
                Operator rozpatrzy reklamację w terminie 14 dni roboczych od
                jej otrzymania.
              </li>
            </ol>
          </section>

          {/* §10 */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">
              §10. Postanowienia końcowe
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Operator zastrzega sobie prawo do zmiany Regulaminu. O
                zmianach Użytkownicy zostaną poinformowani drogą mailową z
                co najmniej 14-dniowym wyprzedzeniem.
              </li>
              <li>
                W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie
                mają przepisy prawa polskiego.
              </li>
              <li>
                Ewentualne spory będą rozstrzygane przez sąd właściwy dla
                siedziby Operatora.
              </li>
            </ol>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-4 px-4 text-sm text-zinc-400">
          <span>&copy; 2026 ReplyAI</span>
          <span className="text-zinc-200">|</span>
          <span className="font-medium text-zinc-500">Regulamin</span>
          <span className="text-zinc-200">|</span>
          <Link
            href="/polityka-prywatnosci"
            className="hover:text-zinc-600 transition-colors"
          >
            Polityka prywatności
          </Link>
        </div>
      </footer>
    </div>
  );
}
