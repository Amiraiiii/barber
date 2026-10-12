import Image from "next/image";
import styles from "./Intro.module.css";

export default function Intro() {
  return (
    <section className={styles.section} aria-label="Brand statement">
      <div className={styles.grid}>
        {/* Left: statement */}
        <div className={styles.text}>
          <h2 className={`t-display ${styles.statement}`}>
            More than<br />
            a haircut.<br />
            <em>It&rsquo;s your<br />signature.</em>
          </h2>

          <div className={styles.body}>
            <p>
              BLACKLINE BARBERS is built around one idea: that how you
              carry yourself starts with how you look. We work with
              precision, take the time to understand your style, and
              deliver results that last.
            </p>
            <p>
              No shortcuts. No assembly line. Just skilled hands,
              quality products and a standard we hold to every single time.
            </p>
            <a href="#services" className={styles.link}>
              View our services
            </a>
          </div>
        </div>

        {/* Right: editorial image */}
        <div className={styles.imgWrap} aria-hidden="true">
          <Image
            src="/images/tools.jpg"
            alt="Barber scissors and comb on slate"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.img}
          />
          <div className={styles.imgOverlay} />
        </div>
      </div>
    </section>
  );
}
