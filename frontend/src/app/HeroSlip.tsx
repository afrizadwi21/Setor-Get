"use client";

import Link from "next/link";
import { useState } from "react";
import { EMAIL_RULE, PRICE, rp } from "@/lib/setor";

export default function HeroSlip() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const e = email.trim().toLowerCase();
  const rules = [
    {
      label: "Diawali “get” dan berakhiran @gmail.com",
      ok: EMAIL_RULE.test(e),
      touched: email.length > 0,
    },
    { label: "Kata sandi minimal 8 karakter", ok: pass.length >= 8, touched: pass.length > 0 },
  ];
  const touched = rules.some((r) => r.touched);
  const allOk = rules.every((r) => r.ok);

  return (
    <div className="slip-stage" id="cek">
      <form className="slip" onSubmit={(ev) => ev.preventDefault()} aria-labelledby="slip-title">
        <h2 className="slip-title" id="slip-title">
          Slip setoran
        </h2>
        <p className="slip-sub">Ketik sebuah alamat. Aturannya ikut berubah saat kamu mengetik.</p>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            placeholder="getnama123@gmail.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Kata sandi email</span>
          <input
            className="input"
            type="password"
            autoComplete="off"
            placeholder="Minimal 8 karakter"
            value={pass}
            onChange={(ev) => setPass(ev.target.value)}
          />
        </label>

        <ul className="rules">
          {rules.map((r) => (
            <li key={r.label}>
              <span>{r.label}</span>
              <span className={`rule-state ${r.ok ? "is-ok" : r.touched ? "is-no" : ""}`}>
                {r.ok ? "Sesuai" : r.touched ? "Belum" : "Menunggu"}
              </span>
            </li>
          ))}
        </ul>

        <p className="slip-verdict" aria-live="polite">
          {!touched
            ? "Belum ada yang diketik."
            : allOk
              ? `Format sesuai. Kalau lolos pengecekan, ini jadi ${rp(PRICE)}.`
              : "Belum sesuai format."}
        </p>

        <Link className="btn btn-block" href="/app">
          Masuk untuk menyetor
        </Link>
        <p className="slip-note">
          Simulasi format di halaman ini. Status aktif dan apakah alamat pernah disetor dicek setelah kamu
          menyetor dari akunmu.
        </p>
      </form>
    </div>
  );
}
