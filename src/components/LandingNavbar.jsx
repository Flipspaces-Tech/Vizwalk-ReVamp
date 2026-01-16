import React, { useEffect, useState, useRef } from "react";
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

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="lv-header">
      <div className="lv-container">
        <nav className="lv-nav">
          {/* Logo */}
          <a href="/" className="lv-logo" onClick={(e) => e.preventDefault()}>
            <div className="lv-mark"><span>V</span></div>
            <div className="lv-brandText">
              <div className="lv-brandName">Vizwalk</div>
              <div className="lv-brandSub">Powered by Flipspaces</div>
            </div>
          </a>

          {/* Desktop links */}
          <div className="lv-links">
            <a className="lv-link" href="#featured-projects"
               onClick={(e) => { e.preventDefault(); scrollTo("featured-projects"); }}>
              Features
            </a>
            <a className="lv-link" href="#featured-projects"
               onClick={(e) => { e.preventDefault(); scrollTo("featured-projects"); }}>
              Demo Videos
            </a>

            {/* Projects dropdown */}
            <div className="lv-dd" ref={ddRef}>
              <button type="button" className="lv-link lv-ddBtn" onClick={() => setDd(v => !v)}>
                Projects{" "}
                <span style={{ marginLeft: 6, display: "inline-block", transform: dd ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  ▾
                </span>
              </button>

              {dd && (
                <div className="lv-ddMenu">
                  <button type="button" className="lv-ddItem"
                          onClick={() => { setDd(false); scrollTo("featured-projects"); }}>
                    Showcase Projects
                  </button>
                  <a className="lv-ddItem" href="/live-projects"
                     onClick={(e) => { e.preventDefault(); setDd(false); }}>
                    Live Projects
                  </a>
                </div>
              )}
            </div>

            <a className="lv-link" href="#clients"
               onClick={(e) => { e.preventDefault(); scrollTo("clients"); }}>
              Testimonials
            </a>
          </div>

          {/* Right actions */}
          <div className="lv-actions">
            <button type="button" className="lv-iconBtn" title="Settings">⚙</button>
            <div className="lv-userPill" title={user?.email || ""}>
              {user?.email || "user"}
            </div>
            <button type="button" className="lv-logout" onClick={signOut}>
              Logout
            </button>
          </div>

          {/* Mobile */}
          <button className="lv-mobileBtn" type="button" onClick={() => setOpen(v => !v)}>
            {open ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="lv-mobileMenu">
            <a href="#featured-projects" onClick={(e) => { e.preventDefault(); setOpen(false); scrollTo("featured-projects"); }}>Features</a>
            <a href="#featured-projects" onClick={(e) => { e.preventDefault(); setOpen(false); scrollTo("featured-projects"); }}>Demo Videos</a>
            <button type="button" onClick={() => { setOpen(false); scrollTo("featured-projects"); }}>Showcase Projects</button>
            <a href="/live-projects" onClick={(e) => { e.preventDefault(); setOpen(false); }}>Live Projects</a>
            <a href="#clients" onClick={(e) => { e.preventDefault(); setOpen(false); scrollTo("clients"); }}>Testimonials</a>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button type="button" onClick={() => { setOpen(false); signOut(); }}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
