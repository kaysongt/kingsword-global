import { ChicagoCommunityPage, CHICAGO_PAGES, type ChicagoPage } from "@/components/chicago-community";
import { notFound } from "next/navigation";
import { PublicPage, type PublicPageName } from "@/components/public-page";
import { locationBySlug, type PublicContext } from "@/lib/locations";
import { publicMetadata } from "@/lib/public-context";

type Props = { params: Promise<{ slug: string; page?: string[] }> };

async function resolvePage(params: Props["params"]) {
  const { slug, page: segments = [] } = await params;
  const location = locationBySlug(slug);
  const page = segments[0] ?? "home";
  if (!location || segments.length > 1 || !["home", "about", "contact", "children", ...(slug === "chicago" ? Object.keys(CHICAGO_PAGES) : [])].includes(page) || segments[0] === "home") notFound();
  const context: PublicContext = { location, basePath: `/locations/${location.slug}`, customDomain: false };
  return { context, page: page as PublicPageName | ChicagoPage };
}

export async function generateMetadata({ params }: Props) {
  const { context, page } = await resolvePage(params);
  return publicMetadata(context, { home: "", about: "About", contact: "Contact", children: "Children’s ministry", ...CHICAGO_PAGES }[page]);
}

export default async function Page({ params }: Props) {
  const { context, page } = await resolvePage(params);
  if (page in CHICAGO_PAGES) return <ChicagoCommunityPage context={context} page={page as ChicagoPage} />;
  return <PublicPage context={context} page={page as PublicPageName} />;
}
