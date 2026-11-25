"use client";

import React, { useState, useEffect, useMemo } from "react";

type PageTab = "home" | "stor" | "check" | "riwayat" | "saldo" | "ref" | "lb" | "tnc" | "profil";

type SubmissionStatus = "ok" | "pend" | "bad" | "chk";

interface SubmissionItem {
  id: string;
  email: string;
  status: SubmissionStatus;
  time: string;
  reward?: number;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

interface ReferredUser {
  name: string;
  ok: boolean;
}

interface ReferralBonus {
  title: string;
  amount: number;
}

interface ChatMsg {
  sender: "u" | "a";
  text: string;
  time: string;
}

const PRICE_PER_GMAIL = 2500;
const DAILY_LIMIT = 20;

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation state
  const [currentTab, setCurrentTab] = useState<PageTab>("home");

  // User & balance state
  const [user, setUser] = useState("budi123");
  const [avatar, setAvatar] = useState<string>("");
  const [balance, setBalance] = useState(0);
  const [totalWD, setTotalWD] = useState(0);
  const [agreedTNC, setAgreedTNC] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [storEmail, setStorEmail] = useState("");
  const [storPassword, setStorPassword] = useState("");
  const [storError, setStorError] = useState("");

  // Email Checker state
  const [checkerInput, setCheckerInput] = useState("");
  const [checkerResults, setCheckerResults] = useState<
    { email: string; status: "ok" | "bad" | "warn"; msg: string }[]
  >([]);

  // Withdrawal state
  const [wdMethod, setWdMethod] = useState("");
  const [wdAccount, setWdAccount] = useState("");
  const [wdError, setWdError] = useState("");

