export const metadata = { title: "Terms of Service — Vidora" };

export default function TermsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Terakhir diperbarui: 6 Oktober 2026
      </p>

      <h2 className="text-lg font-semibold mt-6">1. Penggunaan yang Diizinkan</h2>
      <p>
        Vidora hanya boleh digunakan untuk mengunduh video yang Anda miliki
        haknya, konten domain publik, atau konten yang secara eksplisit
        diizinkan untuk diunduh oleh pemiliknya. Anda bertanggung jawab penuh
        atas kepatuhan terhadap hukum hak cipta yang berlaku.
      </p>

      <h2 className="text-lg font-semibold mt-6">2. Larangan</h2>
      <p>
        Anda dilarang menggunakan Vidora untuk melewati DRM, autentikasi,
        paywall, captcha, atau kontrol akses lainnya. Vidora tidak akan
        memproses permintaan yang memerlukan pelanggaran kontrol tersebut.
      </p>

      <h2 className="text-lg font-semibold mt-6">3. Batasan Layanan</h2>
      <p>
        Layanan disediakan "as is" tanpa jaminan. Kami tidak menjamin
        ketersediaan, kecepatan, atau kompatibilitas dengan semua sumber video.
        Sumber yang memblokir akses server dapat menyebabkan kegagalan.
      </p>

      <h2 className="text-lg font-semibold mt-6">4. Batas Penggunaan</h2>
      <p>
        Kami menerapkan rate limiting dan batas ukuran file untuk mencegah
        penyalahgunaan. Permintaan yang melebihi batas akan ditolak.
      </p>

      <h2 className="text-lg font-semibold mt-6">5. Perubahan</h2>
      <p>
        Ketentuan ini dapat berubah sewaktu-waktu. Penggunaan berkelanjutan
        berarti Anda menyetujui versi terbaru.
      </p>
    </article>
  );
}
