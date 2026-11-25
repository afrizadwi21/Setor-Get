"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, API_BASE, clearToken, getToken, setToken } from "@/lib/api";
import {
  DAILY_LIMIT,
  EMAIL_RULE,
  MIN_WITHDRAW,
  PRICE,
  REF_BONUS,
  REF_TARGET,
  rp,
} from "@/lib/setor";
import ThemeToggle from "../ThemeToggle";

type Tab =
  | "home"
  | "riwayat"
  | "stor"
  | "check"
  | "saldo"
  | "profil"
  | "ref"
  | "lb"
  | "tnc"
  | "admin";

type SubStatus = "ok" | "pend" | "bad" | "chk";

interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  avatar: string;
  balance: number;
  total_wd: number;
  daily_limit: number;
  referral_code: string;
  agreed_tnc: boolean;
  role: string;
}

interface AdminSubmission {
  id: number;
  user_id: number;
  username: string;
  email: string;
  email_pass: string;
  status: SubStatus;
  reward_amount: number;
  reason: string;
  created_at: string;
}

interface AdminChatThread {
  user_id: number;
  username: string;
  last_message: string;
  last_sender: string;
  updated_at: string;
}

interface WithdrawalItem {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  method: string;
  account_number: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  user_wd_count?: number;
  user_wd_total?: number;
  created_at: string;
}

interface AdminUserWDStat {
  user_id: number;
  username: string;
  email: string;
  wd_count: number;
  wd_total: number;
  balance: number;
}

interface Submission {
  id: number;
  email: string;
  status: SubStatus;
  created_at: string;
  reason?: string;
}

interface Notif {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface RefFriend {
  username: string;
  is_successful: boolean;
}

interface RefBonusItem {
  id: number;
  title: string;
  amount: number;
}

interface LeaderboardRow {
  rank: number;
  username: string;
  total_wd: number;
  wd_count: number;
  accepted_count: number;
  is_me: boolean;
}

interface ChatMsg {
  id?: number;
  sender: "u" | "a";
  message: string;
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

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AppWorkspace() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [avatar, setAvatar] = useState("");
  const [bal, setBal] = useState(0);
  const [wdTotal, setWdTotal] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(DAILY_LIMIT);
  const [todayCount, setTodayCount] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [items, setItems] = useState<Submission[]>([]);
  const [storEmail, setStorEmail] = useState("");
  const [storPass, setStorPass] = useState("");
  const [storErr, setStorErr] = useState("");
  const [storBusy, setStorBusy] = useState(false);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editSubEmail, setEditSubEmail] = useState("");
  const [editSubPass, setEditSubPass] = useState("");
  const [editSubErr, setEditSubErr] = useState("");

