import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "RentFlow | Rental Management",
  description: "Rental operations, rent collection and owner reporting in one place."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}