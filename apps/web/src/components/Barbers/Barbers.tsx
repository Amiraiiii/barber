"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Barbers.module.css";

const barbers = [
  {
    id: "alex",
    name: "Alex",
    title: "Master Barber",
    years: "12 years",
    specialty: "Skin fades, classic cuts, hair design",
    bio: "Alex has been behind the chair for over a decade. He reads a face before he picks up a scissor.",
    image: "/images/barbers/alex.jpg",
  },
  {
    id: "daniel",
    name: "Daniel",
    title: "Senior Barber",
    years: "8 years",
    specialty: "Beard sculpting, tapers, scissor work",
    bio: "Detail-oriented and deliberate, Daniel is the barber people recommend to their friends.",
    image: "/images/barbers/daniel.jpg",
  },
  {
    id: "ryan",
    name: "Ryan",
    title: "Barber",
    years: "4 years",
    specialty: "Textured cuts, modern styles, hot towel shaves",
    bio: "Ryan brings a contemporary eye to classic technique. Always up to date, never trendy.",
    image: "/images/barbers/ryan.jpg",
  },
];

export default function Barbers() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className={styles.section} id="barbers" aria-labelledby="barbers-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Craft & Excellence</span>
            <h2 className={styles.heading} id="barbers-heading">
              The<br /><em>barbers</em>
            </h2>
          </div>
          <p className={styles.subheading}>
            Three master craftsmen. Unique in technique,<br />
            uncompromising in standard.
          </p>
        </div>

        <div className={styles.grid}>
          {barbers.map((b) => (
            <article
              key={b.id}
              className={`${styles.card} ${hovered === b.id ? styles.cardHovered : ""} ${
                hovered && hovered !== b.id ? styles.cardDim : ""
              }`}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Portrait Image container */}
              <div className={styles.portrait}>
                <Image
                  src={b.image}
                  alt={`Portrait of ${b.name}, ${b.title}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className={styles.portraitImg}
                  priority
                />
                <div className={styles.portraitGradient} />
                
                {/* Experience Badge */}
                <div className={styles.expBadge}>
                  <span>{b.years} exp.</span>
                </div>

                {/* Hover Specialty Reveal */}
                <div className={styles.portraitReveal}>
                  <div className={styles.revealContent}>
                    <span className={styles.revealTag}>Specialization</span>
                    <p className={styles.revealSpecialty}>{b.specialty}</p>
                    <a href="#book" className={styles.bookBarberBtn}>
                      Book with {b.name}
                    </a>
                  </div>
                </div>
              </div>

              <div className={styles.info}>
                <div className={styles.nameLine}>
                  <h3 className={styles.name}>{b.name}</h3>
                  <span className={styles.title}>{b.title}</span>
                </div>
                <p className={styles.bio}>{b.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

