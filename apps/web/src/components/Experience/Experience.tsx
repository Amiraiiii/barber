import styles from "./Experience.module.css";

const principles = [
  {
    word: "Precision",
    body: "Every cut is measured. Every line is intentional. We don't guess.",
  },
  {
    word: "Personal style",
    body: "We work with your face, your hair, your life — not a template.",
  },
  {
    word: "Craft",
    body: "Years of work behind every technique. Skill you can see and feel.",
  },
  {
    word: "Confidence",
    body: "Leave looking exactly how you wanted to feel when you walked in.",
  },
];

export default function Experience() {
  return (
    <section className={styles.section} aria-labelledby="exp-heading">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle} id="exp-heading">
          The Blackline<br />
          <em>Experience</em>
        </h2>

        <div className={styles.grid}>
          {principles.map((p, i) => (
            <div className={styles.item} key={p.word}>
              <div className={styles.itemBody}>
                <h3 className={styles.itemWord}>{p.word}</h3>
                <p className={styles.itemText}>{p.body}</p>
              </div>
              <div className={styles.itemBorder} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