  const [checkRaw, setCheckRaw] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkRes, setCheckRes] = useState<
    { email: string; cls: string; label: string }[]
  >([]);

  const [wdMethod, setWdMethod] = useState("DANA");
  const [wdNumber, setWdNumber] = useState("");
  const [wdBusy, setWdBusy] = useState(false);
  const [wdErr, setWdErr] = useState("");
  const [wdOk, setWdOk] = useState("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);

  const [refCode, setRefCode] = useState("");
  const [refLink, setRefLink] = useState("");
  const [refTab, setRefTab] = useState<1 | 2>(1);
  const [refList, setRefList] = useState<RefFriend[]>([]);
  const [refBonuses, setRefBonuses] = useState<RefBonusItem[]>([]);
  const [refSuccessCount, setRefSuccessCount] = useState(0);
  const [refTotalBonus, setRefTotalBonus] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [lbRows, setLbRows] = useState<LeaderboardRow[]>([]);

  const [newUsername, setNewUsername] = useState("");
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(
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
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);

  // Admin state
  const [adminSubTab, setAdminSubTab] = useState<"subs" | "wd" | "chats" | "lb">("subs");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [adminWdFilter, setAdminWdFilter] = useState<string>("all");
  const [adminSubs, setAdminSubs] = useState<AdminSubmission[]>([]);
  const [adminWds, setAdminWds] = useState<WithdrawalItem[]>([]);
  const [adminUserWDStats, setAdminUserWDStats] = useState<AdminUserWDStat[]>([]);
  const [adminReasonMap, setAdminReasonMap] = useState<Record<number, string>>({});
  const [adminEditMap, setAdminEditMap] = useState<Record<number, { email: string; email_pass: string }>>({});
  const [adminNewEmail, setAdminNewEmail] = useState("");
  const [adminNewPass, setAdminNewPass] = useState("");
  const [adminNoteSentId, setAdminNoteSentId] = useState<number | null>(null);
  const [adminThreads, setAdminThreads] = useState<AdminChatThread[]>([]);
  const [adminActiveUserId, setAdminActiveUserId] = useState<number | null>(null);
  const [adminChatMsgs, setAdminChatMsgs] = useState<ChatMsg[]>([]);
  const [adminReplyInput, setAdminReplyInput] = useState("");

  const loadAdminData = useCallback(async (filter = "all", wdFilter = "all") => {
    const [subsRes, chatsRes, wdRes, lbRes] = await Promise.all([
      apiRequest<{ data: AdminSubmission[] }>(`/admin/submissions?status=${filter}`),
      apiRequest<{ threads: AdminChatThread[] | null }>("/admin/chats"),
      apiRequest<{ data: WithdrawalItem[] | null; user_stats: AdminUserWDStat[] | null }>(
        `/admin/withdrawals?status=${wdFilter}`
      ),
      apiRequest<{ leaderboard: LeaderboardRow[] }>("/leaderboard"),
    ]);
    setAdminSubs(subsRes.data || []);
    setAdminThreads(chatsRes.threads || []);
    setAdminWds(wdRes.data || []);
    setAdminUserWDStats(wdRes.user_stats || []);
    setLbRows(lbRes.leaderboard || []);
  }, []);

  const hydrateAll = useCallback(async () => {
    const [sum, subs, notifRes, refRes, lbRes, chatRes, wdRes] = await Promise.all([
      apiRequest<{
        balance: number;
        limit: number;
        today_count: number;
        user: ApiUser;
      }>("/dashboard/summary"),
      apiRequest<{ data: Submission[] }>("/submissions"),
      apiRequest<{ notifications: Notif[] }>("/notifications"),
      apiRequest<{
        code: string;
        invite_link: string;
        successful_count: number;
        total_bonus: number;
        referred_users: RefFriend[] | null;
        bonus_history: RefBonusItem[] | null;
      }>("/referrals"),
      apiRequest<{ leaderboard: LeaderboardRow[] }>("/leaderboard"),
      apiRequest<{ messages: ChatMsg[] }>("/chat"),
      apiRequest<{ data: WithdrawalItem[] | null }>("/withdrawals"),
    ]);

    setUser(sum.user.username);
    setUserEmail(sum.user.email || "");
    setFullName(sum.user.full_name || "");
    setPhone(sum.user.phone || "");
    setRole(sum.user.role || "user");
    setAvatar(sum.user.avatar || "");
    setBal(sum.balance);
    setWdTotal(sum.user.total_wd || 0);
    setDailyLimit(sum.limit || DAILY_LIMIT);
    setTodayCount(sum.today_count || 0);
    setAgreed(sum.user.agreed_tnc);

    if (sum.user.role === "admin") {
      loadAdminData(adminFilter, adminWdFilter).catch(() => {});
    }

    setItems(subs.data || []);
    setNotifs(notifRes.notifications || []);

    setRefCode(refRes.code || sum.user.referral_code || "");
    setRefLink(refRes.invite_link || "");
    setRefList(refRes.referred_users || []);
    setRefBonuses(refRes.bonus_history || []);
    setRefSuccessCount(refRes.successful_count || 0);
    setRefTotalBonus(refRes.total_bonus || 0);

    setLbRows(lbRes.leaderboard || []);
    setChatMsgs(chatRes.messages || []);
    setWithdrawals(wdRes.data || []);
    return sum.user;
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        if (active) setBooting(false);
        return;
      }
      try {
        const u = await hydrateAll();
        if (!active) return;
        setLoggedIn(true);
        if (u.role === "admin") {
          setTab("admin");
        } else if (!u.agreed_tnc) {
          setTab("tnc");
        }
      } catch {
        clearToken();
        if (active) setLoggedIn(false);
      } finally {
        if (active) setBooting(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, [hydrateAll]);

  const unreadCount = useMemo(
    () => notifs.filter((n) => !n.is_read).length,
    [notifs]
  );

  const counts = useMemo(() => {
    const c = { ok: 0, pend: 0, bad: 0, chk: 0 };
    items.forEach((i) => {
      if (c[i.status] !== undefined) c[i.status]++;
    });
    return c;
  }, [items]);

  const storCheck = useMemo(() => {
    const e = storEmail.trim().toLowerCase();
    const fmtOk = EMAIL_RULE.test(e);
    const passOk = storPass.length >= 8;
    const uniqueOk = !items.some((i) => i.email.toLowerCase() === e);
    return {
      e,
      fmtOk,
      passOk,
      uniqueOk,
      touched: storEmail.length > 0 || storPass.length > 0,
      allOk: fmtOk && passOk && uniqueOk,
    };
  }, [storEmail, storPass, items]);

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const em = loginEmail.trim().toLowerCase();
    if (!em || !em.includes("@") || loginPass.length < 6) {
      setLoginErr("Isi alamat email yang valid dan kata sandi (min. 6 karakter).");
      return;
    }

    setAuthBusy(true);
    setLoginErr("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: em, password: loginPass }
          : { email: em, username: regUsername.trim(), password: loginPass };

      const res = await apiRequest<{ token: string; user: ApiUser }>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setToken(res.token);
      const loadedUser = await hydrateAll();
      setLoggedIn(true);
      setLoginPass("");
      if (loadedUser.role === "admin") {
        setTab("admin");
      } else {
        setTab(loadedUser.agreed_tnc ? "home" : "tnc");
      }
    } catch (err) {
      clearToken();
      setLoggedIn(false);
      setLoginErr(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setLoginErr("");
    try {
      const res = await apiRequest<{ token: string; user: ApiUser }>(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify({
            email: "pengguna.google@gmail.com",
            name: "pengguna_google",
            avatar: "",
          }),
        }
      );

      setToken(res.token);
      const loadedUser = await hydrateAll();
      setLoggedIn(true);
      setTab(loadedUser.agreed_tnc ? "home" : "tnc");
    } catch (err) {
      clearToken();
      setLoggedIn(false);
      setLoginErr(err instanceof Error ? err.message : "Gagal masuk lewat Google.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setNotifOpen(false);
    setChatOpen(false);
    setTab("home");
    router.push("/");
  };

  const handleStor = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setStorErr("");
    if (!agreed) {
      setStorErr("Baca dan setujui Syarat & Ketentuan dulu.");
      return;
    }
    if (todayCount >= dailyLimit) {
      setStorErr("Batas setor hari ini sudah habis.");
      return;
    }
    if (!storCheck.allOk) {
      setStorErr(
        "Email harus diawali “get” dan berakhiran @gmail.com, kata sandi min. 8 karakter, dan belum pernah disetor."
      );
      return;
    }

    setStorBusy(true);
    try {
      await apiRequest("/submissions", {
        method: "POST",
        body: JSON.stringify({ email: storCheck.e, password: storPass }),
      });
      setStorEmail("");
      setStorPass("");
      await hydrateAll();
      setTab("riwayat");

      setTimeout(() => {
        hydrateAll().catch(() => {});
      }, 2200);
      setTimeout(() => {
        hydrateAll().catch(() => {});
      }, 5500);
    } catch (err) {
      setStorErr(err instanceof Error ? err.message : "Gagal menyetor Gmail.");
    } finally {
      setStorBusy(false);
    }
  };

  const handleChecker = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!checkRaw.trim()) return;
    setCheckBusy(true);
    try {
      const res = await apiRequest<{
        results: { email: string; status: string; message: string }[];
      }>("/checker", {
        method: "POST",
        body: JSON.stringify({ raw: checkRaw }),
      });
      setCheckRes(
        (res.results || []).map((r) => ({
          email: r.email,
          cls: r.status === "ok" ? "t-ok" : r.status === "warn" ? "t-pend" : "t-bad",
          label: r.message,
        }))
      );
    } catch {
      setCheckRes([]);
    } finally {
      setCheckBusy(false);
    }
  };

  const handleWithdraw = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setWdErr("");
    setWdOk("");
    if (bal < MIN_WITHDRAW || !wdMethod.trim() || !wdNumber.trim()) {
      setWdErr(
        `Saldo minimal ${rp(MIN_WITHDRAW)} dan isi metode serta nomor tujuan.`
      );
      return;
    }

    setWdBusy(true);
    try {
      await apiRequest("/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          method: wdMethod,
          account_number: wdNumber.trim(),
          amount: bal,
        }),
      });
      setWdNumber("");
      setWdOk(`Penarikan ke ${wdMethod} berhasil diajukan.`);
      await hydrateAll();
    } catch (err) {
      setWdErr(err instanceof Error ? err.message : "Gagal mengajukan penarikan.");
    } finally {
      setWdBusy(false);
    }
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

  const handleSendChat = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const t = chatInput.trim();
    if (!t) return;
    setChatInput("");
    try {
      await apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify({ message: t }),
      });
      const res = await apiRequest<{ messages: ChatMsg[] }>("/chat");
      setChatMsgs(res.messages || []);
      setTimeout(() => {
        apiRequest<{ messages: ChatMsg[] }>("/chat")
          .then((r) => setChatMsgs(r.messages || []))
          .catch(() => {});
      }, 1300);
    } catch {
      // ignore transient error
    }
  };

  const refPercent = Math.min(
    100,
    Math.round((refSuccessCount / REF_TARGET) * 100)
  );

  if (booting) {
    return (
      <div className="app">
        <header className="wrap masthead app-masthead">
          <Link className="brand" href="/">
            storget<span className="brand-dot">.</span>
          </Link>
        </header>
        <main className="wrap view">
          <p className="muted">Memeriksa sesi akun…</p>
        </main>
      </div>
    );
  }

  /* ---------------- LOGIN VIEW ---------------- */
  if (!loggedIn) {
    return (
      <div className="app">
        <header className="wrap masthead app-masthead">
          <Link className="brand" href="/" aria-label="StorGet, kembali ke beranda">
            storget<span className="brand-dot">.</span>
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
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="mis. budi21@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </label>

              {authMode === "register" && (
                <label className="field">
                  <span className="field-label">Username tampilan (opsional)</span>
                  <input
                    className="input"
                    autoComplete="username"
                    placeholder="mis. Budi (bukan email)"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </label>
              )}

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
                disabled={authBusy}
                className="btn btn-block"
                style={{ marginTop: 20 }}
              >
                {authBusy
                  ? "Memproses…"
                  : authMode === "login"
                    ? "Masuk"
                    : "Daftar"}
              </button>

              <div className="divider-or">atau</div>

              <button
                type="button"
                disabled={authBusy}
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
        <button
          type="button"
          className="brand"
          style={{ background: "none", border: 0, padding: 0, textAlign: "left" }}
          aria-label="StorGet, kembali ke beranda aplikasi"
          onClick={() => setTab(role === "admin" ? "admin" : "home")}
        >
          storget<span className="brand-dot">.</span>
        </button>

        <div className="app-tools">
          <ThemeToggle />

          {role !== "admin" && (
            <button
              type="button"
              className="btn btn-line btn-sm"
              aria-expanded={notifOpen}
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next && unreadCount > 0) {
                  apiRequest("/notifications/read-all", { method: "PUT" })
                    .then(() =>
                      setNotifs((prev) =>
                        prev.map((n) => ({ ...n, is_read: true }))
                      )
                    )
                    .catch(() => {});
                }
              }}
            >
              Notifikasi
              {unreadCount > 0 && <span className="count">{unreadCount}</span>}
            </button>
          )}

          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={handleLogout}
          >
            Keluar
          </button>

          {role !== "admin" && notifOpen && (
            <div className="notif-panel" role="region" aria-label="Daftar notifikasi">
              {notifs.length === 0 ? (
                <p className="empty">Belum ada notifikasi.</p>
              ) : (
                <ul className="ledger-list">
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <div>
                        {n.message}
                        <small>{formatTime(n.created_at)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      {role !== "admin" && (
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
      )}

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
                    {todayCount}/{dailyLimit} · Sisa{" "}
                    {Math.max(0, dailyLimit - todayCount)}
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.min(100, (todayCount / dailyLimit) * 100)}%`,
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
                        {refSuccessCount}/{REF_TARGET} teman
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

                <button type="submit" disabled={storBusy} className="btn btn-block">
                  {storBusy ? "Menyetor…" : `Setor, dapat ${rp(PRICE)}`}
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
                <button type="submit" disabled={checkBusy} className="btn btn-block">
                  {checkBusy ? "Mengecek…" : "Cek sekarang"}
                </button>
                <p className="sample-disclosure">
                  Terhubung ke endpoint `/api/v1/checker`.
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
              {editSubErr && (
                <p className="msg msg-bad" style={{ marginBottom: 14 }}>
                  {editSubErr}
                </p>
              )}
              {items.length === 0 ? (
                <p className="empty">
                  Belum ada setoran. Mulai dari menu Stor.
                </p>
              ) : (
                <ul className="ledger-list">
                  {items.map((it) => {
                    const m = STATUS_META[it.status] || STATUS_META.pend;
                    const isEditing = editingSubId === it.id;
                    return (
                      <li
                        key={it.id}
                        style={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div className="em">
                            {it.email}
                            <small>
                              {formatTime(it.created_at)}
                              {it.status === "ok" ? ` · +${rp(PRICE)}` : ""}
                              {it.reason ? ` · Catatan: ${it.reason}` : ""}
                            </small>
                          </div>
                          <span className={`tag ${m.cls}`}>{m.label}</span>
                        </div>

                        {it.status === "pend" && !isEditing && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 36, padding: "4px 12px" }}
                              onClick={() => {
                                setEditingSubId(it.id);
                                setEditSubEmail(it.email);
                                setEditSubPass("");
                                setEditSubErr("");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{
                                minHeight: 36,
                                padding: "4px 12px",
                                borderColor: "var(--bad)",
                                color: "var(--bad)",
                              }}
                              onClick={async () => {
                                setEditSubErr("");
                                try {
                                  await apiRequest(`/submissions/${it.id}`, {
                                    method: "DELETE",
                                  });
                                  await hydrateAll();
                                } catch (err) {
                                  setEditSubErr(
                                    err instanceof Error
                                      ? err.message
                                      : "Gagal menghapus setoran."
                                  );
                                }
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                        )}

                        {isEditing && (
                          <form
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              padding: 12,
                              background: "var(--rose)",
                            }}
                            onSubmit={async (e) => {
                              e.preventDefault();
                              setEditSubErr("");
                              try {
                                await apiRequest(`/submissions/${it.id}`, {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    email: editSubEmail,
                                    password: editSubPass,
                                  }),
                                });
                                setEditingSubId(null);
                                setEditSubPass("");
                                await hydrateAll();
                              } catch (err) {
                                setEditSubErr(
                                  err instanceof Error
                                    ? err.message
                                    : "Gagal memperbarui setoran."
                                );
                              }
                            }}
                          >
                            <input
                              className="input"
                              style={{ flex: "1 1 200px", minHeight: 40 }}
                              type="email"
                              placeholder="getnama123@gmail.com"
                              value={editSubEmail}
                              onChange={(e) => setEditSubEmail(e.target.value)}
                            />
                            <input
                              className="input"
                              style={{ flex: "1 1 160px", minHeight: 40 }}
                              type="text"
                              placeholder="Kata sandi baru (opsional)"
                              value={editSubPass}
                              onChange={(e) => setEditSubPass(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="btn btn-sm"
                              style={{ minHeight: 40 }}
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={() => {
                                setEditingSubId(null);
                                setEditSubErr("");
                              }}
                            >
                              Batal
                            </button>
                          </form>
                        )}
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

                <button type="submit" disabled={wdBusy} className="btn btn-block">
                  {wdBusy ? "Mengajukan…" : "Ajukan penarikan"}
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
                  <li>Saldo dipotong otomatis setelah admin klik Done</li>
                  <li>Pastikan nomor tujuan aktif dan benar</li>
                </ul>
              </aside>
            </div>

            <div className="panel">
              <h2>Riwayat penarikan</h2>
              {withdrawals.length === 0 ? (
                <p className="empty">Belum ada pengajuan penarikan.</p>
              ) : (
                <ul className="ledger-list">
                  {withdrawals.map((w) => (
                    <li key={w.id}>
                      <div className="em">
                        {w.method} · {w.account_number}
                        <small>
                          {rp(w.amount)} · {formatTime(w.created_at)}
                        </small>
                      </div>
                      <span
                        className={`tag ${
                          w.status === "approved"
                            ? "t-ok"
                            : w.status === "rejected"
                              ? "t-bad"
                              : "t-pend"
                        }`}
                      >
                        {w.status === "approved"
                          ? "Selesai"
                          : w.status === "rejected"
                            ? "Ditolak"
                            : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
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
                    {refSuccessCount} / {REF_TARGET}
                  </dd>
                </div>
                <div>
                  <dt>Sisa</dt>
                  <dd>{Math.max(0, REF_TARGET - refSuccessCount)} Teman</dd>
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
                <dd>{refSuccessCount}</dd>
              </div>
              <div>
                <dt>Total bonus diterima</dt>
                <dd>{rp(refTotalBonus)}</dd>
              </div>
            </dl>

            <div className="panel">
              <h2>Kode &amp; link referral kamu</h2>
              <div className="copy-row">
                <div>
                  <small>Kode</small>
                  <code>{refCode || "-"}</code>
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
                    {refLink || `https://situsmu.com/daftar?ref=${refCode}`}
                  </code>
                </div>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() =>
                    handleCopy(
                      refLink || `https://situsmu.com/daftar?ref=${refCode}`,
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
                        <span className="em">{x.username}</span>
                        <span
                          className={`tag ${x.is_successful ? "t-ok" : "t-pend"}`}
                        >
                          {x.is_successful
                            ? "Berhasil"
                            : "Menunggu stor pertama"}
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
                  {refBonuses.map((b) => (
                    <li key={b.id}>
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
              Peringkat realtime berdasarkan total penarikan terbesar.
            </p>

            {lbRows.length === 0 ? (
              <p className="empty" style={{ marginTop: 24 }}>
                Belum ada data user pada leaderboard.
              </p>
            ) : (
              <ul className="ledger-list" style={{ marginTop: 32 }}>
                {lbRows.map((r) => (
                  <li key={`${r.rank}-${r.username}`} className={r.is_me ? "lb-me" : undefined}>
                    <div className="em">
                      <span className="rank">{r.rank}.</span>
                      {r.username}{" "}
                      {r.is_me && (
                        <span className="tag t-chk" style={{ marginLeft: 8 }}>
                          Kamu
                        </span>
                      )}
                      <small>
                        {r.wd_count}x penarikan · {r.accepted_count} Gmail diterima
                      </small>
                    </div>
                    <strong className="num">{rp(r.total_wd)}</strong>
                  </li>
                ))}
              </ul>
            )}
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
                  Penarikan minimal {rp(MIN_WITHDRAW)} dan hanya bisa dilakukan
                  jika fitur penarikan sedang dibuka Admin.
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
              onClick={async () => {
                try {
                  await apiRequest("/auth/agree-tnc", { method: "POST" });
                  setAgreed(true);
                  await hydrateAll();
                  setTab("home");
                } catch {
                  setAgreed(true);
                  setTab("home");
                }
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
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {userEmail || "Email belum diatur"}
                  {fullName ? ` · ${fullName}` : ""}
                  {phone ? ` · ${phone}` : ""}
                </p>
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
                      reader.onload = async () => {
                        const dataUrl = String(reader.result || "");
                        setAvatar(dataUrl);
                        await apiRequest("/auth/avatar", {
                          method: "PUT",
                          body: JSON.stringify({ avatar: dataUrl }),
                        }).catch(() => {});
                      };
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

            <div className="panel">
              <h2 className="display" style={{ fontSize: 28, marginBottom: 14 }}>
                Info pribadi
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileMsg(null);
                  try {
                    await apiRequest("/auth/profile", {
                      method: "PUT",
                      body: JSON.stringify({
                        email: userEmail,
                        full_name: fullName,
                        phone,
                      }),
                    });
                    setProfileMsg({ text: "Info pribadi berhasil disimpan.", ok: true });
                    await hydrateAll();
                  } catch (err) {
                    setProfileMsg({
                      text: err instanceof Error ? err.message : "Gagal menyimpan info pribadi.",
                      ok: false,
                    });
                  }
                }}
              >
                <div className="forms" style={{ marginTop: 0 }}>
                  <label className="field" style={{ marginTop: 0 }}>
                    <span className="field-label">Email akun</span>
                    <input
                      className="input"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </label>
                  <label className="field" style={{ marginTop: 0 }}>
                    <span className="field-label">Nama lengkap</span>
                    <input
                      className="input"
                      placeholder="Nama lengkap kamu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span className="field-label">No. HP / E-Wallet</span>
                  <input
                    className="input"
                    placeholder="mis. 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                {profileMsg && (
                  <p className={`msg ${profileMsg.ok ? "msg-ok" : "msg-bad"}`}>
                    {profileMsg.text}
                  </p>
                )}
                <button type="submit" className="btn btn-sm" style={{ marginTop: 16 }}>
                  Simpan info pribadi
                </button>
              </form>
            </div>

            <div className="forms">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setNameMsg(null);
                  const v = newUsername.trim();
                  if (v.length < 3) {
                    setNameMsg({
                      text: "Username minimal 3 karakter.",
                      ok: false,
                    });
                    return;
                  }
                  try {
                    await apiRequest("/auth/username", {
                      method: "PUT",
                      body: JSON.stringify({ username: v }),
                    });
                    setUser(v);
                    setNewUsername("");
                    setNameMsg({
                      text: "Username berhasil diganti.",
                      ok: true,
                    });
                    await hydrateAll();
                  } catch (err) {
                    setNameMsg({
                      text: err instanceof Error ? err.message : "Gagal mengganti username.",
                      ok: false,
                    });
                  }
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPassMsg(null);
                  try {
                    await apiRequest("/auth/password", {
                      method: "PUT",
                      body: JSON.stringify({
                        old_password: oldPass,
                        new_password: newPass,
                        confirm_password: confirmPass,
                      }),
                    });
                    setOldPass("");
                    setNewPass("");
                    setConfirmPass("");
                    setPassMsg({
                      text: "Kata sandi berhasil diganti.",
                      ok: true,
                    });
                    await hydrateAll();
                  } catch (err) {
                    setPassMsg({
                      text: err instanceof Error ? err.message : "Gagal mengganti kata sandi.",
                      ok: false,
                    });
                  }
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

        {/* PANEL ADMIN */}
        {tab === "admin" && role === "admin" && (
          <>
            <h1 className="display view-title">Panel Admin</h1>
            <p className="view-lede">
              Halo <strong>{user}</strong> ({userEmail}). Kelola setoran Gmail
              (CRUD), penarikan user, chat support, dan leaderboard realtime.
            </p>

            <div className="subtabs" style={{ marginTop: 28, overflowX: "auto" }}>
              <button
                type="button"
                className="tab"
                aria-current={adminSubTab === "subs" ? "page" : undefined}
                onClick={() => setAdminSubTab("subs")}
              >
                Setoran Gmail ({adminSubs.length})
              </button>
              <button
                type="button"
                className="tab"
                aria-current={adminSubTab === "wd" ? "page" : undefined}
                onClick={() => {
                  setAdminSubTab("wd");
                  loadAdminData(adminFilter, adminWdFilter).catch(() => {});
                }}
              >
                Penarikan ({adminWds.length})
              </button>
              <button
                type="button"
                className="tab"
                aria-current={adminSubTab === "chats" ? "page" : undefined}
                onClick={() => {
                  setAdminSubTab("chats");
                  loadAdminData(adminFilter, adminWdFilter).catch(() => {});
                }}
              >
                Chat User ({adminThreads.length})
              </button>
              <button
                type="button"
                className="tab"
                aria-current={adminSubTab === "lb" ? "page" : undefined}
                onClick={() => {
                  setAdminSubTab("lb");
                  loadAdminData(adminFilter, adminWdFilter).catch(() => {});
                }}
              >
                Leaderboard
              </button>
            </div>

            {adminSubTab === "subs" && (
              <div style={{ marginTop: 24 }}>
                {/* Admin Create Submission (CRUD - Create) */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!adminNewEmail.trim() || !adminNewPass.trim()) return;
                    await apiRequest("/admin/submissions", {
                      method: "POST",
                      body: JSON.stringify({
                        email: adminNewEmail.trim(),
                        email_pass: adminNewPass.trim(),
                        status: "pend",
                      }),
                    });
                    setAdminNewEmail("");
                    setAdminNewPass("");
                    await loadAdminData(adminFilter, adminWdFilter);
                  }}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 20,
                    padding: 14,
                    background: "var(--rose)",
                  }}
                >
                  <input
                    className="input"
                    style={{ flex: "1 1 200px", minHeight: 42 }}
                    placeholder="Tambah email Gmail baru…"
                    value={adminNewEmail}
                    onChange={(e) => setAdminNewEmail(e.target.value)}
                  />
                  <input
                    className="input"
                    style={{ flex: "1 1 160px", minHeight: 42 }}
                    placeholder="Password email…"
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                  />
                  <button type="submit" className="btn btn-sm" style={{ minHeight: 42 }}>
                    + Tambah Email
                  </button>
                </form>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div className="choice" role="group" aria-label="Filter status setoran">
                    {[
                      { k: "all", l: "Semua" },
                      { k: "pend", l: "Pending" },
                      { k: "chk", l: "Di cek" },
                      { k: "ok", l: "Diterima" },
                      { k: "bad", l: "Ditolak" },
                    ].map((f) => (
                      <button
                        key={f.k}
                        type="button"
                        aria-pressed={adminFilter === f.k}
                        onClick={() => {
                          setAdminFilter(f.k);
                          loadAdminData(f.k, adminWdFilter).catch(() => {});
                        }}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={async () => {
                      const token = getToken();
                      const res = await fetch(
                        `${API_BASE}/admin/submissions/export?status=${adminFilter}`,
                        {
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        }
                      );
                      if (!res.ok) return;
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "storget-submissions.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export Excel (.csv)
                  </button>
                </div>

                {adminSubs.length === 0 ? (
                  <p className="empty">Belum ada setoran Gmail pada filter ini.</p>
                ) : (
                  <ul className="ledger-list">
                    {adminSubs.map((s) => {
                      const m = STATUS_META[s.status] || STATUS_META.pend;
                      return (
                        <li
                          key={s.id}
                          style={{
                            flexDirection: "column",
                            alignItems: "stretch",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 12,
                            }}
                          >
                            <div className="em">
                              {s.email}
                              <small>
                                Password: <strong>{s.email_pass}</strong> · User:{" "}
                                {s.username} · {formatTime(s.created_at)}
                              </small>
                              {s.reason && (
                                <small>Alasan: {s.reason}</small>
                              )}
                            </div>
                            <span className={`tag ${m.cls}`}>{m.label}</span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <input
                              className="input"
                              style={{ flex: "1 1 170px", minHeight: 40, padding: "6px 10px", fontSize: 13 }}
                              aria-label="Edit email"
                              value={adminEditMap[s.id]?.email ?? s.email}
                              onChange={(e) =>
                                setAdminEditMap((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    email: e.target.value,
                                    email_pass: prev[s.id]?.email_pass ?? s.email_pass,
                                  },
                                }))
                              }
                            />
                            <input
                              className="input"
                              style={{ flex: "1 1 140px", minHeight: 40, padding: "6px 10px", fontSize: 13 }}
                              aria-label="Edit password email"
                              value={adminEditMap[s.id]?.email_pass ?? s.email_pass}
                              onChange={(e) =>
                                setAdminEditMap((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    email: prev[s.id]?.email ?? s.email,
                                    email_pass: e.target.value,
                                  },
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={async () => {
                                const draft = adminEditMap[s.id];
                                await apiRequest(`/admin/submissions/${s.id}`, {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    email: draft?.email ?? s.email,
                                    email_pass: draft?.email_pass ?? s.email_pass,
                                    reason: adminReasonMap[s.id] ?? s.reason,
                                  }),
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Simpan Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40, borderColor: "var(--bad)", color: "var(--bad)" }}
                              onClick={async () => {
                                await apiRequest(`/admin/submissions/${s.id}`, {
                                  method: "DELETE",
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Hapus
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <input
                              className="input"
                              style={{ flex: "1 1 180px", minHeight: 40, padding: "6px 10px", fontSize: 13 }}
                              placeholder="Catatan / alasan untuk user (mis. PW salah)…"
                              value={adminReasonMap[s.id] ?? s.reason ?? ""}
                              onChange={(e) =>
                                setAdminReasonMap((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={async () => {
                                const note = (adminReasonMap[s.id] ?? s.reason ?? "").trim();
                                if (!note) return;
                                await apiRequest(`/admin/submissions/${s.id}/note`, {
                                  method: "POST",
                                  body: JSON.stringify({ note }),
                                });
                                setAdminNoteSentId(s.id);
                                setTimeout(() => setAdminNoteSentId(null), 2000);
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              {adminNoteSentId === s.id ? "Terkirim!" : "Kirim Catatan"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={async () => {
                                await apiRequest(`/admin/submissions/${s.id}/status`, {
                                  method: "PUT",
                                  body: JSON.stringify({ status: "chk" }),
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Di cek
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={async () => {
                                await apiRequest(`/admin/submissions/${s.id}/status`, {
                                  method: "PUT",
                                  body: JSON.stringify({ status: "ok" }),
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Terima (+Rp2.500)
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40, borderColor: "var(--bad)", color: "var(--bad)" }}
                              onClick={async () => {
                                await apiRequest(`/admin/submissions/${s.id}/status`, {
                                  method: "PUT",
                                  body: JSON.stringify({
                                    status: "bad",
                                    reason: adminReasonMap[s.id] || "Akun tidak aktif / tidak sesuai",
                                  }),
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Tolak
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {adminSubTab === "wd" && (
              <div style={{ marginTop: 24 }}>
                <div className="choice" role="group" aria-label="Filter status penarikan" style={{ marginBottom: 20 }}>
                  {[
                    { k: "all", l: "Semua" },
                    { k: "pending", l: "Pending" },
                    { k: "approved", l: "Selesai (Done)" },
                    { k: "rejected", l: "Ditolak" },
                  ].map((f) => (
                    <button
                      key={f.k}
                      type="button"
                      aria-pressed={adminWdFilter === f.k}
                      onClick={() => {
                        setAdminWdFilter(f.k);
                        loadAdminData(adminFilter, f.k).catch(() => {});
                      }}
                    >
                      {f.l}
                    </button>
                  ))}
                </div>

                {adminWds.length === 0 ? (
                  <p className="empty">Belum ada pengajuan penarikan pada filter ini.</p>
                ) : (
                  <ul className="ledger-list">
                    {adminWds.map((w) => (
                      <li
                        key={w.id}
                        style={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <div className="em">
                            {w.username || `User #${w.user_id}`} —{" "}
                            <strong className="num">{rp(w.amount)}</strong>
                            <small>
                              {w.method} · {w.account_number} ·{" "}
                              {formatTime(w.created_at)}
                            </small>
                            <small>
                              Riwayat user ini: sudah narik{" "}
                              <strong>{w.user_wd_count ?? 0}x</strong> · total{" "}
                              <strong className="num">{rp(w.user_wd_total ?? 0)}</strong>
                            </small>
                          </div>
                          <span
                            className={`tag ${
                              w.status === "approved"
                                ? "t-ok"
                                : w.status === "rejected"
                                  ? "t-bad"
                                  : "t-pend"
                            }`}
                          >
                            {w.status === "approved"
                              ? "Selesai"
                              : w.status === "rejected"
                                ? "Ditolak"
                                : "Pending"}
                          </span>
                        </div>

                        {w.status === "pending" && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ minHeight: 40 }}
                              onClick={async () => {
                                await apiRequest(`/admin/withdrawals/${w.id}/status`, {
                                  method: "PUT",
                                  body: JSON.stringify({ status: "approved" }),
                                });
                                await Promise.all([
                                  loadAdminData(adminFilter, adminWdFilter),
                                  hydrateAll(),
                                ]);
                              }}
                            >
                              Done (Potong Saldo User)
                            </button>
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              style={{ minHeight: 40, borderColor: "var(--bad)", color: "var(--bad)" }}
                              onClick={async () => {
                                await apiRequest(`/admin/withdrawals/${w.id}/status`, {
                                  method: "PUT",
                                  body: JSON.stringify({ status: "rejected" }),
                                });
                                await loadAdminData(adminFilter, adminWdFilter);
                              }}
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="panel">
                  <h2 className="display" style={{ fontSize: 24, marginBottom: 12 }}>
                    Rekap Penarikan per User
                  </h2>
                  {adminUserWDStats.length === 0 ? (
                    <p className="empty">Belum ada data user.</p>
                  ) : (
                    <ul className="ledger-list">
                      {adminUserWDStats.map((st) => (
                        <li key={st.user_id}>
                          <div className="em">
                            {st.username}
                            <small>
                              {st.email || "-"} · Sisa saldo: {rp(st.balance)}
                            </small>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <strong className="num">{rp(st.wd_total)}</strong>
                            <small style={{ display: "block" }}>
                              {st.wd_count}x narik
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {adminSubTab === "lb" && (
              <div style={{ marginTop: 24 }}>
                <h2 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
                  Leaderboard Realtime (Penarikan Terbesar)
                </h2>
                <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
                  Otomatis diperbarui setiap kali penarikan user di-Done oleh admin.
                </p>
                {lbRows.length === 0 ? (
                  <p className="empty">Belum ada data user pada leaderboard.</p>
                ) : (
                  <ul className="ledger-list">
                    {lbRows.map((r) => (
                      <li key={`${r.rank}-${r.username}`}>
                        <div className="em">
                          <span className="rank">{r.rank}.</span>
                          {r.username}
                          <small>
                            {r.wd_count}x penarikan · {r.accepted_count} Gmail diterima
                          </small>
                        </div>
                        <strong className="num">{rp(r.total_wd)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {adminSubTab === "chats" && (
              <div className="work" style={{ marginTop: 24 }}>
                <div className="work-main">
                  <h2 className="display" style={{ fontSize: 24, marginBottom: 14 }}>
                    Daftar Chat User
                  </h2>
                  {adminThreads.length === 0 ? (
                    <p className="empty">Belum ada pesan masuk dari user.</p>
                  ) : (
                    <ul className="more">
                      {adminThreads.map((t) => (
                        <li key={t.user_id}>
                          <button
                            type="button"
                            onClick={async () => {
                              setAdminActiveUserId(t.user_id);
                              const res = await apiRequest<{ messages: ChatMsg[] }>(
                                `/admin/chats/${t.user_id}`
                              );
                              setAdminChatMsgs(res.messages || []);
                            }}
                          >
                            <div>
                              <strong>{t.username}</strong>
                              <small style={{ display: "block" }}>
                                {t.last_message}
                              </small>
                            </div>
                            <span>{formatTime(t.updated_at)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="work-side">
                  <h2 className="display" style={{ fontSize: 24 }}>
                    Balas Pesan
                  </h2>
                  {!adminActiveUserId ? (
                    <p>Pilih user di sebelah kiri untuk membaca dan membalas pesan.</p>
                  ) : (
                    <>
                      <div
                        className="chat-msgs"
                        style={{
                          maxHeight: 280,
                          marginTop: 14,
                          background: "var(--paper)",
                          border: "1px solid var(--ink)",
                        }}
                      >
                        {adminChatMsgs.map((m, i) => (
                          <div key={m.id || i} className={`bubble ${m.sender}`}>
                            {m.message}
                          </div>
                        ))}
                      </div>

                      <form
                        className="chat-form"
                        style={{ paddingInline: 0, borderTop: 0, marginTop: 8 }}
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const txt = adminReplyInput.trim();
                          if (!txt || !adminActiveUserId) return;
                          setAdminReplyInput("");
                          await apiRequest(`/admin/chats/${adminActiveUserId}`, {
                            method: "POST",
                            body: JSON.stringify({ message: txt }),
                          });
                          const res = await apiRequest<{ messages: ChatMsg[] }>(
                            `/admin/chats/${adminActiveUserId}`
                          );
                          setAdminChatMsgs(res.messages || []);
                          await loadAdminData(adminFilter);
                        }}
                      >
                        <input
                          className="input"
                          placeholder="Tulis balasan admin…"
                          value={adminReplyInput}
                          onChange={(e) => setAdminReplyInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-sm">
                          Balas
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CHAT SUPPORT (USER ONLY) */}
      {role !== "admin" && !chatOpen && (
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
              <div key={m.id || i} className={`bubble ${m.sender}`}>
                {m.message}
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