  // Referral state
  const [refTab, setRefTab] = useState<"list" | "bonus">("list");
  const [refCode, setRefCode] = useState("GET88AB");
  const [invitedUsers, setInvitedUsers] = useState<ReferredUser[]>([]);
  const [bonusHistory, setBonusHistory] = useState<ReferralBonus[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Profile forms
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      sender: "a",
      text: "Halo! Ada kendala saat setor atau tarik saldo? Tulis di sini ya.",
      time: "12:00",
    },
  ]);

  // Sync theme to HTML attribute and init client state
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setRefCode("GET" + Math.random().toString(36).substring(2, 7).toUpperCase());
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addNotification = (text: string) => {
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNotifications((prev) => [
      { id: Math.random().toString(), text, time, unread: true },
      ...prev,
    ]);
  };

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const formatIDR = (n: number) => "Rp" + n.toLocaleString("id-ID");

  // Computed counts
  const statsCount = useMemo(() => {
    const res = { ok: 0, pend: 0, bad: 0, chk: 0 };
    submissions.forEach((s) => {
      res[s.status]++;
    });
    return res;
  }, [submissions]);

  const remainingDailyLimit = Math.max(0, DAILY_LIMIT - submissions.length);

  // Stor validation
  const validationState = useMemo(() => {
    const email = storEmail.trim().toLowerCase();
    const pass = storPassword;
    const isFormatOk = /^get[a-z0-9.]{3,27}@gmail\.com$/.test(email);
    const isPassOk = pass.length >= 8;
    const isUnique = !submissions.some((s) => s.email.toLowerCase() === email);
    return {
      isFormatOk,
      isPassOk,
      isUnique,
      isValidAll: isFormatOk && isPassOk && isUnique,
    };
  }, [storEmail, storPassword, submissions]);

  // Handlers
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      setAuthError("Username dan kata sandi (min. 6 karakter) wajib diisi.");
      return;
    }
    setAuthError("");
    setUser(username.trim());
    setIsLoggedIn(true);
    addNotification(`Selamat datang, ${username.trim()}. Tarif per Gmail Rp2.500.`);
    if (!agreedTNC) {
      setCurrentTab("tnc");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentTab("home");
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStorError("");

    if (!agreedTNC) {
      setStorError("Baca dan setujui Syarat & Ketentuan terlebih dahulu.");
      return;
    }
    if (submissions.length >= DAILY_LIMIT) {
      setStorError("Batas setor hari ini sudah habis.");
      return;
    }
    if (!validationState.isValidAll) {
      setStorError("Periksa kembali format email dan panjang kata sandi.");
      return;
    }

    const email = storEmail.trim().toLowerCase();
    const newId = Math.random().toString();
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newItem: SubmissionItem = {
      id: newId,
      email,
      status: "pend",
      time,
    };

    setSubmissions((prev) => [newItem, ...prev]);
    setStorEmail("");
    setStorPassword("");
    addNotification(`${email} berhasil disetor untuk dicek.`);
    setCurrentTab("riwayat");

    // Simulate verification
    setTimeout(() => {
      setSubmissions((prev) =>
        prev.map((item) => (item.id === newId ? { ...item, status: "chk" } : item))
      );
      addNotification(`${email} sedang dalam proses pengecekan.`);
    }, 1500);

    setTimeout(() => {
      const isAccepted = Math.random() > 0.25;
      const finalStatus: SubmissionStatus = isAccepted ? "ok" : "bad";

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === newId
            ? {
                ...item,
                status: finalStatus,
                reward: isAccepted ? PRICE_PER_GMAIL : undefined,
              }
            : item
        )
      );

      if (isAccepted) {
        setBalance((prev) => prev + PRICE_PER_GMAIL);
        addNotification(`${email} lolos verifikasi! Saldo +${formatIDR(PRICE_PER_GMAIL)}`);
      } else {
        addNotification(`${email} ditolak: akun tidak aktif.`);
      }
    }, 3500);
  };

  const handleCheckEmails = () => {
    const list = checkerInput
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (list.length === 0) return;

    const results = list.map((item) => {
      const email = item.toLowerCase();
      const isValid = /^get[^@\s]*@gmail\.com$/i.test(email);
      if (!isValid) {
        return {
          email,
          status: "bad" as const,
          msg: "Format tidak valid (harus diawali 'get' & @gmail.com)",
        };
      }
      const isActive = Math.random() > 0.35;
      return {
        email,
        status: (isActive ? "ok" : "warn") as "ok" | "warn",
        msg: isActive ? "Akun Aktif" : "Akun Tidak Aktif",
      };
    });

    setCheckerResults(results);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setWdError("");

    if (balance < 25000) {
      setWdError("Saldo belum mencapai syarat minimal penarikan (Rp25.000).");
      return;
    }
    if (!wdMethod.trim() || !wdAccount.trim()) {
      setWdError("Isi metode dan nomor rekening / e-wallet tujuan.");
      return;
    }

    const withdrawAmount = balance;
    setTotalWD((prev) => prev + withdrawAmount);
    setBalance(0);
    setWdMethod("");
    setWdAccount("");
    addNotification(`Penarikan ${formatIDR(withdrawAmount)} berhasil diajukan.`);
    alert(`Penarikan ${formatIDR(withdrawAmount)} telah diajukan ke admin.`);
  };

  const handleSimulateReferral = () => {
    if (invitedUsers.length >= 20) return;
    const friendName = `teman${invitedUsers.length + 1}`;
    setInvitedUsers((prev) => [{ name: friendName, ok: false }, ...prev]);
    addNotification(`${friendName} bergabung memakai kode referral kamu.`);

    setTimeout(() => {
      setInvitedUsers((prev) =>
        prev.map((f) => (f.name === friendName ? { ...f, ok: true } : f))
      );
      addNotification(`Setoran pertama ${friendName} diterima! Referral berhasil.`);

      // Check if 20 milestone reached
      if (invitedUsers.length + 1 === 20) {
        setBalance((prev) => prev + 15000);
        setBonusHistory((prev) => [
          { title: "Bonus Misi 20 Teman", amount: 15000 },
          ...prev,
        ]);
        addNotification("Selamat! Misi 20 teman selesai, bonus Rp15.000 masuk ke saldo.");
      }
    }, 1500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [...prev, { sender: "u", text, time }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "a",
          text: "Terima kasih, pesan Anda sudah kami terima. Admin support akan segera merespons.",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }, 800);
  };

  // Login / Auth Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
        <div className="w-full max-w-[380px] p-6 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 font-bold text-lg text-[var(--ink)]">
            <span className="w-9 h-9 rounded-xl bg-[var(--pri)] text-[var(--pri-ink)] flex items-center justify-center font-bold text-lg">
              @
            </span>
            <span>Setor-Get</span>
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-[var(--ink)]">
            {authMode === "login" ? "Masuk ke akun Anda" : "Buat akun baru"}
          </h1>
          <p className="text-xs text-[var(--mute)] mt-1 mb-5">
            Setiap akun Gmail yang lolos verifikasi dibayar{" "}
            <strong className="text-[var(--ink)]">Rp2.500</strong>.
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5">
                Username
              </label>
              <input
                type="text"
                placeholder="mis. budi123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm focus:outline-none focus:border-[var(--pri)] text-[var(--ink)]"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5">
                Kata sandi
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm focus:outline-none focus:border-[var(--pri)] text-[var(--ink)]"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && (
              <div className="text-xs font-medium text-[var(--bad)] bg-[var(--bad-bg)] px-3 py-2 rounded-lg">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[var(--pri)] hover:bg-[var(--pri-hover)] text-[var(--pri-ink)] font-semibold text-sm transition-colors cursor-pointer"
            >
              {authMode === "login" ? "Masuk" : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[var(--mute)]">
            {authMode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode((prev) => (prev === "login" ? "register" : "login"));
                setAuthError("");
              }}
              className="font-semibold text-[var(--pri)] hover:underline ml-1 cursor-pointer"
            >
              {authMode === "login" ? "Daftar" : "Masuk"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Main View
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center">
      <div className="w-full max-w-[760px] px-4 pt-4 pb-28">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-[var(--pri)] text-[var(--pri-ink)] flex items-center justify-center font-bold text-sm">
              @
            </span>
            <span className="tracking-tight">Setor-Get</span>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Tema"
              className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--card)] flex items-center justify-center text-sm font-semibold hover:border-[var(--pri)] cursor-pointer"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => {
                setShowNotifPopover((prev) => !prev);
                setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
              }}
              aria-label="Notifikasi"
              className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--card)] flex items-center justify-center text-sm relative hover:border-[var(--pri)] cursor-pointer"
            >
              🔔
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--bad)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifPopover && (
              <div className="absolute right-0 top-12 w-72 max-w-[90vw] p-3 bg-[var(--card)] border border-[var(--line)] rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)] mb-2">
                  <span className="text-xs font-bold">Notifikasi</span>
                  <button
                    onClick={() => setShowNotifPopover(false)}
                    className="text-xs text-[var(--mute)] hover:text-[var(--ink)]"
                  >
                    Tutup
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--mute)] text-center py-4">Belum ada notifikasi.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="text-xs pb-2 border-b border-[var(--line)] last:border-0">
                        <p className="text-[var(--ink)]">{n.text}</p>
                        <span className="text-[10px] text-[var(--mute)]">{n.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* VIEW: BERANDA */}
        {currentTab === "home" && (
          <div className="space-y-3">
            {/* Balance Card */}
            <div className="p-5 rounded-2xl bg-[var(--pri)] text-[var(--pri-ink)] shadow-sm">
              <span className="text-xs font-medium opacity-90 block">Saldo Saat Ini</span>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight my-1">
                {formatIDR(balance)}
              </div>
              <span className="text-xs opacity-90 block">Tarif per Akun: Rp2.500</span>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setCurrentTab("saldo")}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--pri-ink)] text-[var(--pri)] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Tarik Saldo
                </button>
                <button
                  onClick={() => setCurrentTab("riwayat")}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--pri-ink)] text-[var(--pri-ink)] font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Riwayat
                </button>
              </div>
            </div>

            {/* Metric Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-xl font-bold block text-[var(--ink)]">{statsCount.ok}</span>
                <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--ok-bg)] text-[var(--ok)]">
                  Diterima
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-xl font-bold block text-[var(--ink)]">{statsCount.pend}</span>
                <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--warn-bg)] text-[var(--warn)]">
                  Pending
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-xl font-bold block text-[var(--ink)]">{statsCount.bad}</span>
                <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--bad-bg)] text-[var(--bad)]">
                  Ditolak
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-xl font-bold block text-[var(--ink)]">{statsCount.chk}</span>
                <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info)]">
                  Di Cek
                </span>
              </div>
            </div>

            {/* Daily Limit Tracker */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--ink)]">Batas Setor Hari Ini</span>
                <span className="text-[var(--mute)]">
                  {submissions.length}/{DAILY_LIMIT} · Sisa {remainingDailyLimit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--line)] mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-[var(--pri)] transition-all duration-300"
                  style={{ width: `${(submissions.length / DAILY_LIMIT) * 100}%` }}
                />
              </div>
            </div>

            {/* Criteria Box */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)]">
              <h2 className="text-xs font-bold text-[var(--ink)] mb-2 uppercase tracking-wider">
                Syarat Gmail yang Diterima
              </h2>
              <ul className="text-xs text-[var(--mute)] space-y-1.5 list-disc pl-4">
                <li>Alamat diawali “get”, setelahnya bebas nama unik, berakhiran @gmail.com</li>
                <li>Kata sandi akun minimal 8 karakter</li>
                <li>Belum pernah disetor oleh pengguna lain</li>
                <li>Akun masih aktif saat dicek sistem</li>
              </ul>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setCurrentTab("ref")}
                className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--pri)] transition-colors cursor-pointer"
              >
                🎁 Referral
              </button>
              <button
                onClick={() => setCurrentTab("lb")}
                className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--pri)] transition-colors cursor-pointer"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => setCurrentTab("tnc")}
                className="py-2.5 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--pri)] transition-colors cursor-pointer"
              >
                ⚖️ Syarat & Ketentuan
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SETOR (STOR) */}
        {currentTab === "stor" && (
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">Setor Gmail</h2>
            <p className="text-xs text-[var(--mute)] mb-4">
              Pastikan akun memenuhi kriteria format sebelum disetorkan.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  placeholder="getnama123@gmail.com"
                  value={storEmail}
                  onChange={(e) => setStorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1">
                  Kata Sandi Email
                </label>
                <input
                  type="text"
                  placeholder="Minimal 8 karakter"
                  value={storPassword}
                  onChange={(e) => setStorPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
                  required
                />
              </div>

              {/* Live Checklist Validation */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={validationState.isFormatOk ? "text-[var(--ok)]" : "text-[var(--mute)]"}>
                    {validationState.isFormatOk ? "✓" : "○"}
                  </span>
                  <span className={validationState.isFormatOk ? "text-[var(--ok)] font-medium" : "text-[var(--mute)]"}>
                    Diawali “get” dan berakhiran @gmail.com
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={validationState.isPassOk ? "text-[var(--ok)]" : "text-[var(--mute)]"}>
                    {validationState.isPassOk ? "✓" : "○"}
                  </span>
                  <span className={validationState.isPassOk ? "text-[var(--ok)] font-medium" : "text-[var(--mute)]"}>
                    Kata sandi min. 8 karakter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={validationState.isUnique ? "text-[var(--ok)]" : "text-[var(--mute)]"}>
                    {validationState.isUnique ? "✓" : "○"}
                  </span>
                  <span className={validationState.isUnique ? "text-[var(--ok)] font-medium" : "text-[var(--mute)]"}>
                    Belum pernah disetor sebelumnya
                  </span>
                </div>
              </div>

              {storError && (
                <div className="text-xs font-semibold text-[var(--bad)] bg-[var(--bad-bg)] p-2.5 rounded-xl">
                  {storError}
                </div>
              )}

              <button
                type="submit"
                disabled={!validationState.isValidAll}
                className="w-full py-2.5 rounded-xl bg-[var(--pri)] hover:bg-[var(--pri-hover)] disabled:opacity-50 text-[var(--pri-ink)] font-bold text-sm transition-colors cursor-pointer"
              >
                Setor, Dapat Rp2.500
              </button>
            </form>
          </div>
        )}

        {/* VIEW: CHECKER */}
        {currentTab === "check" && (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
              <h2 className="text-base font-bold text-[var(--ink)] mb-1">Checker Email</h2>
              <p className="text-xs text-[var(--mute)] mb-3">
                Tempel satu atau banyak email (satu per baris, maks 20) untuk memeriksa kevalidan akun.
              </p>

              <textarea
                rows={5}
                placeholder="getnama1@gmail.com&#10;getnama2@gmail.com"
                value={checkerInput}
                onChange={(e) => setCheckerInput(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)] mb-3"
              />

              <button
                onClick={handleCheckEmails}
                className="w-full py-2.5 rounded-xl bg-[var(--pri)] hover:bg-[var(--pri-hover)] text-[var(--pri-ink)] font-bold text-xs transition-colors cursor-pointer"
              >
                Cek Sekarang
              </button>
            </div>

            {/* Checker Results */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)]">
              <h3 className="text-xs font-bold text-[var(--ink)] mb-2">Hasil Pengecekan</h3>
              {checkerResults.length === 0 ? (
                <p className="text-xs text-[var(--mute)] text-center py-4">Hasil pengecekan muncul di sini.</p>
              ) : (
                <div className="divide-y divide-[var(--line)]">
                  {checkerResults.map((r, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-mono text-[var(--ink)]">{r.email}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          r.status === "ok"
                            ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                            : r.status === "warn"
                            ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                            : "bg-[var(--bad-bg)] text-[var(--bad)]"
                        }`}
                      >
                        {r.msg}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: RIWAYAT */}
        {currentTab === "riwayat" && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
            <h2 className="text-base font-bold text-[var(--ink)] mb-3">Riwayat Setoran</h2>
            {submissions.length === 0 ? (
              <p className="text-xs text-[var(--mute)] text-center py-8">
                Belum ada setoran. Silakan mulai menyetor dari menu Stor.
              </p>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {submissions.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-medium block text-[var(--ink)]">{item.email}</span>
                      <span className="text-[11px] text-[var(--mute)]">
                        {item.time} {item.reward && `· +${formatIDR(item.reward)}`}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          item.status === "ok"
                            ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                            : item.status === "pend"
                            ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                            : item.status === "bad"
                            ? "bg-[var(--bad-bg)] text-[var(--bad)]"
                            : "bg-[var(--info-bg)] text-[var(--info)]"
                        }`}
                      >
                        {item.status === "ok"
                          ? "Diterima"
                          : item.status === "pend"
                          ? "Pending"
                          : item.status === "bad"
                          ? "Ditolak"
                          : "Di Cek"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: SALDO & PENARIKAN */}
        {currentTab === "saldo" && (
          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">Tarik Saldo</h2>
            <p className="text-xs text-[var(--mute)] mb-4">
              Saldo saat ini: <strong className="text-[var(--ink)]">{formatIDR(balance)}</strong> · Minimal penarikan Rp25.000.
            </p>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1">
                  Metode Penarikan
                </label>
                <input
                  type="text"
                  placeholder="DANA / OVO / GoPay / Bank Transfer"
                  value={wdMethod}
                  onChange={(e) => setWdMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1">
                  Nomor Rekening / Akun Tujuan
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={wdAccount}
                  onChange={(e) => setWdAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] font-mono text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
                  required
                />
              </div>

              {wdError && (
                <div className="text-xs font-semibold text-[var(--bad)] bg-[var(--bad-bg)] p-2.5 rounded-xl">
                  {wdError}
                </div>
              )}

              <button
                type="submit"
                disabled={balance < 25000}
                className="w-full py-2.5 rounded-xl bg-[var(--pri)] hover:bg-[var(--pri-hover)] disabled:opacity-50 text-[var(--pri-ink)] font-bold text-sm transition-colors cursor-pointer"
              >
                Ajukan Penarikan
              </button>
            </form>
          </div>
        )}

        {/* VIEW: REFERRAL */}
        {currentTab === "ref" && (
          <div className="space-y-3">
            <button
              onClick={() => setCurrentTab("home")}
              className="text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] mb-1"
            >
              ← Kembali ke Beranda
            </button>

            {/* Referral Progress Hero */}
            <div className="p-5 rounded-2xl bg-[var(--pri)] text-[var(--pri-ink)]">
              <span className="text-xs opacity-90 block">🎁 Misi Referral</span>
              <h2 className="text-lg font-bold tracking-tight mt-1 mb-3">
                Undang 20 Teman & Dapatkan Rp15.000
              </h2>

              <div className="grid grid-cols-3 text-center py-2 border-t border-b border-white/20">
                <div>
                  <span className="text-[11px] opacity-80 block">Progress</span>
                  <span className="text-sm font-bold">{invitedUsers.filter((u) => u.ok).length} / 20</span>
                </div>
                <div>
                  <span className="text-[11px] opacity-80 block">Sisa</span>
                  <span className="text-sm font-bold">
                    {Math.max(0, 20 - invitedUsers.filter((u) => u.ok).length)} Teman
                  </span>
                </div>
                <div>
                  <span className="text-[11px] opacity-80 block">Bonus</span>
                  <span className="text-sm font-bold">Rp15.000</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-white/20 mt-3 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (invitedUsers.filter((u) => u.ok).length / 20) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Code & Link Cards */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-3">
              <h3 className="text-xs font-bold text-[var(--ink)]">Kode & Link Undangan Kamu</h3>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--bg)]">
                <div>
                  <span className="text-[10px] text-[var(--mute)] block">Kode Referral</span>
                  <span className="font-mono font-bold text-sm tracking-wider">{refCode}</span>
                </div>
                <button
                  onClick={() => handleCopy(refCode, "code")}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-xs font-semibold hover:border-[var(--pri)] cursor-pointer"
                >
                  {copiedKey === "code" ? "Tersalin" : "Salin"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--bg)]">
                <div className="overflow-hidden pr-2">
                  <span className="text-[10px] text-[var(--mute)] block">Link Undangan</span>
                  <span className="font-mono text-xs text-[var(--mute)] truncate block">
                    https://situsmu.com/daftar?ref={refCode}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(`https://situsmu.com/daftar?ref=${refCode}`, "link")
                  }
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-xs font-semibold shrink-0 hover:border-[var(--pri)] cursor-pointer"
                >
                  {copiedKey === "link" ? "Tersalin" : "Salin"}
                </button>
              </div>

              <button
                onClick={handleSimulateReferral}
                className="w-full py-2 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-xs font-semibold hover:border-[var(--pri)] transition-colors cursor-pointer"
              >
                Simulasikan Teman Bergabung (Demo)
              </button>
            </div>

            {/* Referral Tabs & History */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)]">
              <div className="flex gap-2 border-b border-[var(--line)] pb-2 mb-3">
                <button
                  onClick={() => setRefTab("list")}
                  className={`text-xs font-bold pb-1 cursor-pointer ${
                    refTab === "list"
                      ? "text-[var(--pri)] border-b-2 border-[var(--pri)]"
                      : "text-[var(--mute)]"
                  }`}
                >
                  Riwayat Referral
                </button>
                <button
                  onClick={() => setRefTab("bonus")}
                  className={`text-xs font-bold pb-1 cursor-pointer ${
                    refTab === "bonus"
                      ? "text-[var(--pri)] border-b-2 border-[var(--pri)]"
                      : "text-[var(--mute)]"
                  }`}
                >
                  Riwayat Bonus
                </button>
              </div>

              {refTab === "list" ? (
                invitedUsers.length === 0 ? (
                  <p className="text-xs text-[var(--mute)] text-center py-4">
                    Belum ada teman yang bergabung memakai kode referral kamu.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--line)]">
                    {invitedUsers.map((u, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--ink)]">{u.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.ok
                              ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                              : "bg-[var(--warn-bg)] text-[var(--warn)]"
                          }`}
                        >
                          {u.ok ? "Berhasil" : "Menunggu Setoran Pertama"}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : bonusHistory.length === 0 ? (
                <p className="text-xs text-[var(--mute)] text-center py-4">
                  Belum ada bonus. Selesaikan misi untuk mendapat Rp15.000.
                </p>
              ) : (
                <div className="divide-y divide-[var(--line)]">
                  {bonusHistory.map((b, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--ink)]">{b.title}</span>
                      <span className="font-bold text-[var(--ok)]">+{formatIDR(b.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: LEADERBOARD */}
        {currentTab === "lb" && (
          <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">Leaderboard</h2>
            <p className="text-xs text-[var(--mute)] mb-4">
              Peringkat berdasarkan jumlah akun Gmail yang diterima.
            </p>

            <div className="divide-y divide-[var(--line)] text-xs">
              {[
                { rank: 1, name: "rina_store", count: 142 },
                { rank: 2, name: "dedi.gmail", count: 118 },
                { rank: 3, name: "ayu99", count: 96 },
                { rank: 4, name: "bagas_id", count: 77 },
                { rank: 5, name: "sinta.pay", count: 51 },
                { rank: 6, name: user, count: statsCount.ok, isMe: true },
              ]
                .sort((a, b) => b.count - a.count)
                .map((row, idx) => (
                  <div
                    key={idx}
                    className={`py-3 flex items-center justify-between ${
                      row.isMe ? "bg-[var(--pri)]/5 -mx-4 px-4 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-[var(--mute)] font-bold">{idx + 1}.</span>
                      <span className="text-[var(--ink)]">{row.name}</span>
                      {row.isMe && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--info-bg)] text-[var(--info)] font-bold">
                          Kamu
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[var(--ink)]">{row.count} Gmail</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW: SYARAT & KETENTUAN (TNC) */}
        {currentTab === "tnc" && (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)]">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--warn-bg)] text-[var(--warn)]">
                Wajib Dibaca
              </span>
              <h2 className="text-lg font-bold text-[var(--ink)] mt-2 mb-1">Syarat & Ketentuan</h2>
              <p className="text-xs text-[var(--mute)] leading-relaxed">
                Dengan menggunakan layanan ini, Anda menyetujui seluruh ketentuan operasional berikut.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-3 text-xs leading-relaxed">
              <h3 className="font-bold text-[var(--ink)]">Ketentuan Utama</h3>
              <ul className="list-disc pl-4 text-[var(--mute)] space-y-1">
                <li>
                  <strong className="text-[var(--ink)]">Kepemilikan Akun:</strong> Hanya boleh menyetorkan akun milik sendiri atau yang telah diberi izin oleh pemiliknya.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Kepatuhan:</strong> Website ini tidak berafiliasi dengan Google. Pengguna bertanggung jawab penuh atas data yang disetorkan.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Format Akun:</strong> Alamat wajib diawali “get” dan berakhiran “@gmail.com” dengan kata sandi minimal 8 karakter.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Verifikasi:</strong> Status awal adalah Pending, dicek estimasi 24 jam. Hanya status Diterima yang mendapat saldo Rp2.500.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">Penarikan Saldo:</strong> Batas minimal penarikan Rp25.000 ke DANA, OVO, GoPay, atau Rekening Bank.
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setAgreedTNC(true);
                addNotification("Syarat & Ketentuan telah disetujui.");
                setCurrentTab("home");
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--pri)] hover:bg-[var(--pri-hover)] text-[var(--pri-ink)] font-bold text-sm cursor-pointer"
            >
              Saya Sudah Paham & Setuju
            </button>
          </div>
        )}

        {/* VIEW: PROFIL */}
        {currentTab === "profil" && (
          <div className="space-y-3">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--line)] text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--pri)] text-[var(--pri-ink)] mx-auto flex items-center justify-center font-bold text-2xl overflow-hidden mb-2">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.charAt(0).toUpperCase()
                )}
              </div>
              <label className="text-xs font-semibold text-[var(--pri)] hover:underline cursor-pointer block mb-1">
                Ganti Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setAvatar(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <h2 className="text-base font-bold text-[var(--ink)]">{user}</h2>
            </div>

            {/* User Statistics Matrix */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-base font-bold block text-[var(--ink)]">{submissions.length}</span>
                <span className="text-[10px] text-[var(--mute)]">Total Setor</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-base font-bold block text-[var(--ok)]">{statsCount.ok}</span>
                <span className="text-[10px] text-[var(--mute)]">Diterima</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)]">
                <span className="text-base font-bold block text-[var(--ink)]">{formatIDR(balance)}</span>
                <span className="text-[10px] text-[var(--mute)]">Saldo</span>
              </div>
            </div>

            {/* Change Username Form */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--ink)]">Ganti Username</h3>
              <input
                type="text"
                placeholder="Username baru (min. 3 karakter)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
              />
              {usernameMsg && (
                <p
                  className={`text-[11px] font-semibold ${
                    usernameMsg.ok ? "text-[var(--ok)]" : "text-[var(--bad)]"
                  }`}
                >
                  {usernameMsg.text}
                </p>
              )}
              <button
                onClick={() => {
                  if (newUsername.trim().length < 3) {
                    setUsernameMsg({ text: "Username minimal 3 karakter.", ok: false });
                    return;
                  }
                  setUser(newUsername.trim());
                  setUsernameMsg({ text: "Username berhasil diganti.", ok: true });
                  addNotification(`Username diganti menjadi ${newUsername.trim()}.`);
                  setNewUsername("");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--pri)] text-[var(--pri-ink)] text-xs font-bold cursor-pointer"
              >
                Simpan Username
              </button>
            </div>

            {/* Change Password Form */}
            <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--ink)]">Ganti Kata Sandi</h3>
              <input
                type="password"
                placeholder="Kata sandi lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
              />
              <input
                type="password"
                placeholder="Kata sandi baru (min. 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
              />
              <input
                type="password"
                placeholder="Konfirmasi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
              />
              {passwordMsg && (
                <p
                  className={`text-[11px] font-semibold ${
                    passwordMsg.ok ? "text-[var(--ok)]" : "text-[var(--bad)]"
                  }`}
                >
                  {passwordMsg.text}
                </p>
              )}
              <button
                onClick={() => {
                  if (newPassword.length < 6) {
                    setPasswordMsg({ text: "Kata sandi baru minimal 6 karakter.", ok: false });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordMsg({ text: "Konfirmasi kata sandi tidak sama.", ok: false });
                    return;
                  }
                  setPasswordMsg({ text: "Kata sandi berhasil diganti.", ok: true });
                  addNotification("Kata sandi berhasil diperbarui.");
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--pri)] text-[var(--pri-ink)] text-xs font-bold cursor-pointer"
              >
                Ganti Kata Sandi
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-[var(--bad)] text-[var(--bad)] text-xs font-bold hover:bg-[var(--bad-bg)] transition-colors cursor-pointer"
            >
              Keluar dari Akun
            </button>
          </div>
        )}
      </div>

      {/* Floating Chat Support Trigger */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed right-4 bottom-24 z-40 px-4 py-2.5 rounded-full bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
        >
          <span>💬</span>
          <span>Chat Support</span>
        </button>
      )}

      {/* Expandable Support Chat Box */}
      {isChatOpen && (
        <div className="fixed right-4 bottom-24 w-80 max-w-[calc(100vw-32px)] h-96 bg-[var(--card)] border border-[var(--line)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-[var(--pri)] text-[var(--pri-ink)] flex items-center justify-between font-bold text-xs">
            <span>Admin Support</span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-lg leading-none cursor-pointer hover:opacity-80"
            >
              ×
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-2.5 rounded-xl ${
                  msg.sender === "u"
                    ? "ml-auto bg-[var(--pri)] text-[var(--pri-ink)] rounded-br-none"
                    : "mr-auto bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] rounded-bl-none"
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-[9px] opacity-75 block text-right mt-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-[var(--line)] flex gap-2">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--pri)]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[var(--pri)] text-[var(--pri-ink)] text-xs font-bold cursor-pointer"
            >
              Kirim
            </button>
          </form>
        </div>
      )}

      {/* Bottom Floating Navigation Dock */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[520px] px-2 z-30">
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-1.5 shadow-xl flex items-center justify-around">
          {[
            { id: "home", label: "Beranda", icon: "🏠" },
            { id: "riwayat", label: "Riwayat", icon: "🕘" },
            { id: "stor", label: "Stor", icon: "📤" },
            { id: "check", label: "Checker", icon: "🔍" },
            { id: "saldo", label: "Saldo", icon: "👛" },
            { id: "profil", label: "Profil", icon: "👤" },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as PageTab)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--bg)] text-[var(--pri)]"
                    : "text-[var(--mute)] hover:text-[var(--ink)]"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
