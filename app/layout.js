import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Vidora Downloader",
  description:
    "Download video publik yang dapat diakses secara legal. Tanpa DRM, tanpa login.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-neutral-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-semibold tracking-tight">
              Vidora
            </a>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">{children}</main>
        <footer className="border-t border-border-light dark:border-border-dark py-6 text-center text-sm text-neutral-500">
          <div className="mx-auto max-w-3xl px-4 flex flex-wrap justify-center gap-4">
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:underline">
              Terms of Service
            </a>
          </div>
          <p className="mt-2">
            Vidora tidak menyimpan file video. Gunakan hanya untuk konten yang
            Anda berhak unduh.
          </p>
        </footer>
      </body>
    </html>
  );
}
