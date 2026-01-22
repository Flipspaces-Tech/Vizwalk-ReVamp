// src/pages/DemoVideos.jsx
import React, { useEffect, useMemo, useState } from "react";
import LandingNavbar from "../components/LandingNavbar.jsx";
import "../styles/demo-videos.css";
import { useAuth } from "../auth/AuthProvider";

// use your youtube icon from assets
import ytIcon from "../assets/yt1.png";

const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxcVqr7exlAGvAVSh672rB_oG7FdL0W0ymkRb_6L7A8awu7gqYDInR_6FLczLNkpr0B/exec";

const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const TAB_NAME = "Demo Videos Data For Website";

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

function ImageWithFallback({ src, alt, className }) {
  const isDrive = /drive\.google\.com/i.test(src || "");
  const extractDriveId = (url = "") => {
    if (!url) return "";
    const m1 = url.match(/\/d\/([^/]+)\//);
    const m2 = url.match(/[?&]id=([^&]+)/);
    return m1?.[1] || m2?.[1] || "";
  };
  const id = isDrive ? extractDriveId(src) : "";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const { user, signOut } = useAuth();

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

      const hay = [r.videoName, r.projectSlot, r.sbu, r.areaSqft, r.constructionType]
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
              const thumb = driveToDirectImageUrl(r.thumbnailUrl);

              // ✅ THESE ARE THE REAL KEYS (from your console screenshot)
              const projectShowcaseUrl = String(r.youtubeUrl || "").trim();
              const interactiveVideoUrl = String(r.vizwalkDemoUrl || "").trim();

              return (
                <div className="dv-cardX" key={`${r.videoName || "v"}-${idx}`}>
                  <div className="dv-mediaX">
                    <ImageWithFallback src={thumb} alt={r.videoName} className="dv-imgX" />

                    {/* ✅ Yellow play ONLY on hover + only if link exists */}
                    {projectShowcaseUrl ? (
                      <button
                        type="button"
                        className="dv-centerPlay"
                        title="Project Showcase"
                        onClick={() =>
                          window.open(projectShowcaseUrl, "_blank", "noopener,noreferrer")
                        }
                      >
                        <span className="dv-centerPlayTri" />
                      </button>
                    ) : null}
                  </div>

                  <div className="dv-infoX">
                    <div className="dv-titleX">{r.videoName || "Untitled"}</div>

                    {r.constructionType ? <div className="dv-tagX">{r.constructionType}</div> : null}

                    <div className="dv-metaX">
                      {r.areaSqft ? `Area – ${String(r.areaSqft).replace(/,/g, "")} sqft` : ""}
                    </div>

                    {/* ✅ Red YouTube pill bottom-right + expands on hover (only if link exists) */}
                    {interactiveVideoUrl ? (
                      <button
                        type="button"
                        className="dv-ytPill"
                        title="Vizwalk Interactive Video"
                        onClick={() =>
                          window.open(interactiveVideoUrl, "_blank", "noopener,noreferrer")
                        }
                      >
                        <span className="dv-ytIconWrap">
                          <img className="dv-ytIcon" src={ytIcon} alt="YouTube" />
                        </span>
                        <span className="dv-ytLabel">Vizwalk Interactive Video</span>
                      </button>
                    ) : null}
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
