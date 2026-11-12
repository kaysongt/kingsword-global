# KingsWord locations and domains

One Next.js application serves the KingsWord network and five local sites. The
existing PostgreSQL training programme, accounts and staff roles remain shared.
No database migration or reseeding is needed for this change.

| Location | Requested hostname | Preview path |
| --- | --- | --- |
| Chicago | chicago.kingsword.org | /locations/chicago |
| Nigeria | nigeria.kingsword.org | /locations/nigeria |
| Calgary | calgary.kingsword.org | /locations/calgary |
| Dallas | dallas.kingsword.org | /locations/dallas |
| London | londonkingsword.org | /locations/london |

Each location supports `/`, `/about`, `/contact` and `/children` on its hostname.
Those pages are also available beneath each preview path. `/locations` lists all
five locations. On a known church hostname, location links switch domains; on a
local or Vercel preview hostname, they stay within the preview using paths.
The `/explore` route opens the global globe on every hostname, and each location
links back to it. The network homepage appears on other hosts, including the Vercel project URL
and `kingsword.org` if that domain is separately connected.

## Domain cutover

The existing Vercel project is `seven-module-lms` in `kaysongts-projects`, linked
to `kaysongt/seven-module-lms`. Retain its database environment and deployment
flow. Do not create another database or overwrite another KTI project.

1. Review the deployment's five preview paths and their About/Contact pages.
2. Confirm London spelling: the requested destination is **londonkingsword.org**;
   the existing published London website is **kingswordlondon.org**. The latter
   remains a content source, not an automatically redirected domain.
3. Add the five confirmed hostnames to this Vercel project's Production domains.
4. At each DNS provider, save the existing records and apply the **exact DNS
   values Vercel returns**. Do not guess a shared CNAME or IP: Vercel can assign
   project-specific values. Replace only conflicting web records for the exact
   hostnames; preserve mail records and the `kingsword.org` apex website.
5. Complete any ownership-verification TXT records, wait for DNS verification
   and HTTPS certificates, then confirm each hostname renders the right church.
6. Keep `APP_URL` set to the shared portal's approved HTTPS origin. Activation
   links deliberately use this configured value, never an incoming Host header.
7. Validate the existing training flow with the production database before
   opening enrollment. Roll back web DNS records if cutover must be reversed.

Application routing is configured in code; that alone does **not** create DNS
records, register domains, issue certificates or replace the live church sites.
`www.` aliases are recognized by the application but require their own hosting
and DNS configuration if wanted. The apex ministry site is not part of the five
requested domain cutovers.

## Shared training

All five hosts use the same accounts, curriculum, progress and administrator
permissions. Sessions stay host-only, so someone moving to another domain signs
in again with the same account. This includes London, which is a separate root
domain. There is no cross-domain SSO and no per-location staff isolation.
Do not use this setup to promise isolated regional administration. Keep
`DATABASE_URL` and `DIRECT_URL` consistent on the single production project.

## Content maintenance and sources

Edit `src/lib/locations.ts` for domains, service times, contacts and links, and
`src/lib/location-media.ts` for photography, videos, location introductions and
globe coordinates. The public pages use `src/components/location-site.tsx` and
`src/components/cinematic-home.tsx`. Chicago's original content settings remain
in `src/lib/church.ts`. See [MEDIA-SOURCES.md](./MEDIA-SOURCES.md) for media provenance.

Published sources checked September 8, 2026:

- Chicago: https://chicago.kingsword.org/
- Nigeria congregations, Dallas phone, Calgary phone:
  https://www.kingsword.org/locations
- Calgary address and Sunday time:
  https://kingswordcalgary.churchcenter.com/home
- London address, contact and Sunday time: https://kingswordlondon.org/
- London livestream: https://kingswordlondon.org/watch-live/live/
- Dallas current address and Sunday time: https://kingsworddallas.org/visit/

Nigeria is a regional directory, with four listed congregations and a link to
the complete ministry directory. Its globe point represents Lagos as a regional
entry point, not every Nigerian congregation. Dallas now uses the local church's
Celina address and published Sunday 11:00 AM service (doors open 10:30 AM).
Dallas visitor details, history, sermons, events, articles and giving were
checked against https://kingsworddallas.org/ in November 2026. The rebuilt site
links to the Dallas church’s existing visit form and giving page. The global
directory still showed the previous address in The Colony.
