/**
 * KingsWord Chicago — the church this application belongs to.
 *
 * Kept apart from SITE_CONFIG, which describes the Believers Training
 * programme. The two were the same thing while this app was only the training
 * portal; now the app is the church's site with the programme inside it, and
 * conflating them makes it impossible to say "the church's phone number"
 * without meaning "the training programme's phone number".
 *
 * Every value here is the church's real published detail, taken from
 * chicago.kingsword.org.
 */
export const CHURCH = {
  name: "KingsWord Chicago",
  legalName: "KingsWord International Church, Chicago",
  tagline: "The Apostolic Place",
  description:
    "A Word-centered church on Chicago's West Side, and the apostolic headquarters of a global ministry with churches in Africa, Europe and North America.",

  address: {
    street: "4250 W Walton Street",
    city: "Chicago",
    state: "IL",
    postcode: "60651",
    /** Pre-built so the map link is written once rather than in every footer. */
    mapUrl: "https://maps.google.com/?q=4250+W+Walton+Street+Chicago+IL+60651",
  },

  phone: "+1 773 277 8701",
  /** Digits only, for tel: hrefs. */
  phoneHref: "tel:+17732778701",
  email: "admin@kingsword.org",

  services: [
    { day: "Sunday", time: "10:00 AM", note: "Child care available at every Sunday service." },
    { day: "Friday", time: "7:30 PM", note: "Midweek teaching, prayer and encounter." },
  ],

  /**
   * Off-site destinations the church already uses. Giving is a Square checkout
   * and the livestream is a YouTube channel; neither is a page on this site.
   */
  giveUrl:
    "https://checkout.square.site/merchant/Y1YR8C3GQD9HJ/checkout/B5UW3HKWPTGWWFTQQY2F2JZJ",
  watchUrl: "https://www.youtube.com/@KingsWordEveryWhere",
  ministryUrl: "https://kingsword.org",
} as const;

/**
 * The primary navigation, shared by the header and its mobile panel so the two
 * cannot disagree about what the site contains.
 */
export const NAV_LINKS: ReadonlyArray<{
  label: string;
  href: string;
  external?: boolean;
}> = [
  { label: "About", href: "/about" },
  { label: "Children", href: "/children" },
  { label: "Watch", href: CHURCH.watchUrl, external: true },
  // Visiting details live on the homepage rather than in a page of their own —
  // service times and an address do not fill a page, and burying them one click
  // deeper is the current site's worst failure.
  { label: "Visit", href: "/#visit" },
  { label: "Contact", href: "/contact" },
];
