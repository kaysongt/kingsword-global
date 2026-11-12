import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { LocationGlobe } from "@/components/location-globe";
import { PublicNav } from "@/components/public-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChurchVideos } from "@/components/church-videos";
import { LOCATION_MEDIA } from "@/lib/location-media";
import { LOCATIONS, locationHref, type PublicContext } from "@/lib/locations";

export function CinematicDirectory({ context }: { context: PublicContext }) {
  return (
    <div className="kw-location-grid">
      {LOCATIONS.map((location) => {
        const media = LOCATION_MEDIA[location.slug];
        return (
          <Link
            href={locationHref(location, context.customDomain)}
            className={`kw-location-card card-${location.slug}`}
            key={location.slug}
          >
            <Image
              src={media.hero.src}
              alt={media.hero.alt}
              fill
              sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 50vw"
            />
            <div className="kw-card-top">
              <span>{location.region}</span>
            </div>
            <div className="kw-card-bottom">
              <p>{media.headline}</p>
              <h3>{location.name}</h3>
              <span className="kw-round-arrow">
                <ArrowUpRight size={24} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function TrainingFeature({ compact = false }: { compact?: boolean }) {
  if (compact)
    return (
      <section className="kw-training-compact">
        <div className="kw-shell">
          <div>
            <p className="kw-kicker">BELIEVERS TRAINING</p>
            <h2>Give your faith a strong foundation.</h2>
            <p>Study Scripture, prayer and Christian living in seven self-paced modules.</p>
          </div>
          <Link
            href="/believers-training"
            className="kw-button kw-button-light"
          >
            See the programme <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    );
  return (
    <section className="kw-training">
      <div className="kw-shell kw-training-inner">
        <div>
          <p className="kw-kicker">BUILD YOUR UNDERSTANDING</p>
          <h2>
            Faith, from
            <br />
            <em>the foundation up.</em>
          </h2>
          <p>
            Study Scripture, prayer and Christian living in seven self-paced modules.
          </p>
          <Link
            href="/believers-training"
            className="kw-button kw-button-light"
          >
            Explore Believers Training <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="kw-training-list">
          {[
            "The New Covenant",
            "Identity in Christ",
            "The Word: The Agent of Change",
            "The Ministry of the Holy Spirit",
            "Spiritual Authority and Prayer",
            "Purpose and Calling",
            "Stewardship and Missional Lifestyle",
          ].map((title, i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <p>{title}</p>
              <ArrowUpRight size={16} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CinematicHome({ context }: { context: PublicContext }) {
  const locations = LOCATIONS.map((location) => ({
    slug: location.slug,
    name: location.name,
    region: location.region,
    href: locationHref(location, context.customDomain),
    coordinates: LOCATION_MEDIA[location.slug].coordinates,
    image: LOCATION_MEDIA[location.slug].hero.src,
    caption: LOCATION_MEDIA[location.slug].hero.alt,
    headline: LOCATION_MEDIA[location.slug].headline,
    photos: LOCATION_MEDIA[location.slug].photos,
  }));
  return (
    <div className="kw-site">
      <PublicNav context={context} />
      <main id="main-content">
        <div className="kw-home-hero">
          <div className="kw-shell">
            <LocationGlobe locations={locations} />
          </div>
        </div>
        <section className="kw-statement">
          <div className="kw-shell">
            <Reveal>
              <h2>
                Rooted in the Word. <span>Led by the Spirit.</span>
              </h2>
            </Reveal>
            <div className="kw-statement-bottom">
              <p>
                We worship together, learn from Scripture, and help each other put our faith into practice throughout the week.
              </p>
              <Link className="kw-text-link" href="/about">
                Discover our story <ArrowUpRight size={20} />
              </Link>
            </div>
          </div>
        </section>
        <section id="our-locations" className="kw-section">
          <div className="kw-shell">
            <div className="kw-section-heading">
              <div>
                <h2>
                  Find your <em>church.</em>
                </h2>
              </div>
              <p>
                Take a look inside our churches, find service times and make
                plans for your first Sunday. <ArrowDown size={20} />
              </p>
            </div>
            <CinematicDirectory context={context} />
          </div>
        </section>
        <section className="kw-photo-statement">
          <Image
            src="/media/nigeria-prayer.jpg"
            alt="Worshippers praying at KingsWord Ikeja, Lagos"
            fill
            sizes="100vw"
          />
          <div className="kw-shell">
            <p className="kw-kicker">IN THE ROOM · KingsWord IKEJA</p>
            <h2>
              This is what
              <br />
              <em>faith sounds like.</em>
            </h2>
            <Link href="#watch" className="kw-button kw-button-light">
              Listen to our worship <ArrowUpRight size={18} />
            </Link>
            <span className="kw-photo-credit">
              KingsWord Ikeja · Lagos, Nigeria
            </span>
          </div>
        </section>
        <section id="watch" className="kw-section kw-watch">
          <div className="kw-shell">
            <div className="kw-section-heading">
              <div>
                <h2>
                  Teaching and <em>worship.</em>
                </h2>
              </div>
              <p>
                Watch a message or join in worship from home.
              </p>
            </div>
            <ChurchVideos
              videos={[
                LOCATION_MEDIA.chicago.videos[0],
                LOCATION_MEDIA.london.videos[1],
              ]}
            />
          </div>
        </section>
        <TrainingFeature />
      </main>
      <SiteFooter context={context} />
    </div>
  );
}
