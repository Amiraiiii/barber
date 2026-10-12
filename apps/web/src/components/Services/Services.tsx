"use client";

import { useRef, useState } from "react";
import styles from "./Services.module.css";

const services = [
  {
    id: "classic",
    name: "Classic Haircut",
    price: "$25",
    duration: "45 min",
    desc: "A timeless cut shaped to your head and face. Clean lines, precise finish.",
  },
  {
    id: "fade",
    name: "Skin Fade",
    price: "$30",
    duration: "50 min",
    desc: "Zero to full — blended with exactness. The definitive modern cut.",
  },
  {
    id: "beard",
    name: "Beard Trim",
    price: "$18",
    duration: "25 min",
    desc: "Sculpted edges, defined shape. Beard work that completes the look.",
  },
  {
    id: "combo",
    name: "Hair + Beard",
    price: "$40",
    duration: "70 min",
    desc: "Full treatment. Head-to-jaw refinement for a complete, considered appearance.",
  },
  {
    id: "premium",
    name: "Premium Grooming",
    price: "$50",
    duration: "90 min",
    desc: "The full ritual. Haircut, beard, hot towel, scalp massage. The best of BLACKLINE.",
  },
];

export default function Services() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <section className={styles.section} id="services" aria-labelledby="services-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.heading} id="services-heading">Services</h2>
          <p className={styles.note}>All cuts include a consultation and finish.</p>
        </div>

        <ul className={styles.list} ref={listRef} role="list">
          {services.map((svc, i) => (
            <li
              key={svc.id}
              className={`${styles.item} ${activeIndex === i ? styles.itemActive : ""} ${
                activeIndex !== null && activeIndex !== i ? styles.itemDim : ""
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className={styles.itemInner}>
                <span className={styles.itemNum}>0{i + 1}</span>
                <h3 className={styles.itemName}>{svc.name}</h3>
                <p className={styles.itemDesc}>{svc.desc}</p>
                <div className={styles.itemMeta}>
                  <span className={styles.itemDuration}>{svc.duration}</span>
                  <span className={styles.itemPrice}>{svc.price}</span>
                </div>
              </div>
              <div className={styles.itemLine} aria-hidden="true" />
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <a href="#book" className="btn-primary" id="services-book-btn">
            Book a service
          </a>
        </div>
      </div>
    </section>
  );
}
