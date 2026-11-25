"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import ThemeToggle from "../ThemeToggle";
import {
  CHECKER_RULE,
  DAILY_LIMIT,
  EMAIL_RULE,
  MIN_WITHDRAW,
  PRICE,
  REF_BONUS,
  REF_TARGET,
  rp,
} from "@/lib/setor";

type Tab =
  | "home"
  | "riwayat"
  | "stor"
  | "check"
  | "saldo"
  | "profil"
  | "ref"
  | "lb"
  | "tnc";

type SubStatus = "ok" | "pend" | "bad" | "chk";

interface Submission {
  id: string;
  email: string;
  status: SubStatus;
  at: string;
  reason?: string;
}

interface Notif {
  id: string;
  text: string;
  at: string;
  unread: boolean;
}

interface RefFriend {
  name: string;
  ok: boolean;
}

interface RefBonusItem {
  title: string;
  amount: number;
}

interface ChatMsg {
  sender: "u" | "a";
  text: string;
}

function TabIcon({ id }: { id: Tab }) {
  if (id === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }
  if (id === "riwayat") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (id === "stor") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
      </svg>
    );
  }
  if (id === "saldo") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M16 12h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

const PRIMARY_TABS: { id: Tab; label: string; desktopOnly?: boolean }[] = [
  { id: "home", label: "Beranda" },
  { id: "riwayat", label: "Riwayat" },
  { id: "stor", label: "Stor" },
  { id: "check", label: "Checker", desktopOnly: true },
  { id: "saldo", label: "Saldo" },
  { id: "profil", label: "Profil" },
];

const WD_METHODS = ["DANA", "OVO", "GoPay", "Bank"];

const STATUS_META: Record<SubStatus, { cls: string; label: string }> = {
  ok: { cls: "t-ok", label: "Diterima" },
  pend: { cls: "t-pend", label: "Pending" },
  bad: { cls: "t-bad", label: "Ditolak" },
  chk: { cls: "t-chk", label: "Di cek" },
};

