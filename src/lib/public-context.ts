import { cache } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { locationByHost, NETWORK, normalizeHost, type PublicContext } from "@/lib/locations";

// Request-scoped, never a mutable global. Forwarded host values are not trusted.
export const getPublicContext = cache(async (): Promise<PublicContext> => {
  const host = normalizeHost((await headers()).get("host") ?? "");
  const location = locationByHost(host);
  return { location, basePath: "", customDomain: Boolean(location) || host === "kingsword.org" || host === "www.kingsword.org" };
});

export async function networkHomeHref() {
  // Campus domains serve their local homepage at the root.
  const { location } = await getPublicContext();
  return location ? "/explore" : "/";
}

export function publicMetadata(context: PublicContext, page = ""): Metadata {
  const name = context.location ? `KingsWord ${context.location.name}` : NETWORK.name;
  const title = page ? `${page} | ${name}` : name;
  const description = context.location?.description ?? NETWORK.description;
  return { title: { absolute: title }, description, openGraph: { title, description, type: "website" } };
}
