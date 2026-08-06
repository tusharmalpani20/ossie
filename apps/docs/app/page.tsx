import Image from "next/image";
import {
  docsLinks,
  evidenceItems,
  knownLimitations,
  nextPlatformDirection,
  productCapabilities,
  siteSummary,
} from "./docs-content";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="page-title">
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Alpha documentation hub</p>
          <div className={styles.brandHeading}>
            <Image
              className={styles.brandIcon}
              src="/brand/ossie-app-icon-256.png"
              alt="Ossie purple octopus mascot"
              width={72}
              height={72}
              priority
            />
            <h1 id="page-title">{siteSummary.name}</h1>
          </div>
          <p className={styles.status}>{siteSummary.status}</p>
          <p className={styles.lede}>{siteSummary.positioning}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryLink} href={siteSummary.readmeHref}>
              Start with README
            </a>
            <a
              className={styles.secondaryLink}
              href={siteSummary.selfHostingHref}
            >
              Self-hosting quickstart
            </a>
          </div>
        </div>
        <figure className={styles.heroPreview}>
          <figcaption id="hero-evidence-caption" className={styles.visuallyHidden}>
            Current alpha evidence
          </figcaption>
          <Image
            src={evidenceItems[0]!.src}
            alt="Project workspace showing capture, guide, and interactive demo entry points."
            width={960}
            height={600}
            loading="eager"
            priority
          />
        </figure>
      </section>

      <section
        className={styles.section}
        aria-labelledby="capabilities-heading"
      >
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Current alpha</p>
          <h2 id="capabilities-heading">What Works Today</h2>
        </div>
        <div className={styles.capabilityGrid}>
          {productCapabilities.map((capability) => (
            <article className={styles.panel} key={capability}>
              <p>{capability}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.directionBand}`}
        aria-labelledby="direction-heading"
      >
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Accepted target</p>
          <h2 id="direction-heading">Next Platform Direction</h2>
          <p>{nextPlatformDirection.status}</p>
        </div>
        <ul className={styles.directionGrid}>
          {nextPlatformDirection.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.boundaryNote}>
          {nextPlatformDirection.docsAppBoundary}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="docs-heading">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Source docs</p>
          <h2 id="docs-heading">Use Markdown Docs For Deep Dives</h2>
          <p>
            This site is a compact navigation surface. The linked markdown files
            remain the source of truth for setup, operations, roadmap, dogfood
            evidence, and contribution flow.
          </p>
        </div>
        <div className={styles.linkGrid}>
          {docsLinks.map((link) => (
            <a className={styles.docLink} href={link.href} key={link.href}>
              <span>{link.label}</span>
              <p>{link.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="evidence-heading">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Dogfood evidence</p>
          <h2 id="evidence-heading">Safe Alpha Screenshots</h2>
          <p>
            Screenshots use synthetic dogfood data and show the portal surfaces
            that currently have trustworthy visual evidence.
          </p>
        </div>
        <div className={styles.evidenceGrid}>
          {evidenceItems.slice(1).map((item) => (
            <figure className={styles.evidenceCard} key={item.src}>
              <Image src={item.src} alt={item.alt} width={960} height={600} />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="limitations-heading">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Still open</p>
          <h2 id="limitations-heading">Alpha Limitations</h2>
        </div>
        <ul className={styles.limitations}>
          {knownLimitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
