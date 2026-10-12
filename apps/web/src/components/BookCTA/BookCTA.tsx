import Image from "next/image";
import styles from "./BookCTA.module.css";

export default function BookCTA() {
  return (
    <section className={styles.section} id="book" aria-labelledby="book-heading">
      {/* Background image */}
      <div className={styles.imgWrap} aria-hidden="true">
        <Image
          src="/images/interior.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.img}
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.content}>
        <h2 className={styles.heading} id="book-heading">
          Your next look<br />
          <em>starts here.</em>
        </h2>

        <a
          href="/book"
          className={`btn-primary ${styles.cta}`}
          id="book-cta-btn"
        >
          Book your appointment
        </a>

        <p className={styles.note}>
          Or call us at <a href="tel:+15551234567" className={styles.tel}>+1 555 123 4567</a>
        </p>
      </div>
    </section>
  );
}
