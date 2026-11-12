import { CinematicHome } from "@/components/cinematic-home";
import { getPublicContext } from "@/lib/public-context";

export const metadata = {
  title: { absolute: "Find a KingsWord church" },
  description:
    "Find a KingsWord church, see when we meet, and plan your first visit.",
};

// Keep the global experience available even when the root serves a local church.
export default async function Page() {
  const { customDomain } = await getPublicContext();
  return <CinematicHome context={{ basePath: "", customDomain }} />;
}
