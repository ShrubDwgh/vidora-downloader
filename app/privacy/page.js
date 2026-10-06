export const metadata = { title: "Privacy Policy — Vidora" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Terakhir diperbarui: 6 Oktober 2026
      </p>

      <h2 className="text-lg font-semibold mt-6">1. Data yang Kami Proses</h2>
      <p>
        Vidora tidak meminta akun, email, atau data pribadi. Saat Anda
        mengirimkan URL video, URL tersebut diproses di server untuk mengambil
        metadata dan menyiapkan download. URL tidak disimpan secara permanen.
      </p>

      <h2 className="text-lg font-semibold mt-6">2. File Video</h2>
      <p>
        File video tidak disimpan di server Vidora. Proses download dilakukan
        dengan streaming langsung dari sumber ke perangkat Anda. Tidak ada
        salinan file yang tersisa setelah proses selesai.
      </p>

      <h2 className="text-lg font-semibold mt-6">3. Log</h2>
      <p>
        Kami dapat mencatat alamat IP dan URL yang diminta dalam log server
        sementara untuk keperluan keamanan dan rate limiting. Log ini tidak
        dibagikan ke pihak ketiga dan dihapus secara berkala.
      </p>

      <h2 className="text-lg font-semibold mt-6">4. Cookie</h2>
      <p>
        Vidora hanya menggunakan penyimpanan lokal browser untuk preferensi
        tema (light/dark). Tidak ada cookie pelacakan atau iklan.
      </p>

      <h2 className="text-lg font-semibold mt-6">5. Kontak</h2>
      <p>
        Untuk pertanyaan privasi, hubungi pemilik repositori melalui issue di
        GitHub.
      </p>
    </article>
  );
}
