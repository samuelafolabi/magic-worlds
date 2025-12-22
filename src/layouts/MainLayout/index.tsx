import React, { ReactNode } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import CursorTrail from "@/components/CursorTrail";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "7xl" | "full";
  headerRight?: ReactNode;
}

export default function MainLayout({
  children,
  title = "Magic Worlds",
  description = "Explore magical worlds and embark on incredible adventures",
  maxWidth = "7xl",
  headerRight,
}: MainLayoutProps) {
  const maxWidthClass = maxWidth === "full" ? "max-w-full" : "max-w-7xl";
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>

      <div className="flex min-h-screen flex-col relative">
        {/* Cursor Trail Effect */}
        <CursorTrail />

        {/* Sticky Background Image */}
        <div
          className="fixed inset-0 -z-10 w-full h-full"
          style={{
            backgroundImage:
              "url(/Gemini_Generated_Image_dsqafvdsqafvdsqa.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        />
        {/* Dark overlay for better content readability */}
        <div className="fixed inset-0 -z-10 bg-black/40 dark:bg-black/60" />

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Magic Worlds Logo"
                  width={180}
                  height={60}
                  priority
                  className="h-10 w-auto"
                />
              </div>
              {headerRight && (
                <div className="flex items-center gap-3">{headerRight}</div>
              )}
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full relative z-10">
          <div className={`mx-auto ${maxWidthClass} px-4 sm:px-6 lg:px-8 py-8`}>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="col-span-1 md:col-span-2">
                <div className="mb-4">
                  <Image
                    src="/logo.png"
                    alt="Magic Worlds Logo"
                    width={180}
                    height={60}
                    className="h-10 w-auto"
                  />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                  Embark on incredible adventures across magical realms.
                  Discover new worlds, meet fascinating characters, and create
                  your own legendary story.
                </p>
              </div>

              {/* Connect */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 capitalize">
                  Connect
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://www.themagicworlds.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      Website
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com/MagicWorlds3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      X (Twitter)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://youtube.com/@MagicworldsTV"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      YouTube
                    </a>
                  </li>
                </ul>
              </div>

              {/* Community */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 capitalize">
                  Community
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://facebook.com/magicworldsonline"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://instagram.com/magikworlds"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  © {new Date().getFullYear()} Magic Worlds. All rights
                  reserved.
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href="https://twitter.com/MagicWorlds3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    aria-label="X (Twitter)"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com/@MagicworldsTV"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    aria-label="YouTube"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com/magicworldsonline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    aria-label="Facebook"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com/magikworlds"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-[#40b0bf] dark:hover:text-[#40b0bf]/80 transition-colors duration-200"
                    aria-label="Instagram"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
