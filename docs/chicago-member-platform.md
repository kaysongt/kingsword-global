# Chicago branch experience

The Chicago public site lives at `/locations/chicago/`. It retains the common KingsWord branding and the global logo destination, with Chicago-specific navigation. Home, about, contact and children pages now connect to My Chicago, small groups, gatherings and staff entry pages. Other branches keep their existing navigation and routes.

## Implemented public experience

- `/members/`: welcome contact, optional official Connect form, member portal handoff, training, groups, serving and care contact.
- `/groups/`: group enquiry and leadership contact. No unverified group names, leaders, home addresses or meeting schedules are published.
- `/gatherings/`: the existing Chicago service schedule, viewing link, children information and special-event enquiry.
- `/team/`: entry to the existing Breeze login. This is a public signpost, not an authenticated dashboard; it has no member data.
- Responsive navigation and cards, keyboard focus and reduced-motion support.

Public links use these optional GitHub Actions repository variables:

| Repository variable | Build-time variable | Purpose |
| --- | --- | --- |
| CHICAGO_MEMBER_PORTAL_URL | NEXT_PUBLIC_CHICAGO_MEMBER_PORTAL_URL | Verified, published member app |
| CHICAGO_CONNECT_FORM_URL | NEXT_PUBLIC_CHICAGO_CONNECT_FORM_URL | Official Chicago Connect form |
| CHICAGO_GROUP_FORM_URL | NEXT_PUBLIC_CHICAGO_GROUP_FORM_URL | Official Chicago group enquiry form |

Only HTTPS URLs without credentials are accepted. Leave unset until the destination is reviewed. With no configuration, visitors see working church email/phone links and honest member-access preparation text. Email links open the visitor's email client; they do not automatically submit anything to Breeze. Changing variables requires another Pages deployment. Do not put preview-token URLs, API keys, passwords or private member identifiers in these values.

## Private member portal: unfinished integration

A separate copy of Tobi's Lovable project exists; the original is preserved. The requested integration build was paused by Lovable for exhausted credits on 2026-11-13. This public-site change does not implement or claim a working Breeze API connection, new admin analytics, group administration or automatic follow-up.

Before enabling the member-app link:

1. Finish or export the copied app. Replace demo data and demo statistics; verify the contact, giving and service information against the Chicago configuration.
2. Provision a private backend secret for the Breeze key. Use only the fixed Chicago Breeze host; never expose a browser-side key or an arbitrary API proxy.
3. Explicitly provision administrators. No first-signup admin grant. Enforce staff, usher, group-leader and member permissions on the server, with deny-by-default record access.
4. Map verified accounts to Breeze person IDs. Ambiguous matches require authorized staff review. Do not create duplicate member records from unverified registration.
5. Map check-ins to existing verified service instances in America/Chicago. Enforce a service window, permission checks and duplicate protection server-side. Treat timeouts as unknown/pending and reconcile before retrying. Keep online participation separate from in-person attendance.
6. Use official forms for guest/Connect and group interest until authenticated submission is complete. Collect only needed details and obtain messaging preferences. Leave automatic messages disabled until church decisions and sender setup are complete.
7. Test denied/unauthenticated requests, scoped staff access, duplicate submissions, upstream failures, empty configuration and live end-to-end check-in with an agreed test record before launch.

## Proposed staff workspace

Build in the authenticated member app, not in exported HTML:

- Overview: attendance by verified recorded service, new visitors, Connect stage and outstanding care tasks. Include data coverage and last successful sync.
- Member care: assigned follow-ups, stage changes and staff notes with appropriate access. Two missing records alone are not evidence of absence when attendance recording is incomplete.
- Small groups: approved group directory, leader assignment, capacity, join requests, membership and leader-scoped attendance. Use an agreed Breeze tag/group mapping and review changes before syncing.
- Services: existing event-instance mapping, usher overrides, check-in status and failed-sync review.
- Settings: staff roles, official forms, service configuration, messaging preferences, sync health and audit trail.

Historical gaps must appear as “not recorded,” never zero attendance or automatic inactivity. Any completion/retention metric needs an explicit cohort and date range. No member directory, contact export, birthdays or pastoral notes belong in the public static build.
