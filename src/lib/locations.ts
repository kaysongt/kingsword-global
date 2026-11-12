import { CHURCH } from "@/lib/church";

export const NETWORK = {
  name: "KingsWord",
  tagline: "Home of the Supernatural",
  description: "Find your KingsWord community in Chicago, Nigeria, Calgary, Dallas or London. Worship with us and grow through Believers Training.",
  directoryUrl: "https://www.kingsword.org/locations",
  watchUrl: "https://www.kingsword.org/sermons",
};

export type Congregation = { name: string; address: string; phone: string };
export type ChurchLocation = {
  slug: string;
  name: string;
  region: string;
  domain: string;
  tagline: string;
  description: string;
  timezone: string;
  services: { day: string; time: string; note: string }[];
  congregations: Congregation[];
  email?: string;
  watchUrl?: string;
  giveUrl?: string;
  sourceUrl: string;
};

// Published details checked September 8, 2026. Missing times/giving links are
// intentionally absent: never substitute another congregation's information.
export const LOCATIONS: readonly ChurchLocation[] = [
  {
    slug: "chicago", name: "Chicago", region: "United States",
    domain: "chicago.kingsword.org", tagline: CHURCH.tagline,
    description: CHURCH.description, timezone: "America/Chicago",
    services: [...CHURCH.services],
    congregations: [{ name: "The Apostolic Place", address: "4250 W Walton Street, Chicago, IL 60651", phone: CHURCH.phone }],
    email: CHURCH.email, watchUrl: CHURCH.watchUrl, giveUrl: CHURCH.giveUrl,
    sourceUrl: "https://chicago.kingsword.org/",
  },
  {
    slug: "nigeria", name: "Nigeria", region: "Africa",
    domain: "nigeria.kingsword.org", tagline: "Find your church family",
    description: "Connect with KingsWord congregations across Nigeria. Find a worship centre, meet your local community and take your next step in faith.",
    timezone: "Africa/Lagos", services: [],
    congregations: [
      { name: "Ikeja", address: "The Charis Centre, Etal Avenue, First Bank Bus Stop, Off Kudirat Abiola Way, Oregun, Lagos", phone: "+234 810 000 0650" },
      { name: "Island churches", address: "The Charis Centre, 1, Plot 3, Okunde Blue Water Tourism Scheme, Oniru-Lekki", phone: "+234 705 189 4593" },
      { name: "Abuja", address: "3J's Hotel, 31 P.O.W. Mafemi Crescent, Utako, Abuja", phone: "+234 803 802 9673" },
      { name: "Agodi, Ibadan", address: "Alice Place, Opp UCH, 2nd Gate, Total Garden, Ibadan", phone: "+234 706 204 8038" },
    ],
    sourceUrl: NETWORK.directoryUrl,
  },
  {
    slug: "calgary", name: "Calgary", region: "Canada",
    domain: "calgary.kingsword.org", tagline: "A place to belong",
    description: "Worship with KingsWord Calgary and become part of a community growing in the Word and the Spirit.",
    timezone: "America/Edmonton",
    services: [{ day: "Sunday", time: "9:30 AM", note: "Worship with us in Calgary. All times are local." }],
    congregations: [{ name: "KingsWord Calgary", address: "5811 46 St SE, Calgary, Alberta T2C 4Y5", phone: "+1 587 210 5340" }],
    sourceUrl: "https://kingswordcalgary.churchcenter.com/home",
  },
  {
    slug: "dallas", name: "Dallas", region: "United States",
    domain: "dallas.kingsword.org", tagline: "Faith. Family. Purpose.",
    description: "Find community at KingsWord Dallas. Connect with the congregation in Celina and grow with us in faith and purpose.",
    timezone: "America/Chicago", services: [{ day: "Sunday", time: "11:00 AM", note: "Doors open at 10:30 AM. All times are local." }],
    congregations: [{ name: "KingsWord Dallas", address: "8170 County Road 101, Celina, TX 75009", phone: "+1 847 910 6446" }],
    watchUrl: "https://kingsworddallas.org/sermons/",
    giveUrl: "https://kingsworddallas.org/give/",
    sourceUrl: "https://kingsworddallas.org/visit/",
  },
  {
    slug: "london", name: "London", region: "United Kingdom",
    // Requested domain. Existing content source uses the reverse word order.
    domain: "londonkingsword.org", tagline: "Welcome home",
    description: "A church family in Charlton, London, growing together through worship, the Word and life in community.",
    timezone: "Europe/London",
    services: [{ day: "Sunday", time: "10:00 AM", note: "Sunday worship in Charlton. All times are local." }],
    congregations: [{ name: "The Graceland", address: "107–115 Eastmoor Street, Charlton, London SE7 8LX", phone: "+44 20 3026 0745" }],
    email: "hello@kingswordlondon.org",
    watchUrl: "https://kingswordlondon.org/watch-live/live/",
    sourceUrl: "https://kingswordlondon.org/",
  },
];

export const DALLAS_LINKS = {
  events: "https://kingsworddallas.org/events/",
  articles: "https://kingsworddallas.org/articles/",
  about: "https://kingsworddallas.org/about/",
};

export const DALLAS_CHILDREN =
  "Sunday programs are available for ages 2–15. Check in at the lobby kiosk before service. Children are released to the adult who checked them in.";

export type PublicContext = { location?: ChurchLocation; basePath: string; customDomain: boolean };

export function locationBySlug(slug: string) {
  return LOCATIONS.find((location) => location.slug === slug);
}

export function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function locationByHost(host: string) {
  const hostname = normalizeHost(host);
  return LOCATIONS.find((location) => hostname === location.domain || hostname === `www.${location.domain}`);
}

export function locationHref(location: ChurchLocation, customDomain = false) {
  return customDomain ? `https://${location.domain}` : `/locations/${location.slug}`;
}

export function localHref(context: PublicContext, path = "") {
  return `${context.basePath}/${path}`;
}

export function mapHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
