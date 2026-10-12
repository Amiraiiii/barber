import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "BLACKLINE BARBERS — Sharp cuts. Clean confidence.",
  description:
    "Precision grooming for people who care about the details. Premium barbershop offering classic haircuts, skin fades, beard trims and more.",
  keywords: "barbershop, haircut, skin fade, beard trim, premium grooming, men's grooming",
  openGraph: {
    title: "BLACKLINE BARBERS",
    description: "Sharp cuts. Clean confidence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
