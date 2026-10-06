import Downloader from "@/components/Downloader";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Download video publik
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl">
          Tempel URL video yang dapat diakses secara publik. Vidora akan
          menganalisis format yang tersedia dan menyiapkan download langsung.
          Tidak ada file yang disimpan di server.
        </p>
      </div>

      <Downloader />

      <div className="rounded-lg border border-border-light dark:border-border-dark p-4 text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">
          Batasan yang berlaku:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tidak mendukung DRM, login, paywall, atau captcha.</li>
          <li>
            Hanya video yang dapat diakses langsung oleh server tanpa
            kredensial.
          </li>
          <li>
            Ukuran file dibatasi untuk mencegah penyalahgunaan. File besar
            mungkin gagal.
          </li>
          <li>
            Sumber yang memblokir akses server akan mengembalikan error yang
            jelas.
          </li>
        </ul>
      </div>
    </div>
  );
}
