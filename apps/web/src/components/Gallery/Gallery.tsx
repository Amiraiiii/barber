import Image from "next/image";
import styles from "./Gallery.module.css";

const items = [
  {
    src: "/images/gallery-cut.jpg",
    alt: "Master barber executing a precision skin fade",
    label: "Skin Fade",
    category: "Classic Cut",
    desc: "Clean lines, sharp taper — the kind of fade that holds its shape for weeks.",
    size: "tall",
  },
  {
    src: "/images/tools.jpg",
    alt: "Professional barber tools laid on marble",
    label: "The Tools",
    category: "Craft",
    desc: "German-steel shears. Japanese razors. Every instrument chosen for a reason.",
    size: "square",
  },
  {
    src: "/images/interior.jpg",
    alt: "Blackline Barbers interior",
    label: "The Space",
    category: "Atmosphere",
    desc: "Designed to feel like somewhere worth being. Not just somewhere to sit.",
    size: "square",
  },
  {
    src: "/images/gallery-beard.jpg",
    alt: "Precision beard sculpting close-up",
    label: "Beard Work",
    category: "Grooming",
    desc: "Sculpted, not trimmed. Structured to complement your face, not fight it.",
    size: "wide",
  },
  {
    src: "/images/gallery-style.jpg",
    alt: "Modern textured cut and styling finish",
    label: "Texture & Style",
    category: "Modern Cut",
    desc: "Contemporary cuts with a deliberate finish — styled, never forced.",
    size: "tall",
  },
];

export default function Gallery() {
  return (
    <section className={styles.section} id="gallery" aria-labelledby="gallery-heading">
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading} id="gallery-heading">
            <em>The work</em>
          </h2>
          <div className={styles.headerMeta}>
            <p className={styles.headerSub}>
              Every cut is a considered decision — from the first consultation
              to the final detail.
            </p>
            <span className={styles.count}>05 selected</span>
          </div>
        </div>

        <div className={styles.grid}>
          {items.map((item, i) => (
            <div key={i} className={`${styles.cell} ${styles[`cell_${item.size}`]}`}>
              <div className={styles.imgWrap}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={styles.img}
                />
                <div className={styles.imgOverlay} />

                {/* Category tag */}
                <span className={styles.tag}>{item.category}</span>

                {/* Hover caption */}
                <div className={styles.caption}>
                  <p className={styles.captionLabel}>{item.label}</p>
                  <p className={styles.captionDesc}>{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className={styles.footer}>
          <p className={styles.footerNote}>
            Results speak for themselves.
          </p>
          <a href="#book" className={styles.footerCta}>
            Book your cut
          </a>
        </div>
      </div>
    </section>
  );
}
