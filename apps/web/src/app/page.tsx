import Nav from "@/components/Nav/Nav";
import Hero from "@/components/Hero/Hero";
import Intro from "@/components/Intro/Intro";
import Services from "@/components/Services/Services";
import Experience from "@/components/Experience/Experience";
import Barbers from "@/components/Barbers/Barbers";
import Gallery from "@/components/Gallery/Gallery";
import Testimonials from "@/components/Testimonials/Testimonials";
import BookCTA from "@/components/BookCTA/BookCTA";
import Footer from "@/components/Footer/Footer";
import ProgressBar from "@/components/ProgressBar/ProgressBar";

export default function HomePage() {
  return (
    <>
      <ProgressBar />
      <Nav />
      <main>
        <Hero />
        <Intro />
        <Services />
        <Experience />
        <Barbers />
        <Gallery />
        <Testimonials />
        <BookCTA />
      </main>
      <Footer />
    </>
  );
}
