import Link from "next/link";
import HeroSlip from "./HeroSlip";
import ScrollReveal from "./ScrollReveal";
import ThemeToggle from "./ThemeToggle";

const SAMPLE_ROWS = [
  { email: "getrina.tani21@gmail.com", at: "09.12", status: "ok", label: "Diterima", note: "+Rp2.500" },
  { email: "getbudi.santoso@gmail.com", at: "09.40", status: "chk", label: "Di cek", note: "" },
  { email: "getayu99@gmail.com", at: "10.05", status: "pend", label: "Pending", note: "" },
  { email: "getdedi.lama@gmail.com", at: "10.31", status: "bad", label: "Ditolak", note: "akun tidak aktif" },
] as const;

export default function Landing() {
  return (
    <>
      <ScrollReveal />
      <a className="skip" href="#main">
        Langsung ke isi
      </a>

      <header className="wrap masthead">
        <Link className="brand" href="/" aria-label="StorGet, beranda">
          storget<span className="brand-dot">.</span>
        </Link>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#cara">Cara kerja</a>
          <a href="#cek">Coba cek format</a>
          <a href="#saldo">Saldo &amp; tarik</a>
          <a href="#ketentuan">Ketentuan</a>
        </nav>
        <div className="masthead-actions">
          <ThemeToggle />
          <Link className="btn btn-line btn-sm" href="/app">
            Masuk
          </Link>
        </div>
      </header>

      <nav className="wrap mobile-nav" aria-label="Navigasi cepat mobile">
        <a href="#cara">Cara kerja</a>
        <a href="#cek">Cek format</a>
        <a href="#saldo">Saldo &amp; tarik</a>
        <a href="#ketentuan">Ketentuan</a>
      </nav>

      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div>
            <h1 className="display" id="hero-title">
              <span className="overprint" data-print="Setor Gmail.">
                Setor Gmail.
              </span>
              <br />
              <span className="overprint ink-blue" data-print="Dibayar Rp2.500.">
                Dibayar Rp2.500.
              </span>
            </h1>
            <p className="hero-description">
              Setiap Gmail yang lolos pengecekan dibayar <strong>Rp2.500</strong>. Saldo masuk otomatis setelah
              disetujui admin.
            </p>
            <p className="hero-description">
              Tarik ke DANA, OVO, GoPay, atau rekening bank mulai Rp5.000.
            </p>
            <div className="hero-actions">
              <Link className="btn" href="/app">
                Mulai setor
              </Link>
              <a className="text-link" href="#ketentuan">
                Baca syarat dulu
              </a>
            </div>
            <p className="hero-note">Batas setor 20 Gmail per hari. Estimasi pengecekan sekitar 24–30 jam.</p>
          </div>

          <HeroSlip />
        </section>

        <div className="strip">
          <div className="wrap strip-inner">
            <p>Rp2.500 untuk setiap Gmail yang diterima.</p>
            <p>Status jelas dari Pending sampai Diterima.</p>
            <p>Tarik saldo mulai Rp5.000.</p>
          </div>
        </div>

        <section className="intro wrap" id="cara" aria-labelledby="intro-title" data-reveal>
          <h2 className="display" id="intro-title">
            Satu alamat.
            <br />
            Satu slip.
            <br />
            Satu status.
          </h2>
          <div className="intro-copy">
            <p>
              Tempel alamat Gmail berawalan <strong>get</strong> dan kata sandinya. Begitu disetor, alamat itu masuk
              antrean pengecekan dan statusnya bisa kamu pantau di Riwayat.
            </p>
            <p>
              Hanya Gmail berstatus Diterima yang dibayar. Saldo dihitung dari jumlah Gmail diterima dikali harga Gmail
              yang berlaku saat verifikasi.
            </p>
          </div>
        </section>

        <section className="section wrap" aria-labelledby="flow-title">
          <div className="section-heading" data-reveal>
            <h2 className="display" id="flow-title">
              Dari setor sampai saldo.
            </h2>
            <p>Empat status yang akan kamu lihat di setiap alamat yang disetor.</p>
          </div>

          <div className="flow">
            <div className="flow-step" data-reveal>
              <h3>
                <span className="tag t-pend">Pending</span>
              </h3>
              <p>Status awal setiap storan, tepat setelah kamu menekan tombol setor.</p>
            </div>
            <div className="flow-step" data-reveal data-reveal-delay="1">
              <h3>
                <span className="tag t-chk">Di cek</span>
              </h3>
              <p>Akun sedang diperiksa apakah masih aktif. Estimasinya sekitar 24–30 jam.</p>
            </div>
            <div className="flow-step" data-reveal data-reveal-delay="2">
              <h3>
                <span className="tag t-ok">Diterima</span>
              </h3>
              <p>Lolos pengecekan. Saldo bertambah Rp2.500 secara otomatis.</p>
            </div>
            <div className="flow-step" data-reveal data-reveal-delay="3">
              <h3>
                <span className="tag t-bad">Ditolak</span>
              </h3>
              <p>Akun tidak aktif atau tidak sesuai format. Storan ini tidak dibayar.</p>
            </div>
          </div>

          <div className="sample" data-reveal>
            <article className="sample-sheet" aria-label="Contoh tampilan riwayat setoran">
              <h3>Riwayat setoran</h3>
              <ul className="ledger-list">
                {SAMPLE_ROWS.map((r) => (
                  <li key={r.email}>
                    <div className="em">
                      {r.email}
                      <small>
                        {r.at}
                        {r.note ? ` · ${r.note}` : ""}
                      </small>
                    </div>
                    <span className={`tag t-${r.status}`}>{r.label}</span>
                  </li>
                ))}
              </ul>
              <p className="sample-disclosure">Contoh tampilan. Alamat di atas adalah data contoh.</p>
            </article>
            <aside className="sample-aside" aria-labelledby="sample-aside-title">
              <h3 id="sample-aside-title">
                Setiap perubahan,
                <br />
                langsung dikabari.
              </h3>
              <p>
                Notifikasi muncul saat alamat diterima untuk dicek, saat sedang dicek, dan saat lolos atau ditolak
                beserta alasannya.
              </p>
              <p>Batas setor harian terlihat di beranda, jadi kamu tahu sisa kuota hari ini.</p>
            </aside>
          </div>
        </section>

        <section className="split wrap" id="saldo" aria-labelledby="saldo-title" data-reveal>
          <div className="split-copy">
            <h2 className="display" id="saldo-title">
              Saldo kamu,
              <br />
              tarik ke dompetmu.
            </h2>
            <p>
              Minimal tarik Rp5.000. Isi metode dan nomor tujuan, lalu ajukan. Penarikan bisa dilakukan saat fitur
              penarikan sedang dibuka admin.
            </p>
            <ul className="methods" aria-label="Metode penarikan">
              <li>DANA</li>
              <li>OVO</li>
              <li>GoPay</li>
              <li>Bank</li>
            </ul>
          </div>

          <div className="referral-panel">
            <h3>
              Undang 20 teman,
              <br />
              dapat Rp15.000.
            </h3>
            <p>
              Setiap akun punya kode dan link undangan sendiri. Referral dihitung berhasil setelah teman melakukan stor
              Gmail pertama yang diterima.
            </p>
            <dl className="tools">
              <div>
                <dt>Checker email</dt>
                <dd>Tempel sampai 20 email, satu per baris, untuk cek apakah akunnya aktif.</dd>
              </div>
              <div>
                <dt>Leaderboard</dt>
                <dd>Peringkat berdasarkan jumlah Gmail yang diterima.</dd>
              </div>
              <div>
                <dt>Chat admin</dt>
                <dd>Ada kendala saat setor atau tarik saldo? Tulis langsung ke admin.</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="terms wrap" id="ketentuan" aria-labelledby="terms-title" data-reveal>
          <div className="terms-copy">
            <h2 className="display" id="terms-title">
              Baca dulu,
              <br />
              baru setor.
            </h2>
            <p>
              Dengan menggunakan website ini dan melakukan stor Gmail, kamu dianggap telah membaca, memahami, dan
              menyetujui seluruh Syarat &amp; Ketentuan.
            </p>
          </div>

          <div className="faq">
            <details open>
              <summary>Gmail siapa yang boleh disetor?</summary>
              <div>
                <p>
                  Hanya Gmail milik sendiri atau yang sudah diberi izin oleh pemiliknya. Dilarang menyetorkan Gmail
                  milik orang lain tanpa izin. Seluruh proses stor dilakukan secara sukarela, atas kemauan sendiri.
                </p>
              </div>
            </details>
            <details>
              <summary>Format apa yang diterima?</summary>
              <div>
                <ul>
                  <li>Hanya alamat @gmail.com yang valid, satu alamat per baris.</li>
                  <li>Wajib diawali get, setelahnya bebas. Contoh: getbudi21@gmail.com.</li>
                  <li>Kata sandi minimal 8 karakter, dan alamat belum pernah disetor sebelumnya.</li>
                  <li>Spasi di awal dan akhir dihapus otomatis, duplikat dihapus, huruf besar dan kecil dianggap sama.</li>
                  <li>Jika Rules Angka aktif, Gmail wajib diakhiri angka 1–100. Admin dapat mengaktifkan atau menonaktifkannya.</li>
                </ul>
              </div>
            </details>
            <details>
              <summary>Berapa lama pengecekannya?</summary>
              <div>
                <p>
                  Status awal setiap storan adalah Pending. Estimasi pengecekan sekitar 24–30 jam. Setelah
                  diverifikasi, status berubah menjadi Diterima atau Ditolak, dan hanya yang Diterima mendapat
                  pembayaran.
                </p>
              </div>
            </details>
            <details>
              <summary>Kapan saldo bisa ditarik?</summary>
              <div>
                <p>
                  Saldo masuk otomatis setelah admin menyetujui Gmail. Penarikan mulai Rp5.000 dan hanya bisa
                  dilakukan jika fitur penarikan sedang dibuka admin.
                </p>
              </div>
            </details>
            <details>
              <summary>Apa yang dilarang?</summary>
              <div>
                <p>
                  Mengirim Gmail palsu atau tidak valid, mengirim Gmail yang sama berulang kali, dan menyalahgunakan
                  sistem dalam bentuk apa pun. Pelanggaran dapat menyebabkan Gmail ditolak, saldo dibatalkan, atau
                  akun diblokir permanen.
                </p>
              </div>
            </details>
            <details>
              <summary>Apakah website ini bagian dari Google?</summary>
              <div>
                <p>
                  Tidak. Website ini tidak berafiliasi dengan Google. Pengguna bertanggung jawab penuh atas data yang
                  disetorkan dan wajib mematuhi ketentuan Google serta peraturan perundang-undangan yang berlaku. Admin
                  berhak mengubah syarat dan ketentuan sewaktu-waktu.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section className="closing" aria-labelledby="closing-title" data-reveal>
          <div className="wrap closing-inner">
            <h2 className="display" id="closing-title">
              Alamat pertamamu
              <br />
              menunggu di slip.
            </h2>
            <div className="closing-action">
              <Link className="btn" href="/app">
                Masuk atau daftar
              </Link>
              <p>Baca Syarat &amp; Ketentuan sebelum menyetor.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer wrap">
        <Link className="brand" href="/" aria-label="StorGet, kembali ke atas">
          storget<span className="brand-dot">.</span>
        </Link>
        <p className="footer-message">Tidak berafiliasi dengan Google.</p>
        <div className="footer-end">
          <a href="#ketentuan">Syarat &amp; Ketentuan</a>
          <span>© 2026 StorGet</span>
        </div>
      </footer>
    </>
  );
}
