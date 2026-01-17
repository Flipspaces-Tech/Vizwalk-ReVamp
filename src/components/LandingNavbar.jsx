import React, { useEffect, useRef, useState } from "react";
import vizIcon from "../assets/L1.png"; // same logo as landing
import "../styles/lovable-navbar.css";

export default function LandingNavbar({ user, signOut }) {
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDd(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Works on landing page (scroll), and on other pages it redirects to landing hash.
  const goOrScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.href = `/#${id}`;
  };

  return (
    <header className="lv-header">
      <div className="lv-container">
        <nav className="lv-nav">
          <a href="/" className="lv-logo" onClick={(e) => e.preventDefault()}>
            <img className="lv-logoImg" src={vizIcon} alt="Vizwalk — Powered by Flipspaces" />
          </a>

          <div className="lv-links">
            <a
              className="lv-link"
              href="#featured-projects"
              onClick={(e) => {
                e.preventDefault();
                goOrScroll("featured-projects");
              }}
            >
              Features
            </a>

            <a
              className="lv-link"
              href="#featured-projects"
              onClick={(e) => {
                e.preventDefault();
                goOrScroll("featured-projects");
              }}
            >
              Demo Videos
            </a>

            <div className="lv-dd" ref={ddRef}>
              <button
                type="button"
                className="lv-link lv-ddBtn"
                onClick={() => setDd((v) => !v)}
              >
                Projects{" "}
                <span
                  style={{
                    marginLeft: 6,
                    display: "inline-block",
                    transform: dd ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  ▾
                </span>
              </button>

              {dd && (
                <div className="lv-ddMenu">
                  <button
                    type="button"
                    className="lv-ddItem"
                    onClick={() => {
                      setDd(false);
                      goOrScroll("featured-projects");
                    }}
                  >
                    Showcase Projects
                  </button>

                  <a
                    className="lv-ddItem"
                    href="/live-projects"
                    onClick={(e) => {
                      e.preventDefault();
                      setDd(false);
                      // keep as-is (you can route it later)
                    }}
                  >
                    Live Projects
                  </a>
                </div>
              )}
            </div>

            <a
              className="lv-link"
              href="#clients"
              onClick={(e) => {
                e.preventDefault();
                goOrScroll("clients");
              }}
            >
              Testimonials
            </a>
          </div>

          <div className="lv-actions">
            <button type="button" className="lv-iconBtn" title="Settings">
              ⚙
            </button>

            <div className="lv-userPill" title={user?.email || ""}>
              {user?.email || "user"}
            </div>

            <button type="button" className="lv-logout" onClick={signOut}>
              Logout
            </button>
          </div>

          <button className="lv-mobileBtn" type="button" onClick={() => setOpen((v) => !v)}>
            {open ? "✕" : "☰"}
          </button>
        </nav>

        {open && (
          <div className="lv-mobileMenu">
            <a
              href="#featured-projects"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                goOrScroll("featured-projects");
              }}
            >
              Features
            </a>

            <a
              href="#featured-projects"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                goOrScroll("featured-projects");
              }}
            >
              Demo Videos
            </a>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                goOrScroll("featured-projects");
              }}
            >
              Showcase Projects
            </button>

            <a
              href="/live-projects"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              Live Projects
            </a>

            <a
              href="#clients"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                goOrScroll("clients");
              }}
            >
              Testimonials
            </a>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