export default function AppWorkspace() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState("");
  const [userPass, setUserPass] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bal, setBal] = useState(0);
  const [wdTotal, setWdTotal] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [items, setItems] = useState<Submission[]>([]);
  const [storEmail, setStorEmail] = useState("");
  const [storPass, setStorPass] = useState("");
  const [storErr, setStorErr] = useState("");

  const [checkRaw, setCheckRaw] = useState("");
  const [checkRes, setCheckRes] = useState<
    { email: string; cls: string; label: string }[]
  >([]);

  const [wdMethod, setWdMethod] = useState("DANA");
  const [wdNumber, setWdNumber] = useState("");
  const [wdErr, setWdErr] = useState("");
  const [wdOk, setWdOk] = useState("");

  const [refCode, setRefCode] = useState("SETOR88A");
  const [refTab, setRefTab] = useState<1 | 2>(1);
  const [refList, setRefList] = useState<RefFriend[]>([]);
  const [refBonuses, setRefBonuses] = useState<RefBonusItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(
    null
  );

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    {
      sender: "a",
      text: "Halo! Ada kendala saat setor atau tarik saldo? Tulis di sini ya.",
    },
  ]);

  const notify = (text: string) => {
    const at = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNotifs((prev) => [
      { id: Math.random().toString(36).slice(2), text, at, unread: true },
      ...prev,
    ]);
  };

  const unreadCount = useMemo(
    () => notifs.filter((n) => n.unread).length,
    [notifs]
  );

  const counts = useMemo(() => {
    const c = { ok: 0, pend: 0, bad: 0, chk: 0 };
    items.forEach((i) => {
      c[i.status]++;
    });
    return c;
  }, [items]);

  const storCheck = useMemo(() => {
    const e = storEmail.trim().toLowerCase();
    const fmtOk = EMAIL_RULE.test(e);
    const passOk = storPass.length >= 8;
    const uniqueOk = !items.some((i) => i.email === e);
    return {
      e,
      fmtOk,
      passOk,
      uniqueOk,
      touched: storEmail.length > 0 || storPass.length > 0,
      allOk: fmtOk && passOk && uniqueOk,
    };
  }, [storEmail, storPass, items]);

  const handleLogin = (ev: React.FormEvent) => {
    ev.preventDefault();
    const u = loginUser.trim();
    if (!u || loginPass.length < 6) {
      setLoginErr("Isi username dan kata sandi (min. 6 karakter).");
      return;
    }
    setLoginErr("");
    setUser(u);
    setUserPass(loginPass);
    setRefCode(Math.random().toString(36).slice(2, 10).toUpperCase());
    setLoggedIn(true);
    notify(`Selamat datang, ${u}. Harga per Gmail ${rp(PRICE)}.`);
    if (!agreed) {
      notify("Baca Syarat & Ketentuan sebelum menyetor.");
      setTab("tnc");
    } else {
      setTab("home");
    }
  };

  const handleGoogleLogin = () => {
    const googleUser = "google_user";
    setLoginErr("");
    setUser(googleUser);
    setUserPass("google-oauth-session");
    setRefCode(Math.random().toString(36).slice(2, 10).toUpperCase());
    setLoggedIn(true);
    notify(`Masuk lewat Google sebagai ${googleUser}. Harga per Gmail ${rp(PRICE)}.`);
    if (!agreed) {
      notify("Baca & setujui Syarat & Ketentuan sebelum menyetor.");
      setTab("tnc");
    } else {
      setTab("home");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setNotifOpen(false);
    setChatOpen(false);
    setTab("home");
    router.push("/");
  };

  const handleStor = (ev: React.FormEvent) => {
    ev.preventDefault();
    setStorErr("");
    if (!agreed) {
      setStorErr("Baca dan setujui Syarat & Ketentuan dulu.");
      return;
    }
    if (items.length >= DAILY_LIMIT) {
      setStorErr("Batas setor hari ini sudah habis.");
      return;
    }
    if (!storCheck.allOk) {
      setStorErr(
        "Email harus diawali “get” dan berakhiran @gmail.com, kata sandi min. 8 karakter, dan belum pernah disetor."
      );
      return;
    }

    const id = Math.random().toString(36).slice(2);
    const email = storCheck.e;
    const at = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setItems((prev) => [{ id, email, status: "pend", at }, ...prev]);
    setStorEmail("");
    setStorPass("");
    notify(`${email} diterima untuk dicek.`);
    setTab("riwayat");

    setTimeout(() => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "chk" } : it))
      );
      notify(`${email} sedang dicek.`);
    }, 1500);

    setTimeout(() => {
      const ok = Math.random() > 0.25;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: ok ? "ok" : "bad",
                reason: ok ? undefined : "akun tidak aktif",
              }
            : it
        )
      );
      if (ok) {
        setBal((b) => b + PRICE);
        notify(`${email} lolos. Saldo +${rp(PRICE)}`);
      } else {
        notify(`${email} ditolak: akun tidak aktif.`);
      }
    }, 3500);
  };

  const handleChecker = (ev: React.FormEvent) => {
    ev.preventDefault();
    const lines = checkRaw
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!lines.length) return;
    setCheckRes(
      lines.map((e) => {
        if (!CHECKER_RULE.test(e)) {
          return { email: e, cls: "t-bad", label: "Tidak valid" };
        }
        return Math.random() > 0.35
          ? { email: e, cls: "t-ok", label: "Aktif" }
          : { email: e, cls: "t-pend", label: "Tidak aktif" };
      })
    );
  };

  const handleWithdraw = (ev: React.FormEvent) => {
    ev.preventDefault();
    setWdErr("");
    setWdOk("");
    if (bal < MIN_WITHDRAW || !wdMethod.trim() || !wdNumber.trim()) {
      setWdErr(
        `Saldo minimal ${rp(MIN_WITHDRAW)} dan isi metode serta nomor tujuan.`
      );
      return;
    }
    const amount = bal;
    setWdTotal((w) => w + amount);
    setBal(0);
    setWdNumber("");
    setWdOk(`Penarikan ${rp(amount)} ke ${wdMethod} diajukan.`);
    notify(`Penarikan ${rp(amount)} diajukan.`);
  };

  const handleSimRef = () => {
    if (refList.length >= REF_TARGET) return;
    const friendName = `teman${refList.length + 1}`;
    setRefList((prev) => [{ name: friendName, ok: false }, ...prev]);
    notify(`${friendName} bergabung memakai kode kamu.`);

    setTimeout(() => {
      setRefList((prev) => {
        const updated = prev.map((f) =>
          f.name === friendName ? { ...f, ok: true } : f
        );
        const okCount = updated.filter((f) => f.ok).length;
        if (okCount === REF_TARGET) {
          setBal((b) => b + REF_BONUS);
          setRefBonuses((b) => [
            { title: "Bonus misi 20 teman", amount: REF_BONUS },
            ...b,
          ]);
          notify(`Misi selesai! Bonus ${rp(REF_BONUS)} masuk ke saldo.`);
        }
        return updated;
      });
      notify(`Stor pertama ${friendName} diterima. Referral berhasil.`);
    }, 1500);
  };

  const handleCopy = (val: string, key: string) => {
    try {
      navigator.clipboard.writeText(val);
    } catch {
      // fallback ignored
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSendChat = (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = chatInput.trim();
    if (!t) return;
    setChatMsgs((prev) => [...prev, { sender: "u", text: t }]);
    setChatInput("");
    setTimeout(() => {
      setChatMsgs((prev) => [
        ...prev,
        {
          sender: "a",
          text: "Terima kasih, pesan kamu sudah masuk. Admin akan membalas secepatnya.",
        },
      ]);
    }, 900);
  };

  const refOkCount = refList.filter((f) => f.ok).length;
  const refPercent = Math.min(100, Math.round((refOkCount / REF_TARGET) * 100));

  const leaderboardRows = useMemo(() => {
    const base = [
      { name: "rina_store", count: 142, me: false },
      { name: "dedi.gmail", count: 118, me: false },
      { name: "ayu99", count: 96, me: false },
      { name: "bagas_id", count: 77, me: false },
      { name: "sinta.pay", count: 51, me: false },
      { name: user || "kamu", count: counts.ok, me: true },
    ];
    return base.sort((a, b) => b.count - a.count);
  }, [user, counts.ok]);

  /* ---------------- LOGIN VIEW ---------------- */
  if (!loggedIn) {
    return (
      <div className="app">
        <header className="wrap masthead app-masthead">
          <Link className="brand" href="/" aria-label="Setor Gmail, kembali ke beranda">
            setor gmail<span className="brand-dot">.</span>
          </Link>
          <div className="app-tools">
            <ThemeToggle />
          </div>
        </header>

        <main className="wrap login">
          <div className="login-copy">
            <h1 className="display">
              <span className="overprint" data-print="Masuk ke">
                Masuk ke
              </span>
              <br />
              <span className="ink-blue">akun kamu.</span>
            </h1>
            <p>
              Setiap Gmail yang lolos pengecekan dibayar{" "}
              <strong>{rp(PRICE)}</strong>. Batas setor {DAILY_LIMIT} Gmail per
              hari.
            </p>
          </div>

          <div className="login-form">
            <form onSubmit={handleLogin}>
              <h2 className="display">
                {authMode === "login" ? "Masuk" : "Daftar akun"}
              </h2>

              <label className="field">
                <span className="field-label">Username</span>
                <input
                  className="input"
                  autoComplete="username"
                  placeholder="mis. budi123"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Kata sandi</span>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Minimal 6 karakter"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
              </label>

              {loginErr && <p className="msg msg-bad">{loginErr}</p>}

              <button
                type="submit"
                className="btn btn-block"
                style={{ marginTop: 20 }}
              >
                {authMode === "login" ? "Masuk" : "Daftar"}
              </button>

              <div className="divider-or">atau</div>

              <button
                type="button"
                className="btn-google"
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12Z"
                  />
                  <path
                    fill="#34A853"
                    d="M3.5 7.4 6.7 9.7C7.6 7.4 9.6 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.5 7.4Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 21.6c2.5 0 4.7-.8 6.2-2.3l-2.9-2.4c-.8.6-1.9 1-3.3 1-2.5 0-4.7-1.7-5.5-4l-3.2 2.5c1.6 3.1 4.9 5.2 8.7 5.2Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.2 14.3c0-.5-.1-.9-.1-1.3H12v3.9h5.4c-.3 1.4-1.1 2.4-2.1 3.1l2.9 2.4c1.7-1.6 3-4 3-8.1Z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>

              <p className="login-switch">
                {authMode === "login"
                  ? "Belum punya akun? "
                  : "Sudah punya akun? "}
                <button
                  type="button"
                  className="text-link"
                  style={{ minHeight: "auto" }}
                  onClick={() => {
                    setAuthMode((m) => (m === "login" ? "register" : "login"));
                    setLoginErr("");
                  }}
                >
                  {authMode === "login" ? "Daftar" : "Masuk"}
                </button>
              </p>
            </form>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- AUTHENTICATED APP ---------------- */
  return (
    <div className="app">
      <a className="skip" href="#app-main">
        Langsung ke isi
      </a>

      <header className="wrap masthead app-masthead">
        <Link className="brand" href="/" aria-label="Setor Gmail, halaman depan">
          setor gmail<span className="brand-dot">.</span>
        </Link>

        <div className="app-tools">
          <ThemeToggle />

          <button
            type="button"
            className="btn btn-line btn-sm"
            aria-expanded={notifOpen}
            onClick={() => {
              setNotifOpen((o) => !o);
              setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
            }}
          >
            Notifikasi
            {unreadCount > 0 && <span className="count">{unreadCount}</span>}
          </button>

          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={handleLogout}
          >
            Keluar
          </button>

          {notifOpen && (
            <div className="notif-panel" role="region" aria-label="Daftar notifikasi">
              {notifs.length === 0 ? (
                <p className="empty">Belum ada notifikasi.</p>
              ) : (
                <ul className="ledger-list">
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <div>
                        {n.text}
                        <small>{n.at}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      <nav className="wrap tabs" aria-label="Menu aplikasi">
        {PRIMARY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${t.id === "stor" ? " tab-stor" : ""}${t.desktopOnly ? " tab-desktop-only" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => {
              setTab(t.id);
              setNotifOpen(false);
            }}
          >
            <span className="tab-ico">
              <TabIcon id={t.id} />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="wrap view" id="app-main">
        {/* BERANDA */}
        {tab === "home" && (
          <>
            <div className="home-top">
              <div>
                <p className="field-label">Saldo saat ini</p>
                <h1 className="display balance-title num">{rp(bal)}</h1>
                <p className="balance-rate">
                  Harga per Gmail: <strong>{rp(PRICE)}</strong>
                </p>
                <div className="balance-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setTab("saldo")}
                  >
                    Tarik saldo
                  </button>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setTab("riwayat")}
                  >
                    Riwayat
                  </button>
                </div>
              </div>

              <div className="limit">
                <div className="limit-row">
                  <h2>Batas setor hari ini</h2>
                  <span className="num">
                    {items.length}/{DAILY_LIMIT} · Sisa{" "}
                    {Math.max(0, DAILY_LIMIT - items.length)}
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.min(100, (items.length / DAILY_LIMIT) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mobile-quick" aria-label="Akses cepat mobile">
              <button type="button" onClick={() => setTab("check")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span>Checker</span>
              </button>
              <button type="button" onClick={() => setTab("ref")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Referral</span>
              </button>
              <button type="button" onClick={() => setTab("lb")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5h4m12 4h2a2 2 0 0 0 2-2V5h-4M6 4h12v6a6 6 0 0 1-12 0V4Zm6 12v5m-4 0h8" />
                </svg>
                <span>Peringkat</span>
              </button>
              <button type="button" onClick={() => setTab("tnc")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8M8 17h5" />
                </svg>
                <span>Aturan</span>
              </button>
            </div>

            <dl className="ledger">
              <div>
                <dt>
                  <span className="tag t-ok">Diterima</span>
                </dt>
                <dd>{counts.ok}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag t-pend">Pending</span>
                </dt>
                <dd>{counts.pend}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag t-bad">Ditolak</span>
                </dt>
                <dd>{counts.bad}</dd>
              </div>
              <div>
                <dt>
                  <span className="tag t-chk">Di cek</span>
                </dt>
                <dd>{counts.chk}</dd>
              </div>
            </dl>

            <div className="home-lower">
              <div>
                <h2 className="display">Syarat Gmail yang diterima</h2>
                <ul className="rules">
                  <li>Alamat diawali “get”, setelahnya bebas, berakhiran @gmail.com</li>
                  <li>Kata sandi minimal 8 karakter</li>
                  <li>Belum pernah disetor sebelumnya</li>
                  <li>Akun masih aktif saat dicek</li>
                </ul>
              </div>

              <div>
                <h2 className="display" style={{ marginBottom: 18 }}>
                  Menu lain
                </h2>
                <ul className="more">
                  <li>
                    <button type="button" onClick={() => setTab("ref")}>
                      Referral
                      <span>
                        {refOkCount}/{REF_TARGET} teman
                      </span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setTab("lb")}>
                      Leaderboard
                      <span>Peringkat Gmail diterima</span>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setTab("tnc")}>
                      Syarat &amp; Ketentuan
                      <span>{agreed ? "Sudah disetujui" : "Wajib dibaca"}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* STOR */}
        {tab === "stor" && (
          <>
            <h1 className="display view-title">Setor Gmail</h1>
            <p className="view-lede">
              Setiap Gmail yang lolos pengecekan dibayar {rp(PRICE)}. Pastikan
              memenuhi semua syarat di samping.
            </p>

            <div className="work">
              <form className="work-main" onSubmit={handleStor}>
                <label className="field" style={{ marginTop: 0 }}>
                  <span className="field-label">Email</span>
                  <input
                    className="input"
                    type="email"
                    autoComplete="off"
                    placeholder="getnama123@gmail.com"
                    value={storEmail}
                    onChange={(e) => setStorEmail(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Kata sandi email</span>
                  <input
                    className="input"
                    type="text"
                    autoComplete="off"
                    placeholder="Minimal 8 karakter"
                    value={storPass}
                    onChange={(e) => setStorPass(e.target.value)}
                  />
                </label>

                {storErr && <p className="msg msg-bad">{storErr}</p>}

                <button type="submit" className="btn btn-block">
                  Setor, dapat {rp(PRICE)}
                </button>
              </form>

              <aside className="work-side" aria-label="Syarat format setoran">
                <h2 className="display">Syarat format</h2>
                <p>Semua syarat harus terpenuhi sebelum dikirim.</p>
                <ul className="rules">
                  <li>
                    <span>Diawali “get” dan berakhiran @gmail.com</span>
                    <span
                      className={`rule-state ${
                        storCheck.fmtOk
                          ? "is-ok"
                          : storCheck.touched
                            ? "is-no"
                            : ""
                      }`}
                    >
                      {storCheck.fmtOk
                        ? "Sesuai"
                        : storCheck.touched
                          ? "Belum"
                          : "Menunggu"}
                    </span>
                  </li>
                  <li>
                    <span>Kata sandi min. 8 karakter</span>
                    <span
                      className={`rule-state ${
                        storCheck.passOk
                          ? "is-ok"
                          : storCheck.touched
                            ? "is-no"
                            : ""
                      }`}
                    >
                      {storCheck.passOk
                        ? "Sesuai"
                        : storCheck.touched
                          ? "Belum"
                          : "Menunggu"}
                    </span>
                  </li>
                  <li>
                    <span>Belum pernah disetor</span>
                    <span
                      className={`rule-state ${
                        storCheck.uniqueOk || !storCheck.e
                          ? "is-ok"
                          : "is-no"
                      }`}
                    >
                      {storCheck.uniqueOk || !storCheck.e
                        ? "Sesuai"
                        : "Duplikat"}
                    </span>
                  </li>
                </ul>
              </aside>
            </div>
          </>
        )}

        {/* CHECKER */}
        {tab === "check" && (
          <>
            <h1 className="display view-title">Checker email</h1>
            <p className="view-lede">
              Tempel satu atau banyak email (satu per baris, maks. 20) untuk cek
              apakah akunnya aktif.
            </p>

            <div className="work">
              <form className="work-main" onSubmit={handleChecker}>
                <label className="field" style={{ marginTop: 0 }}>
                  <span className="field-label">Daftar email</span>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder={"satu@gmail.com\ndua@gmail.com"}
                    value={checkRaw}
                    onChange={(e) => setCheckRaw(e.target.value)}
                  />
                </label>
                <button type="submit" className="btn btn-block">
                  Cek sekarang
                </button>
                <p className="sample-disclosure">
                  Catatan desain: hasil di halaman ini masih simulasi.
                  Pengecekan asli butuh server (backend).
                </p>
              </form>

              <aside className="work-side" aria-label="Hasil pengecekan">
                <h2 className="display">Hasil pengecekan</h2>
                {checkRes.length === 0 ? (
                  <p>Hasil pengecekan muncul di sini.</p>
                ) : (
                  <ul className="ledger-list" style={{ marginTop: 18 }}>
                    {checkRes.map((r, idx) => (
                      <li key={idx}>
                        <span className="em">{r.email}</span>
                        <span className={`tag ${r.cls}`}>{r.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </>
        )}

        {/* RIWAYAT */}
        {tab === "riwayat" && (
          <>
            <h1 className="display view-title">Riwayat setoran</h1>
            <p className="view-lede">
              Daftar semua Gmail yang pernah kamu setor beserta status
              verifikasinya.
            </p>

            <div style={{ marginTop: 32 }}>
              {items.length === 0 ? (
                <p className="empty">
                  Belum ada setoran. Mulai dari menu Stor.
                </p>
              ) : (
                <ul className="ledger-list">
                  {items.map((it) => {
                    const m = STATUS_META[it.status];
                    return (
                      <li key={it.id}>
                        <div className="em">
                          {it.email}
                          <small>
                            {it.at}
                            {it.status === "ok" ? ` · +${rp(PRICE)}` : ""}
                            {it.reason ? ` · ${it.reason}` : ""}
                          </small>
                        </div>
                        <span className={`tag ${m.cls}`}>{m.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        {/* SALDO */}
        {tab === "saldo" && (
          <>
            <h1 className="display view-title">Tarik saldo</h1>
            <p className="view-lede">
              Saldo: <strong className="num">{rp(bal)}</strong> · minimal tarik{" "}
              {rp(MIN_WITHDRAW)}.
            </p>

            <div className="work">
              <form className="work-main" onSubmit={handleWithdraw}>
                <div className="field" style={{ marginTop: 0 }}>
                  <span className="field-label">Metode</span>
                  <div className="choice" role="group" aria-label="Pilih metode penarikan">
                    {WD_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={wdMethod === m}
                        onClick={() => setWdMethod(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">Nomor tujuan</span>
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="Contoh: 081234567890"
                    value={wdNumber}
                    onChange={(e) => setWdNumber(e.target.value)}
                  />
                </label>

                {wdErr && <p className="msg msg-bad">{wdErr}</p>}
                {wdOk && <p className="msg msg-ok">{wdOk}</p>}

                <button type="submit" className="btn btn-block">
                  Ajukan penarikan
                </button>
              </form>

              <aside className="work-side">
                <h2 className="display">Ketentuan saldo</h2>
                <p>
                  Total penarikan kamu sejauh ini:{" "}
                  <strong className="num">{rp(wdTotal)}</strong>.
                </p>
                <ul className="rules">
                  <li>Minimal tarik {rp(MIN_WITHDRAW)}</li>
                  <li>Penarikan dibuka sesuai jadwal admin</li>
                  <li>Pastikan nomor tujuan aktif dan benar</li>
                </ul>
              </aside>
            </div>
          </>
        )}

        {/* REFERRAL */}
        {tab === "ref" && (
          <>
            <div className="back">
              <button
                type="button"
                className="text-link"
                onClick={() => setTab("home")}
              >
                ← Kembali ke beranda
              </button>
            </div>

            <h1 className="display view-title">Misi referral</h1>

            <div className="ref-band">
              <h2 className="display">
                Undang 20 teman &amp; dapatkan {rp(REF_BONUS)}
              </h2>

              <dl className="ref-grid">
                <div>
                  <dt>Progress bonus</dt>
                  <dd>
                    {refOkCount} / {REF_TARGET}
                  </dd>
                </div>
                <div>
                  <dt>Sisa</dt>
                  <dd>{Math.max(0, REF_TARGET - refOkCount)} Teman</dd>
                </div>
                <div>
                  <dt>Bonus</dt>
                  <dd>{rp(REF_BONUS)}</dd>
                </div>
              </dl>

              <div className="bar">
                <i style={{ width: `${refPercent}%` }} />
              </div>
              <p className="ref-pc num">{refPercent}%</p>
            </div>

            <dl className="pstats">
              <div>
                <dt>Total diundang</dt>
                <dd>{refList.length}</dd>
              </div>
              <div>
                <dt>Referral berhasil</dt>
                <dd>{refOkCount}</dd>
              </div>
              <div>
                <dt>Total bonus diterima</dt>
                <dd>
                  {rp(refBonuses.reduce((acc, b) => acc + b.amount, 0))}
                </dd>
              </div>
            </dl>

            <div className="panel">
              <h2>Kode &amp; link referral kamu</h2>
              <div className="copy-row">
                <div>
                  <small>Kode</small>
                  <code>{refCode}</code>
                </div>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() => handleCopy(refCode, "code")}
                >
                  {copiedKey === "code" ? "Tersalin" : "Salin"}
                </button>
              </div>
              <div className="copy-row">
                <div>
                  <small>Link undangan</small>
                  <code className="small">
                    https://situsmu.com/daftar?ref={refCode}
                  </code>
                </div>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() =>
                    handleCopy(
                      `https://situsmu.com/daftar?ref=${refCode}`,
                      "link"
                    )
                  }
                >
                  {copiedKey === "link" ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p className="sample-disclosure">
                Syarat: teman melakukan stor Gmail pertama yang diterima.
              </p>
              <button
                type="button"
                className="btn btn-line btn-sm"
                style={{ marginTop: 14 }}
                onClick={handleSimRef}
              >
                Simulasikan teman bergabung (demo)
              </button>
            </div>

            <div className="panel">
              <div className="subtabs">
                <button
                  type="button"
                  className="tab"
                  aria-current={refTab === 1 ? "page" : undefined}
                  onClick={() => setRefTab(1)}
                >
                  Riwayat referral
                </button>
                <button
                  type="button"
                  className="tab"
                  aria-current={refTab === 2 ? "page" : undefined}
                  onClick={() => setRefTab(2)}
                >
                  Riwayat bonus
                </button>
              </div>

              {refTab === 1 ? (
                refList.length === 0 ? (
                  <p className="empty">
                    Belum ada teman yang bergabung memakai kode kamu.
                  </p>
                ) : (
                  <ul className="ledger-list">
                    {refList.map((x, idx) => (
                      <li key={idx}>
                        <span className="em">{x.name}</span>
                        <span className={`tag ${x.ok ? "t-ok" : "t-pend"}`}>
                          {x.ok ? "Berhasil" : "Menunggu stor pertama"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              ) : refBonuses.length === 0 ? (
                <p className="empty">
                  Belum ada bonus. Selesaikan misi untuk mendapat{" "}
                  {rp(REF_BONUS)}.
                </p>
              ) : (
                <ul className="ledger-list">
                  {refBonuses.map((b, idx) => (
                    <li key={idx}>
                      <span className="em">{b.title}</span>
                      <strong className="num">+{rp(b.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* LEADERBOARD */}
        {tab === "lb" && (
          <>
            <div className="back">
              <button
                type="button"
                className="text-link"
                onClick={() => setTab("home")}
              >
                ← Kembali ke beranda
              </button>
            </div>

            <h1 className="display view-title">Leaderboard</h1>
            <p className="view-lede">
              Peringkat berdasarkan jumlah Gmail yang diterima. Nama lain adalah
              data contoh.
            </p>

            <ul className="ledger-list" style={{ marginTop: 32 }}>
              {leaderboardRows.map((r, i) => (
                <li key={r.name} className={r.me ? "lb-me" : undefined}>
                  <div className="em">
                    <span className="rank">{i + 1}.</span>
                    {r.name}{" "}
                    {r.me && (
                      <span className="tag t-chk" style={{ marginLeft: 8 }}>
                        Kamu
                      </span>
                    )}
                  </div>
                  <strong className="num">{r.count} Gmail</strong>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* SYARAT & KETENTUAN */}
        {tab === "tnc" && (
          <div className="tnc">
            <span className="tag t-pend">Wajib dibaca</span>
            <h1 className="display view-title" style={{ marginTop: 12 }}>
              Syarat &amp; Ketentuan
            </h1>
            <p className="view-lede" style={{ marginBottom: 28 }}>
              Dengan menggunakan website ini, Anda dianggap telah membaca,
              memahami, dan menyetujui seluruh ketentuan berikut.
            </p>

            <section>
              <h2 className="display">Penting</h2>
              <ul>
                <li>
                  <b>Kepemilikan Gmail.</b> Pengguna hanya boleh menyetorkan
                  Gmail milik sendiri atau yang sudah diberi izin oleh
                  pemiliknya. Dilarang menyetorkan Gmail milik orang lain tanpa
                  izin.
                </li>
                <li>
                  <b>Persetujuan Pengguna.</b> Seluruh proses stor dilakukan
                  secara sukarela tanpa paksaan dari pihak mana pun, atas
                  kemauan sendiri.
                </li>
                <li>
                  <b>Kepatuhan.</b> Website ini tidak berafiliasi dengan Google.
                  Pengguna bertanggung jawab penuh atas data yang disetorkan dan
                  wajib mematuhi ketentuan Google serta peraturan
                  perundang-undangan yang berlaku.
                </li>
                <li>
                  <b>Perubahan Ketentuan.</b> Admin berhak mengubah syarat dan
                  ketentuan sewaktu-waktu tanpa pemberitahuan sebelumnya.
                </li>
                <li>
                  <b>Persetujuan.</b> Dengan menggunakan website ini dan
                  melakukan stor Gmail, pengguna dianggap telah membaca,
                  memahami, dan menyetujui seluruh Syarat &amp; Ketentuan.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="display">Ketentuan umum</h2>
              <ul>
                <li>Hanya menerima alamat @gmail.com yang valid.</li>
                <li>Satu baris hanya boleh berisi 1 alamat Gmail.</li>
                <li>Spasi di awal maupun akhir dihapus otomatis.</li>
                <li>Gmail duplikat dihapus otomatis.</li>
                <li>Huruf besar dan kecil dianggap sama.</li>
              </ul>
            </section>

            <section>
              <h2 className="display">Ketentuan format</h2>
              <ul>
                <li>
                  Rules Awalan: Gmail wajib diawali <b>get</b>, setelahnya bebas
                  memakai nama apa saja. Contoh: getbudi21@gmail.com.
                </li>
                <li>
                  Jika Rules Angka aktif, Gmail wajib diakhiri angka 1–100.
                </li>
                <li>
                  Admin dapat mengaktifkan atau menonaktifkan rules tersebut
                  kapan saja.
                </li>
                <li>Gmail yang tidak sesuai format otomatis ditolak.</li>
              </ul>
            </section>

            <section>
              <h2 className="display">Proses verifikasi &amp; saldo</h2>
              <ul>
                <li>Status awal setiap storan adalah Pending.</li>
                <li>Estimasi pengecekan sekitar 24–30 jam.</li>
                <li>
                  Setelah diverifikasi, status berubah menjadi Diterima atau
                  Ditolak.
                </li>
                <li>Hanya Gmail berstatus Diterima yang mendapat pembayaran.</li>
                <li>
                  Saldo dihitung dari jumlah Gmail diterima × harga Gmail yang
                  berlaku saat verifikasi.
                </li>
                <li>Saldo masuk otomatis setelah Admin menyetujui Gmail.</li>
                <li>
                  Penarikan hanya bisa dilakukan jika fitur penarikan sedang
                  dibuka Admin.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="display">Larangan &amp; penutup</h2>
              <ul>
                <li>Dilarang mengirim Gmail palsu atau tidak valid.</li>
                <li>Dilarang mengirim Gmail yang sama berulang kali.</li>
                <li>Dilarang menyalahgunakan sistem dalam bentuk apa pun.</li>
                <li>
                  Pelanggaran dapat menyebabkan Gmail ditolak, saldo dibatalkan,
                  atau akun diblokir permanen.
                </li>
              </ul>
            </section>

            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: 24 }}
              onClick={() => {
                setAgreed(true);
                notify("Syarat & Ketentuan disetujui.");
                setTab("home");
              }}
            >
              Saya sudah paham, kembali
            </button>
          </div>
        )}

        {/* PROFIL */}
        {tab === "profil" && (
          <>
            <div className="profile-head">
              <div className="avatar">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt={`Foto profil ${user}`} />
                ) : (
                  (user || "?").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="display view-title">{user}</h1>
                <label
                  className="btn btn-line btn-sm file-label"
                  style={{ marginTop: 10 }}
                >
                  Ganti foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setAvatar(String(reader.result || ""));
                      reader.readAsDataURL(f);
                    }}
                  />
                </label>
              </div>
            </div>

            <dl className="pstats">
              <div>
                <dt>Total setoran</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Diterima</dt>
                <dd>{counts.ok}</dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd>{counts.pend + counts.chk}</dd>
              </div>
              <div>
                <dt>Ditolak</dt>
                <dd>{counts.bad}</dd>
              </div>
              <div>
                <dt>Total penarikan</dt>
                <dd>{rp(wdTotal)}</dd>
              </div>
              <div>
                <dt>Saldo</dt>
                <dd>{rp(bal)}</dd>
              </div>
            </dl>

            <div className="forms">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newUsername.trim();
                  if (v.length < 3) {
                    setNameMsg({
                      text: "Username minimal 3 karakter.",
                      ok: false,
                    });
                    return;
                  }
                  setUser(v);
                  setNewUsername("");
                  setNameMsg({
                    text: "Username berhasil diganti.",
                    ok: true,
                  });
                  notify(`Username diganti menjadi ${v}.`);
                }}
              >
                <h2 className="display">Ganti username</h2>
                <label className="field">
                  <span className="field-label">Username baru</span>
                  <input
                    className="input"
                    placeholder="Minimal 3 karakter"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </label>
                {nameMsg && (
                  <p className={`msg ${nameMsg.ok ? "msg-ok" : "msg-bad"}`}>
                    {nameMsg.text}
                  </p>
                )}
                <button type="submit" className="btn btn-sm">
                  Simpan username
                </button>
              </form>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (oldPass !== userPass) {
                    setPassMsg({ text: "Kata sandi lama salah.", ok: false });
                    return;
                  }
                  if (newPass.length < 6) {
                    setPassMsg({
                      text: "Kata sandi baru minimal 6 karakter.",
                      ok: false,
                    });
                    return;
                  }
                  if (newPass !== confirmPass) {
                    setPassMsg({
                      text: "Konfirmasi kata sandi tidak sama.",
                      ok: false,
                    });
                    return;
                  }
                  setUserPass(newPass);
                  setOldPass("");
                  setNewPass("");
                  setConfirmPass("");
                  setPassMsg({
                    text: "Kata sandi berhasil diganti.",
                    ok: true,
                  });
                  notify("Kata sandi berhasil diganti.");
                }}
              >
                <h2 className="display">Ganti kata sandi</h2>
                <label className="field">
                  <span className="field-label">Kata sandi lama</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Kata sandi baru</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Ulangi kata sandi baru</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </label>
                {passMsg && (
                  <p className={`msg ${passMsg.ok ? "msg-ok" : "msg-bad"}`}>
                    {passMsg.text}
                  </p>
                )}
                <button type="submit" className="btn btn-sm">
                  Ganti kata sandi
                </button>
              </form>
            </div>

            <div className="profile-foot">
              <button
                type="button"
                className="text-link"
                onClick={() => setTab("lb")}
              >
                Leaderboard
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setTab("tnc")}
              >
                Syarat &amp; Ketentuan
              </button>
              <button
                type="button"
                className="btn btn-line btn-sm"
                style={{ marginLeft: "auto" }}
                onClick={handleLogout}
              >
                Keluar
              </button>
            </div>
          </>
        )}
      </main>

      {/* CHAT SUPPORT (TEXT ONLY, NO ICONS) */}
      {!chatOpen && (
        <button
          type="button"
          className="chat-toggle"
          onClick={() => setChatOpen(true)}
        >
          Chat admin
        </button>
      )}

      {chatOpen && (
        <section className="chat-panel" aria-label="Chat admin">
          <div className="chat-head">
            <h2>Admin Support</h2>
            <button type="button" onClick={() => setChatOpen(false)}>
              Tutup
            </button>
          </div>

          <div className="chat-msgs">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`bubble ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSendChat}>
            <input
              className="input"
              placeholder="Tulis pesan…"
              autoComplete="off"
              aria-label="Tulis pesan untuk admin"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-sm">
              Kirim
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
