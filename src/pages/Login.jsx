// src/pages/Login.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";

import vizwalkLogo from "../assets/logo.png";


/**
 * ✅ PUBLIC background (DO NOT import from /public)
 * - put bg_2.jpg in /public/bg_2.jpg
 * - access it via absolute public URL
 */
function getPublicUrl(path = "") {
  // Vite: import.meta.env.BASE_URL
  // CRA:  process.env.PUBLIC_URL
  const viteBase = typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL : "";
  const craBase = typeof process !== "undefined" ? process.env?.PUBLIC_URL : "";
  const base = (viteBase || craBase || "/").toString();
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return normalizedBase + normalizedPath;
}

function sanitizeNext(nextRaw) {
  if (!nextRaw) return "/";
  if (nextRaw.startsWith("http://") || nextRaw.startsWith("https://")) return "/";
  if (!nextRaw.startsWith("/")) return "/";
  return nextRaw;
}

export default function Login() {
  const { sendOtp, verifyOtp, session } = useAuth();

  const [step, setStep] = useState("email"); // email | otp
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);

  // ✅ 6-digit OTP with paste support
  const OTP_LEN = 6;
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(""));
  const otpRefs = useRef([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Verified UI (green card)
  const [verifiedUI, setVerifiedUI] = useState(false);

  // Hold redirect so “Verified!” is visible
  const [holdRedirect, setHoldRedirect] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();

  const next = useMemo(() => {
    const qpNext = new URLSearchParams(loc.search).get("next");
    const stateNext = loc.state?.from ? loc.state.from.pathname + (loc.state.from.search || "") : null;
    return sanitizeNext(qpNext || stateNext || "/");
  }, [loc.search, loc.state]);

  // ✅ Redirect only when not holding (so verified screen stays visible)
  useEffect(() => {
    if (session && !holdRedirect) nav(next, { replace: true });
  }, [session, holdRedirect, nav, next]);

  const mode = verifiedUI ? "verified" : step; // email | otp | verified

  const onSend = async () => {
    const e = email.trim();
    if (!e) return;

    setBusy(true);
    setMsg("");
    setVerifiedUI(false);
    setHoldRedirect(false);

    const res = await sendOtp(e);

    setBusy(false);

    if (res.ok) {
      setStep("otp");
      setMsg("");
      setOtpDigits(Array(OTP_LEN).fill(""));
      setTimeout(() => otpRefs.current?.[0]?.focus?.(), 50);
    } else {
      setStep("email");
      setMsg(res.error || "Could not send OTP.");
    }
  };

  const otpValue = otpDigits.join("");

  const applyOtpString = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!digits) return;

    const nextArr = Array(OTP_LEN).fill("");
    for (let i = 0; i < digits.length; i++) nextArr[i] = digits[i];
    setOtpDigits(nextArr);

    const focusIndex = Math.min(digits.length, OTP_LEN - 1);
    setTimeout(() => otpRefs.current?.[focusIndex]?.focus?.(), 0);
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") || "";
    applyOtpString(text);
  };

  const handleOtpChange = (idx, val) => {
    const digit = (val || "").replace(/\D/g, "").slice(-1);

    const nextArr = [...otpDigits];
    nextArr[idx] = digit;
    setOtpDigits(nextArr);

    if (digit && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus?.();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        const nextArr = [...otpDigits];
        nextArr[idx] = "";
        setOtpDigits(nextArr);
      } else if (idx > 0) {
        otpRefs.current[idx - 1]?.focus?.();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus?.();
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus?.();
    if (e.key === "Enter") onVerify();
  };

  const onVerify = async () => {
    const e = email.trim();
    if (!e || otpValue.length !== OTP_LEN) return;

    setBusy(true);
    setMsg("");

    const res = await verifyOtp(e, otpValue);

    setBusy(false);

    if (!res.ok) {
      setMsg(res.error || "Invalid OTP");
      return;
    }

    // ✅ Show “Verified!” screen and delay redirect
    setVerifiedUI(true);
    setHoldRedirect(true);

    setTimeout(() => {
      nav(next, { replace: true });
    }, 900);
  };

  // ✅ background from /public
  const loginBgUrl = "/bg.jpg";

  return (
    <div
  className={`vwLogin vwLogin--${mode}`}
  style={{
    backgroundImage: `url(${loginBgUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
      <div className="vwLoginOverlay" />

      <div className="vwLoginCenter">
        <div className="vwHero">
          <img className="vwHeroLogo" src={vizwalkLogo} alt="Vizwalk" />
        </div>

        <div className="vwLoginCard">
          {verifiedUI ? (
            <div className="vwVerifiedCard">
              <div className="vwVerifiedIconWrap">
                <svg className="vwVerifiedIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 12a8 8 0 1 1-16 0a8 8 0 0 1 16 0Z" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                  <path
                    d="m8 12.2 2.3 2.3L16.5 9"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="vwVerifiedText">Verified!</div>
              <div className="vwVerifiedDesc">Redirecting you to the dashboard...</div>
              <div className="vwVerifiedSpinner" aria-label="Loading" />
            </div>
          ) : step === "otp" ? (
            <>
              <div className="vwCardTitle vwCardTitle--center">Enter the 6-digit code sent to</div>
              <div className="vwOtpEmail">{email}</div>

              <div className="vwOtpRow">
                {otpDigits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    className="vwOtpBox"
                    value={d}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    inputMode="numeric"
                    maxLength={1}
                  />
                ))}
              </div>

              <button className="vwCta vwCta--compact" disabled={busy || otpValue.length !== OTP_LEN} onClick={onVerify}>
                {busy ? "Verifying…" : "Verify OTP"}
              </button>

              <div className="vwTinyRow">
                <button className="vwTinyLink" disabled={busy} onClick={onSend}>
                  Resend OTP
                </button>
                <span className="vwDot">•</span>
                <button
                  className="vwTinyLink"
                  disabled={busy}
                  onClick={() => {
                    setStep("email");
                    setOtpDigits(Array(OTP_LEN).fill(""));
                    setMsg("");
                  }}
                >
                  Change email
                </button>
              </div>

              {msg ? <div className="vwMsg">{msg}</div> : null}
            </>
          ) : (
            <>
              <div className="vwCardTitle">Sign in with your Flipspaces ID</div>

              <input
                className="vwInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example.abc@flipspaces.com"
                autoComplete="email"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!busy && email.trim()) onSend();
                  }
                }}
              />

              <label className="vwRemember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span className="vwRememberText">Remember Me</span>
              </label>

              <button className="vwCta" disabled={busy || !email.trim()} onClick={onSend}>
                {busy ? "Sending…" : "Send OTP"}
              </button>

              <div className="vwHint">We’ll send a verification code to your email</div>

              {msg ? <div className="vwMsg">{msg}</div> : null}
            </>
          )}
        </div>

        <div className="vwTerms">
          By continuing, you agree to our <span className="vwTermLink">Terms of Service</span> and{" "}
          <span className="vwTermLink">Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
