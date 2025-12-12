import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Orbitron, Montserrat } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${orbitron.variable} ${montserrat.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
