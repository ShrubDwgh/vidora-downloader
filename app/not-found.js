export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Halaman tidak ditemukan.
      </p>
      <a
        href="/"
        className="rounded-lg bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-sm font-medium text-white dark:text-neutral-900 hover:opacity-90 transition"
      >
        Kembali ke Beranda
      </a>
    </div>
  );
}
