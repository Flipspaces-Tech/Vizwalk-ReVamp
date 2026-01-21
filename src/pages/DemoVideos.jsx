// src/pages/DemoVideos.jsx
import React, { useEffect, useMemo, useState } from "react";
import LandingNavbar from "../components/LandingNavbar.jsx";
import { useAuth } from "../auth/AuthProvider";
import "../styles/demo-videos.css";

const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxcVqr7exlAGvAVSh672rB_oG7FdL0W0ymkRb_6L7A8awu7gqYDInR_6FLczLNkpr0B/exec";

const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const TAB_NAME = "Demo Videos Data For Website";

/** ===== Drive helpers ===== */
function extractDriveFileId(url = "") {
  const s = String(url || "");
  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  const m3 = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];
  return null;
}

function driveToDirectImageUrl(url = "") {
  const id = extractDriveFileId(url);
  if (!id) return String(url || "");
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

/** ===== Image fallback (Drive-friendly) ===== */
function ImageWithFallback({ src, alt, className }) {
  const isDrive = /drive\.google\.com/i.test(src || "");
  const id = isDrive ? extractDriveFileId(src) : "";

  const candidates =
    isDrive && id
      ? [
          `https://lh3.googleusercontent.com/d/${id}=w1400-h900-no`,
          `https://drive.google.com/uc?export=view&id=${id}`,
          `https://drive.google.com/thumbnail?id=${id}&sz=w1400-h900`,
          src,
        ]
      : [src || ""];

  const [idx, setIdx] = useState(0);
  const onError = () => setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

  if (!src || idx === -1) {
    return (
      <img
        className={className}
        src="https://picsum.photos/seed/vizwalk/1400/900"
        alt={alt || "preview"}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    );
  }

  const bust = Date.now();
  const current = candidates[idx]
    ? `${candidates[idx]}${candidates[idx].includes("?") ? "&" : "?"}cb=${bust}`
    : "";

  return (
    <img
      className={className}
      src={current}
      alt={alt || "preview"}
      loading="lazy"
      onError={onError}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}

export default function DemoVideos() {
  const { user, signOut } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const u = new URL(WEBAPP_URL);
        u.searchParams.set("action", "demovideos");
        u.searchParams.set("sheetId", SHEET_ID);
        u.searchParams.set("tab", TAB_NAME);

        const res = await fetch(u.toString(), { cache: "no-store" });
        const data = await res.json();

        if (!mounted) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (e) {
        console.error("DemoVideos load error:", e);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const typeOptions = useMemo(() => {
    const set = new Set(["All"]);
    rows.forEach((r) => {
      const t = String(r.constructionType || "").trim();
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const typeOk = activeType === "All" || String(r.constructionType || "") === activeType;
      if (!typeOk) return false;

      if (!q) return true;

      const hay = [
        r.videoName,
        r.projectSlot,
        r.sbu,
        r.areaSqft,
        r.constructionType,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");

      return hay.includes(q);
    });
  }, [rows, activeType, query]);

  return (
    <div className="dv-page">
      <LandingNavbar user={user} signOut={signOut} />

      <div className="dv-wrap">
        <h1 className="dv-title">Walkthrough Videos</h1>
        <p className="dv-subtitle">
          Explore our premium architectural visualizations and immersive 3D walkthroughs
        </p>

        <div className="dv-controls">
          <div className="dv-chips">
            {typeOptions.map((t) => (
              <button
                key={t}
                className={`dv-chip ${t === activeType ? "dv-chip--active" : ""}`}
                onClick={() => setActiveType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="dv-search">
            <span className="dv-searchIcon">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Projects.."
            />
          </div>
        </div>

        {loading ? (
          <div className="dv-loading">Loading demo videos…</div>
        ) : filtered.length === 0 ? (
          <div className="dv-empty">No videos found.</div>
        ) : (
          <div className="dv-grid">
            {filtered.map((r, idx) => {
              // ✅ thumb
              const thumb = driveToDirectImageUrl(r.thumbnailUrl);

              // ✅ link mapping from sheet
              const projectShowcaseUrl = r.youtubeUrl || "";      // Unlisted Youtube Video Link
              const interactiveVideoUrl = r.vizwalkDemoUrl || ""; // Unlisted Youtube Vizwalk Demo Video Link

              // ✅ area formatting
              const areaText = r.areaSqft ? String(r.areaSqft).replace(/,/g, "").trim() : "";
              const areaLine = areaText ? `Area – ${Number(areaText).toLocaleString()} sqft` : "";

              return (
                <div className="dv-cardX" key={`${r.videoName || "video"}-${idx}`}>
                  <div className="dv-mediaX">
                    <ImageWithFallback className="dv-imgX" src={thumb} alt={r.videoName} />

                    {/* ✅ hover-only overlay */}
                    {(projectShowcaseUrl || interactiveVideoUrl) && (
                    <div className="dv-hoverOverlayX">
                        <div className="dv-actionsX">
                        {projectShowcaseUrl ? (
                            <button
                            className="dv-pillBtnX"
                            onClick={() => window.open(projectShowcaseUrl, "_blank", "noopener,noreferrer")}
                            >
                            <span className="dv-pillIconX">▶</span>
                            Project Showcase
                            </button>
                        ) : null}

                        {interactiveVideoUrl ? (
                            <button
                            className="dv-pillBtnX"
                            onClick={() => window.open(interactiveVideoUrl, "_blank", "noopener,noreferrer")}
                            >
                            <span className="dv-pillIconX">▶</span>
                            Interactive Video
                            </button>
                        ) : null}
                        </div>
                    </div>
                    )}


                  </div>

                  <div className="dv-infoX">
                    <h3 className="dv-titleX">{r.videoName || "Untitled"}</h3>

                    {r.constructionType ? (
                      <div className="dv-tagX">{r.constructionType}</div>
                    ) : null}

                    {areaLine ? <div className="dv-metaX">{areaLine}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
