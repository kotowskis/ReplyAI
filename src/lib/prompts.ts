export const SYSTEM_PROMPT = `Jesteś ekspertem od zarządzania reputacją online dla lokalnych firm.
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
- Język odpowiedzi musi być taki sam jak język opinii`;

const toneMap: Record<string, string> = {
  formal: "formalny i profesjonalny",
  friendly: "przyjazny i ciepły",
  casual: "casualowy i bezpośredni",
};

export function buildPrompt(params: {
  review: string;
  rating: number | null;
  platform: string;
  company: {
    name: string;
    industry: string;
    tone: string;
    ownerName: string | null;
    description: string | null;
  };
}): string {
  const { review, rating, platform, company } = params;

  return `
Firma: ${company.name}
Branża: ${company.industry}
Ton komunikacji: ${toneMap[company.tone] ?? "przyjazny"}
${company.ownerName ? `Właściciel: ${company.ownerName}` : ""}
${company.description ? `Dodatkowy kontekst: ${company.description}` : ""}

Platforma: ${platform}
${rating ? `Ocena: ${rating}/5 gwiazdek` : ""}

Opinia klienta:
"""
${review}
"""

Napisz odpowiedź na tę opinię. Odpowiedz TYLKO treścią odpowiedzi,
bez żadnych komentarzy ani wyjaśnień.
  `.trim();
}
