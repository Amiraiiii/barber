"use client";

import { useState, useEffect } from "react";
import styles from "./Nav.module.css";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`} role="banner">
        <div className={styles.inner}>
          <a href="/" className={styles.wordmark} aria-label="BLACKLINE BARBERS — home">
            BLACKLINE
          </a>

          <nav className={styles.links} aria-label="Primary navigation">
            <a href="#services" className={styles.link}>Services</a>
            <a href="#barbers" className={styles.link}>Barbers</a>
            <a href="#gallery" className={styles.link}>Gallery</a>
            <a href="#contact" className={styles.link}>Contact</a>
          </nav>

          <a href="/book" className={styles.bookBtn} id="nav-book-btn">
            Book Now
          </a>

          <button
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span /><span />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav className={styles.mobileLinks} aria-label="Mobile navigation">
          {["#services", "#barbers", "#gallery", "#contact"].map((href) => (
            <a
              key={href}
              href={href}
              className={styles.mobileLink}
              onClick={close}
            >
              {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
            </a>
          ))}
          <a href="/book" className={`btn-primary ${styles.mobileBook}`} onClick={close} id="mobile-book-btn">
            Book Appointment
          </a>
        </nav>
      </div>
    </>
  );
}
