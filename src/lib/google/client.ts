import {
  encryptTokens,
  decryptTokens,
  type GoogleOAuthTokens,
} from "./crypto";

// ============================================================
// Konfiguracja
// ============================================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GBP_API_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GBP_API_V4_BASE = "https://mybusiness.googleapis.com/v4";
const GBP_BUSINESS_INFO_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

const SCOPE = "https://www.googleapis.com/auth/business.manage";

function getClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth config. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ============================================================
// OAuth Flow
// ============================================================

/**
 * Generuje URL do Google OAuth consent screen.
 * @param state Losowy token CSRF (zapisany w cookie)
 */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getClientConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Wymienia authorization code na access_token + refresh_token.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleOAuthTokens> {
  const { clientId, clientSecret, redirectUri } = getClientConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };
}

/**
 * Odświeża access_token za pomocą refresh_token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_at: number }> {
  const { clientId, clientSecret } = getClientConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    // 400/401 = refresh token odwołany lub wygasły
    if (response.status === 400 || response.status === 401) {
      throw new GoogleTokenExpiredError();
    }
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// ============================================================
// Token Management
// ============================================================

/**
 * Pobiera ważny access_token — odświeża automatycznie jeśli wygasł.
 * Zwraca nowy zaszyfrowany string tokenów jeśli odświeżono (do zapisu w DB).
 * Rzuca GoogleTokenExpiredError jeśli refresh się nie powiedzie.
 */
export async function getValidAccessToken(encryptedTokens: string): Promise<{
  accessToken: string;
  updatedEncryptedTokens: string | null;
}> {
  const tokens = decryptTokens(encryptedTokens);

  // Bufor 5 min przed wygaśnięciem
  if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
    return { accessToken: tokens.access_token, updatedEncryptedTokens: null };
  }

  // Token wygasł lub zaraz wygaśnie — odśwież
  const refreshed = await refreshAccessToken(tokens.refresh_token);

  const updatedTokens: GoogleOAuthTokens = {
    ...tokens,
    access_token: refreshed.access_token,
    expires_at: refreshed.expires_at,
  };

  return {
    accessToken: refreshed.access_token,
    updatedEncryptedTokens: encryptTokens(updatedTokens),
  };
}

// ============================================================
// Google Business Profile API — Accounts & Locations
// ============================================================

export interface GBPAccount {
  name: string; // "accounts/123456789"
  accountName: string; // "Moja Firma"
  type: string; // "PERSONAL" | "LOCATION_GROUP" | "ORGANIZATION"
  accountNumber?: string;
}

export interface GBPLocation {
  name: string; // "locations/987654321"
  title: string; // "Pizzeria Da Vinci"
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    postalCode?: string;
  };
  websiteUri?: string;
}

/**
 * Pobiera listę kont Google Business Profile.
 */
export async function listAccounts(
  accessToken: string
): Promise<GBPAccount[]> {
  const response = await fetch(`${GBP_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    throw new GoogleTokenExpiredError();
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GBP accounts list failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.accounts ?? [];
}

/**
 * Pobiera listę lokalizacji dla danego konta.
 */
export async function listLocations(
  accessToken: string,
  accountId: string
): Promise<GBPLocation[]> {
  const response = await fetch(
    `${GBP_BUSINESS_INFO_BASE}/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 401) {
    throw new GoogleTokenExpiredError();
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `GBP locations list failed (${response.status}): ${error}`
    );
  }

  const data = await response.json();
  return data.locations ?? [];
}

// ============================================================
// Google Business Profile API — Reviews
// ============================================================

export interface GBPReview {
  name: string; // "accounts/123/locations/456/reviews/789"
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string; // ISO 8601
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface GBPReviewsResponse {
  reviews?: GBPReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

/**
 * Konwertuje string oceny Google na liczbę 1-5.
 */
export function starRatingToNumber(rating: string): number {
  return STAR_RATING_MAP[rating] ?? 0;
}

/**
 * Pobiera opinie Google dla lokalizacji.
 * Używa GBP API v4 (jedyne API obsługujące reviews).
 */
export async function listReviews(
  accessToken: string,
  accountId: string,
  locationId: string,
  pageToken?: string
): Promise<GBPReviewsResponse> {
  const url = new URL(
    `${GBP_API_V4_BASE}/${accountId}/${locationId}/reviews`
  );
  url.searchParams.set("pageSize", "50");
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    throw new GoogleTokenExpiredError();
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `GBP reviews list failed (${response.status}): ${error}`
    );
  }

  return response.json();
}

/**
 * Publikuje odpowiedź na opinię Google.
 */
export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<void> {
  const response = await fetch(
    `${GBP_API_V4_BASE}/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    }
  );

  if (response.status === 401) {
    throw new GoogleTokenExpiredError();
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `GBP reply failed (${response.status}): ${error}`
    );
  }
}

/**
 * Usuwa odpowiedź na opinię Google.
 */
export async function deleteReviewReply(
  accessToken: string,
  reviewName: string
): Promise<void> {
  const response = await fetch(
    `${GBP_API_V4_BASE}/${reviewName}/reply`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 401) {
    throw new GoogleTokenExpiredError();
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `GBP delete reply failed (${response.status}): ${error}`
    );
  }
}

// ============================================================
// Error types
// ============================================================

export class GoogleTokenExpiredError extends Error {
  constructor() {
    super("Google OAuth token expired or revoked");
    this.name = "GoogleTokenExpiredError";
  }
}

export class GoogleNotConnectedError extends Error {
  constructor() {
    super("Google Business Profile not connected");
    this.name = "GoogleNotConnectedError";
  }
}

// Re-export crypto functions
export { encryptTokens, decryptTokens };
export type { GoogleOAuthTokens };
