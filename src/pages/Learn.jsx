import React, { useEffect, useMemo, useState } from "react";
import LandingNavbar from "../components/LandingNavbar.jsx";
import "./Learn.css";

export default function Learn({ user, signOut }) {
  const [activeSection, setActiveSection] = useState("navigation");

  const sections = useMemo(
    () => [
      { id: "navigation", label: "Navigation Controls" },
      { id: "mouse", label: "Mouse Controls" },
      { id: "quick", label: "Quick Actions" },
      { id: "advanced", label: "Advanced Controls" },
      { id: "tips", label: "Pro Tips" },
    ],
    []
  );

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 220;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= y) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDownloadPDF = () => window.print();

  return (
    <div className="learnRoot">
      <LandingNavbar user={user} signOut={signOut} />

      {/* Sticky TOC (desktop) */}
      <aside className="learnToc">
        <div className="learnTocCard">
          <div className="learnTocTitle">Contents</div>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`learnTocBtn ${activeSection === s.id ? "active" : ""}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="learnMain">
        {/* HERO */}
        <section className="learnHero">
          <div className="learnContainer">
            <div className="learnHeroInner">
              <div>
                <h1 className="learnH1">
                  <span className="learnH1Brand">VIZWALK</span>{" "}
                  <span className="learnH1Accent">KeyBind Guide</span>
                </h1>
                <p className="learnSub">
                  Master Vizwalk with these keyboard shortcuts and controls for faster,
                  more efficient design workflows.
                </p>
              </div>

              <div className="learnHeroBtns">
                <button className="btnOutline" onClick={handleDownloadPDF} type="button">
                  Download PDF
                </button>
                <a
                  className="btnPrimary"
                  href="https://youtu.be/mszU9D8S1NE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Video Tutorial
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 1) NAVIGATION */}
        <section id="navigation" className="learnSection">
          <div className="learnContainer">
            <div className="secHead">
              <span className="secIcon">⌨</span>
              <h2>NAVIGATION &amp; CAMERA CONTROLS</h2>
            </div>

            <div className="card card--white">
              <div className="navCols">
                {/* left */}
                <div className="navCol center">
                  <div className="miniLabel">MOVE FORWARD</div>
                  <button type="button" className="keyCap big">W</button>

                  <div className="navLabels">
                    <span>MOVE LEFT</span>
                    <span>BACKWARDS</span>
                    <span>MOVE RIGHT</span>
                  </div>

                  <div className="navRowKeys">
                    <button type="button" className="keyCap">A</button>
                    <button type="button" className="keyCap">S</button>
                    <button type="button" className="keyCap">D</button>
                  </div>
                </div>

                {/* mid */}
                <div className="navCol center">
                  <div className="muted">Or use the arrow keys</div>
                  <div className="arrowStack">
                    <button type="button" className="keyCap sm">↑</button>
                    <div className="navRowKeys">
                      <button type="button" className="keyCap sm">←</button>
                      <button type="button" className="keyCap sm">↓</button>
                      <button type="button" className="keyCap sm">→</button>
                    </div>
                  </div>
                </div>

                {/* right */}
                <div className="navCol right">
                  <div className="navTable">
                    {[
                      ["Move Forward", "W", "↑"],
                      ["Move Backward", "S", "↓"],
                      ["Move Left", "A", "←"],
                      ["Move Right", "D", "→"],
                    ].map(([label, k1, k2], idx) => (
                      <div key={label} className={`navTr ${idx === 3 ? "last" : ""}`}>
                        <div className="navAction">{label}</div>
                        <div className="navKeys">
                          <span className="keyPill">{k1}</span>
                          <span className="or">or</span>
                          <span className="keyPill">{k2}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2) MOUSE */}
        <section id="mouse" className="learnSection band">
          <div className="learnContainer">
            <div className="secHead">
              <span className="secIcon">🖱</span>
              <h2>MOUSE CONTROLS</h2>
            </div>

            <div className="grid3">
              {[
                ["🖥", "Look Around", "Move mouse or Trackpad to turn your camera"],
                ["🖱", "Click to Select", "Left-click the mouse or trackpad to select the surface to change"],
                ["⚙", "Right-Click Context Menu", "Right-click any surface for options related to the particular surface"],
              ].map(([ic, title, desc]) => (
                <div key={title} className="card card--white centerCard">
                  <div className="iconCircle">{ic}</div>
                  <div className="cardTitle">{title}</div>
                  <div className="cardDesc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3) QUICK */}
        <section id="quick" className="learnSection">
          <div className="learnContainer">
            <div className="secHead plain">
              <h2>QUICK ACTIONS</h2>
            </div>

            <div className="grid4">
              {[
                ["Quick Navigate", "N", "Teleport between spaces.\nClick N again to escape"],
                ["Screenshot", "Z", "Save the current view to the\nsystem"],
                ["Exit / Menu", "1", "Exit any UI element on screen"],
                ["Switch to Top Cam", "T", "Toggle between bird’s-eye\nview and first-person view"],
              ].map(([title, key, desc]) => (
                <div key={title} className="card card--white quickCard">
                  <div className="quickTop">
                    <div className="quickTitle">{title}</div>
                    <span className="keyPill big">{key}</span>
                  </div>
                  <div className="quickDesc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4) ADVANCED */}
        <section id="advanced" className="learnSection band">
          <div className="learnContainer">
            <div className="secHead">
              <span className="secIcon">⚙</span>
              <h2>ADVANCED CONTROLS</h2>
            </div>

            <div className="tableCard">
              <div className="tableHead">
                <div>Action</div>
                <div>Keys</div>
                <div>Description</div>
              </div>

              {[
                ["Adjust Cam Speed", ["PgUp", "PgDn"], "Increase or decrease camera movement speed"],
                ["Copy Material", ["Ctrl", "C"], "Copy a material from the selected surface"],
                ["Paste Material", ["Ctrl", "V"], "Paste copied material to another surface"],
                ["Material Menu", ["M"], "Change the Tile Size and Rotation of the finish"],
              ].map(([action, keys, desc], idx) => (
                <div key={action} className={`tableRow ${idx % 2 ? "alt" : ""}`}>
                  <div className="td action">{action}</div>
                  <div className="td keys">
                    {keys.map((k) => (
                      <span key={k} className="keyPill small">{k}</span>
                    ))}
                  </div>
                  <div className="td desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5) TIPS */}
        <section id="tips" className="learnSection band">
          <div className="learnContainer">
            <div className="secHead">
              <span className="secIcon">💡</span>
              <h2>PRO TIPS</h2>
            </div>

            <div className="card card--white tipsCard">
              {[
                "Use the quick navigation (N) to instantly move between pre-defined viewpoints",
                "Adjust camera speed with PgUp/PgDn for more precise movements in detailed areas",
                "Take screenshots (Z) to save your progress and share with clients",
                "Use the material menu (M) to fine-tune tile sizes and rotations for perfect alignment",
                "Switch to top camera (T) for better spatial awareness when planning layouts",
              ].map((t, i) => (
                <div key={t} className="tipRow">
                  <span className="tipNum">{i + 1}</span>
                  <span className="tipText">{t}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 60 }} />
          </div>
        </section>
      </main>
    </div>
  );
}
