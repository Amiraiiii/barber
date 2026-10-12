import styles from "./Testimonials.module.css";

const reviews = [
  {
    id: "t1",
    quote:
      "I've been getting my hair cut my entire life. I've never left a chair and felt this good about how I look. BLACKLINE is the standard.",
    name: "Marcus T.",
    detail: "Client for 3 years",
  },
  {
    id: "t2",
    quote:
      "Alex took 15 minutes to understand exactly what I wanted and then delivered something better than I imagined. That's the difference.",
    name: "James O.",
    detail: "Regular client",
  },
  {
    id: "t3",
    quote:
      "I travel for work constantly. Finding BLACKLINE meant I finally stopped settling for mediocre cuts in random cities and made time to come here.",
    name: "Connor W.",
    detail: "Monthly visit",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section} aria-labelledby="testimonials-heading">
      <div className={styles.container}>
        <h2 className={styles.heading} id="testimonials-heading">
          What clients say
        </h2>

        <div className={styles.grid}>
          {reviews.map((r, i) => (
            <blockquote key={r.id} className={styles.quote}>
              <p className={styles.quoteText}>&ldquo;{r.quote}&rdquo;</p>
              <footer className={styles.quoteFoot}>
                <cite className={styles.quoteName}>{r.name}</cite>
                <span className={styles.quoteDetail}>{r.detail}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
