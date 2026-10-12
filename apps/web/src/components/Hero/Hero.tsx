"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      lineRefs.current.forEach((el) => {
        if (el) el.style.transform = "translateY(0)";
      });
      return;
    }

    // Staggered line-mask reveal using CSS animation with delays
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transitionDelay = `${0.3 + i * 0.18}s`;
      // Force reflow then add visible class
      void el.offsetHeight;
      el.classList.add(styles.lineVisible);
    });

    // Subtle parallax on scroll
    const onScroll = () => {
      if (!imgRef.current) return;
      const y = window.scrollY;
      imgRef.current.style.transform = `translateY(${y * 0.25}px) scale(1.06)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className={styles.hero} id="hero" aria-label="Hero">
      {/* Background image */}
      <div className={styles.imgWrap} ref={imgRef} aria-hidden="true">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className={styles.img}
        />
        <div className={styles.overlay} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.headline} aria-label="Sharp cuts. Clean confidence.">
          {["SHARP CUTS.", "CLEAN", "CONFIDENCE."].map((line, i) => (
            <div className={styles.lineMask} key={i}>
              <span
                className={styles.line}
                ref={(el) => { lineRefs.current[i] = el; }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.sub}>
          <div className={styles.lineMask}>
            <span
              className={styles.line}
              ref={(el) => { lineRefs.current[3] = el; }}
            >
              <p className={styles.subtext}>
                Precision grooming for people who care about the details.
              </p>
            </span>
          </div>

          <div className={styles.ctas}>
            <a href="/book" className={`btn-primary ${styles.cta}`} id="hero-book-btn">
              Book an appointment
            </a>
            <a href="#services" className={`btn-ghost ${styles.cta}`} id="hero-services-btn">
              Explore services
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollLine} aria-hidden="true" />
    </section>
  );
}
