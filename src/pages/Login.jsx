import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import "./login.css";

import loginBg from "../assets/bg.png";
import vizwalkLogo from "../assets/L1.png";

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

  // ✅ 4 digit OTP like Image1
  const OTP_LEN = 6;
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LEN).fill(""));
  const otpRefs = useRef([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [verifiedUI, setVerifiedUI] = useState(false); // ✅ Image3 state

  const nav = useNavigate();
  const loc = useLocation();

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


  const next = useMemo(() => {
    const qpNext = new URLSearchParams(loc.search).get("next");
    const stateNext = loc.state?.from
      ? loc.state.from.pathname + (loc.state.from.search || "")
      : null;

    return sanitizeNext(qpNext || stateNext || "/");
  }, [loc.search, loc.state]);

  useEffect(() => {
    if (session) nav(next, { replace: true });
  }, [session, nav, next]);

  const onSend = async () => {
    const e = email.trim();
    if (!e) return;

    setBusy(true);
    setMsg("");

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

    // ✅ show Image3 “Verified!” state briefly
    setVerifiedUI(true);
    // session effect will redirect; this is just for UI feedback
  };

  const handleOtpChange = (idx, val) => {
    // allow only digits, single char
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

  return (
    <div className="vwLogin" style={{ "--vwLoginBg": `url(${loginBg})` }}>
      <div className="vwLoginOverlay" />

      <div className="vwLoginCenter">
        <div className="vwLoginCard vwLoginCard--compact">
          <div className="vwBrand">
            <img className="vwBrandLogo vwBrandLogo--small" src={vizwalkLogo} alt="vizwalk" />
            <div className="vwBrandSub">Powered by FLIPSPACES</div>
          </div>

          {/* ✅ VERIFIED UI (Image3) */}
          {verifiedUI ? (
  <div className="vwVerifiedCard">
    <div className="vwVerifiedIconWrap">
      <svg
        className="vwVerifiedIcon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 12a8 8 0 1 1-16 0a8 8 0 0 1 16 0Z"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2"
        />
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
                    onPaste={handleOtpPaste}         // ✅ paste support
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
                    setVerifiedUI(false);
                    setMsg("");
                  }}
                >
                  Change email
                </button>
              </div>

              {msg ? <div className="vwMsg">{msg}</div> : null}

              <div className="vwTerms vwTerms--inside">
                By continuing, you agree to our <span className="vwTermLink">Terms of Service</span> and{" "}
                <span className="vwTermLink">Privacy Policy</span>
              </div>
            </>
          ) : (
            <>
              {/* keep your EMAIL UI here unchanged */}
              <div className="vwCardTitle">Sign in with your Flipspaces ID</div>

              <input
                className="vwInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example.abc@flipspaces.com"
                autoComplete="email"
              />

              <label className="vwRemember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span className="vwRememberText">Remember Me</span>
              </label>

              <button className="vwCta vwCta--compact" disabled={busy || !email.trim()} onClick={onSend}>
                {busy ? "Sending…" : "Send OTP"}
              </button>

              <div className="vwHint">We’ll send a verification code to your email</div>

              {msg ? <div className="vwMsg">{msg}</div> : null}

              <div className="vwTerms vwTerms--inside">
                By continuing, you agree to our <span className="vwTermLink">Terms of Service</span> and{" "}
                <span className="vwTermLink">Privacy Policy</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
