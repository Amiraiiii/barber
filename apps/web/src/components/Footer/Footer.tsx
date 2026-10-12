import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="contact" aria-label="Footer">
      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <p className={styles.wordmark}>BLACKLINE</p>
            <p className={styles.tagline}>Sharp cuts. Clean confidence.</p>
          </div>

          {/* Info columns */}
          <div className={styles.cols}>
            <div className={styles.col}>
              <p className={styles.colLabel}>Visit</p>
              <address className={styles.address}>
                147 West 26th Street<br />
                New York, NY 10001
              </address>
            </div>

            <div className={styles.col}>
              <p className={styles.colLabel}>Hours</p>
              <p className={styles.hours}>
                Mon – Fri: 9am – 8pm<br />
                Sat: 9am – 6pm<br />
                Sun: Closed
              </p>
            </div>

            <div className={styles.col}>
              <p className={styles.colLabel}>Connect</p>
              <nav className={styles.links} aria-label="Social links">
                <a
                  href="https://instagram.com"
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="footer-instagram"
                >
                  Instagram
                </a>
                <a
                  href="mailto:hello@blacklinebarbers.com"
                  className={styles.link}
                  id="footer-email"
                >
                  hello@blacklinebarbers.com
                </a>
                <a href="tel:+15551234567" className={styles.link} id="footer-phone">
                  +1 555 123 4567
                </a>
              </nav>
            </div>

            <div className={styles.col}>
              <p className={styles.colLabel}>Appointments</p>
              <a href="#book" className={`btn-ghost ${styles.bookBtn}`} id="footer-book-btn">
                Book now
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Blackline Barbers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
