import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";

function sanitizeNext(nextRaw) {
  // ✅ allow only internal paths
  if (!nextRaw) return "/";
  if (nextRaw.startsWith("http://") || nextRaw.startsWith("https://")) return "/";
  if (!nextRaw.startsWith("/")) return "/";
  return nextRaw;
}

export default function Login() {
  const { sendOtp, verifyOtp, session } = useAuth();

  const [step, setStep] = useState("email"); // email | otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const nav = useNavigate();
  const loc = useLocation();

  const next = useMemo(() => {
    const qpNext = new URLSearchParams(loc.search).get("next");
    const stateNext = loc.state?.from
      ? loc.state.from.pathname + (loc.state.from.search || "")
      : null;

    return sanitizeNext(qpNext || stateNext || "/");
  }, [loc.search, loc.state]);

  // ✅ if already logged in, go to next
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
      setMsg("OTP sent. Please check your email.");
    } else {
      // ✅ stay on email step if not allowed / failed
      setStep("email");
      setMsg(res.error || "Could not send OTP.");
    }
  };

  const onVerify = async () => {
    const e = email.trim();
    const t = otp.trim();
    if (!e || !t) return;

    setBusy(true);
    setMsg("");

    const res = await verifyOtp(e, t);

    setBusy(false);

    if (!res.ok) {
      setMsg(res.error || "Invalid OTP");
      return;
    }

    // ✅ session effect will redirect
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9eefc", padding: 24 }}>
      <div style={{ width: 420, background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 14px 40px rgba(110,129,255,0.22)" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#1d2433" }}>Vizwalk Login</div>

        <div style={{ marginTop: 6, color: "#657087", fontWeight: 700 }}>
          Enter your email to receive OTP
        </div>

        {step === "email" ? (
          <>
            <div style={{ marginTop: 14, fontWeight: 800 }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@flipspaces.com"
              style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid #e5eaf6" }}
            />

            <button
              disabled={busy || !email.trim()}
              onClick={onSend}
              style={{
                marginTop: 14,
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                fontWeight: 900,
                background: "#3b82f6",
                color: "#fff",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.8 : 1,
              }}
            >
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginTop: 14, fontWeight: 800 }}>OTP</div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid #e5eaf6" }}
            />

            <button
              disabled={busy || !otp.trim()}
              onClick={onVerify}
              style={{
                marginTop: 14,
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                fontWeight: 900,
                background: "#111827",
                color: "#fff",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.85 : 1,
              }}
            >
              {busy ? "Verifying…" : "Verify OTP"}
            </button>

            <button
              onClick={() => {
                setStep("email");
                setOtp("");
                setMsg("");
              }}
              style={{
                marginTop: 10,
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5eaf6",
                fontWeight: 900,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Change email
            </button>

            <button
              disabled={busy}
              onClick={onSend}
              style={{
                marginTop: 10,
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5eaf6",
                fontWeight: 900,
                background: "#f8fafc",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              Resend OTP
            </button>
          </>
        )}

        {msg ? <div style={{ marginTop: 12, fontWeight: 700, color: "#334155" }}>{msg}</div> : null}
      </div>
    </div>
  );
}
