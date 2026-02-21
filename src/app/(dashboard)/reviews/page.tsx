import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleReviewsPage } from "@/components/GoogleReviewsPage";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companies } = await supabase
    .from("companies")
    .select(
      "id, google_oauth_tokens, google_account_id, google_location_id, google_location_name"
    )
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const company = companies[0];
  const isGoogleConnected = !!(
    company.google_oauth_tokens &&
    company.google_account_id &&
    company.google_location_id
  );

  return (
    <GoogleReviewsPage
      isGoogleConnected={isGoogleConnected}
      locationName={company.google_location_name}
    />
  );
}
