import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Providers } from "./providers"; // Import the Providers component

export const metadata: Metadata = {
  title: "Airtable",
  description: "Airtable clone",
  icons: [{ rel: "icon", url: "/airtable.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
