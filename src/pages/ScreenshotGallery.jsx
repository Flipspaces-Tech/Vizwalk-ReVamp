// src/pages/ScreenshotGallery.jsx
import React, { useEffect, useState, useRef } from "react";
import vizIcon from "../assets/vizdom.png"; // same icon as Landing
// at the top with other imports
import placeholderImg from "../assets/Flipspace - Logo - Black.png";

const GDRIVE_API_URL =
  "https://script.google.com/macros/s/AKfycbxcVqr7exlAGvAVSh672rB_oG7FdL0W0ymkRb_6L7A8awu7gqYDInR_6FLczLNkpr0B/exec";

/** 🔔 REFRESH JSON FILE (vizwalk_refresh_signal.json) */
const REFRESH_FILE_ID = "1OO9uURamV5Syr29aeZ0u_FopPs-QduqN";

/** ====== CONFIG: SAME SHEET AS LANDING ====== */
const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const GID = "0";

function getQuery(key, def = "") {
  const u = new URL(window.location.href);
  return u.searchParams.get(key) || def;
}

/** ====== CSV PARSER (same robust version as Landing) ====== */
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [],
    field = "",
    inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field.trim());
        field = "";
      } else if (c === "\n") {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = "";
      } else if (c !== "\r") field += c;
    }
  }
  if (field.length > 0 || inQuotes || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

/** ====== UTILS (same as Landing) ====== */
const norm = (s = "") =>
  s.toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();

const headerMap = (headers) => {
  const m = {};
  headers.forEach((h, i) => (m[norm(h)] = i));
  return m;
};

const safeGet = (row, idx, fallback = "") =>
  idx != null && idx < row.length && row[idx] != null
    ? String(row[idx]).trim()
    : fallback;

/** FLEXIBLE HEADER ALIASES (copied from Landing) */
const COLS = {
  status: ["status"],
  buildName: ["build name"],
  buildVersion: ["build version"],
  uploadId: ["upload id"],
  projectName: ["project slot name"],
  projectSlot: ["project slot name", "project slot"],
  projectSlotId: ["project slot id"],
  sbu: ["sbu"],
  areaSqft: ["area(sqft)", "area sqft", "area"],
  industry: ["industry"],
  designStyle: ["design style", "style"],
  vizdomId: ["vizdom project id", "vizdom id"],
  image: ["Thumbnail_URL", "image_url", "image url", "thumbnail", "image", "thumb"],
  youtube: ["walkthrough link", "youtube link", "youtube"],
};

const idxOf = (headers, keys) => {
  const map = headerMap(headers);
  for (const k of keys) {
    const i = map[norm(k)];
    if (i != null) return i;
  }
  return null;
};

/** IMAGE (Google Drive fallback) – same behaviour as Landing */
function ImageWithFallback({ src, alt, style }) {
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
          `https://lh3.googleusercontent.com/d/${id}=w1200-h800-no`,
          `https://drive.google.com/uc?export=view&id=${id}`,
          `https://drive.google.com/uc?export=download&id=${id}`,
          `https://drive.googleusercontent.com/uc?export=download&id=${id}`,
          `https://drive.google.com/thumbnail?id=${id}&sz=w1200-h800`,
          src,
        ]
      : [src || ""];

  const [idx, setIdx] = React.useState(0);
  const onError = () =>
    setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

  // 👉 FINAL FALLBACK: no external URL, no CORS, no errors
  if (!src || idx === -1) {
    // If you imported a local PNG, use that:
    if (typeof placeholderImg !== "undefined") {
      return (
        <img
          src={placeholderImg}
          alt={alt || "preview"}
          style={style}
          loading="lazy"
        />
      );
    }

    // Or just a neutral grey box:
    return (
      <div
        style={{
          ...style,
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        No preview
      </div>
    );
  }

  const bust = Date.now();
  const current = candidates[idx]
    ? `${candidates[idx]}${
        candidates[idx].includes("?") ? "&" : "?"
      }cb=${bust}`
    : "";

  return (
    <img
      src={current}
      alt={alt || "preview"}
      style={style}
      loading="lazy"
      onError={onError}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}


/** SAME sqft formatter as Landing (Area - 8,000 sqft) */
function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

/** ===== PRETTY DATE FOR GROUP LABELS ===== */
function prettyDate(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return "Date";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];

  return `Date: ${dd}/${mm} ${wk} ${hh}:${mn}`;
}

const TABS = [
  { key: "screenshots", label: "Screenshots" },
  { key: "saves", label: "Saves" },
  { key: "recordings", label: "Recordings" },
];

export default function ScreenshotGallery() {
  const [activeTab, setActiveTab] = useState("screenshots");
  const [loadingHeader, setLoadingHeader] = useState(true);
  const [headerItem, setHeaderItem] = useState(null);
  const [ytHover, setYtHover] = useState(false);
  const [vizHover, setVizHover] = useState(false);
  const [heroHover, setHeroHover] = useState(false);
  const rowRefs = useRef({});
  const [screenshotsGroups, setScreenshotsGroups] = useState([]);
  const [loadingShots, setLoadingShots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const buildQuery = getQuery("build", "Build");
  const thumbQuery = getQuery("thumb", "");   // <--- NEW
  const verQuery = getQuery("ver", "");   // 👈 new





    // 👉 ADD THIS BLOCK HERE 👇
  const buildName = headerItem?.buildName || buildQuery;
  const version   = headerItem?.buildVersion || verQuery || "";

  // Build key used for screenshots + Drive folder name
  const buildBase = (buildName || "").trim();
  const buildKey  = version ? `${buildBase} ${version}` : buildBase;

  /** ====== LOAD HEADER DATA EXACTLY LIKE LANDING ====== */
  useEffect(() => {
    (async () => {
      setLoadingHeader(true);
      try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&id=${SHEET_ID}&gid=${GID}`;
        const res = await fetch(url, { cache: "no-store" });
        const csv = await res.text();

        const rows = parseCSV(csv);
        const headers = rows[0];
        const body = rows
          .slice(1)
          .filter((r) => r.some((c) => String(c || "").trim() !== ""));

        const iStatus = idxOf(headers, COLS.status);
        const iSBU = idxOf(headers, COLS.sbu);
        const iProjectName = idxOf(headers, COLS.projectName);
        const iBuildName = idxOf(headers, COLS.buildName);
        const iBuildVersion = idxOf(headers, COLS.buildVersion);
        const iAreaSqft = idxOf(headers, COLS.areaSqft);
        const iIndustry = idxOf(headers, COLS.industry);
        const iDesignStyle = idxOf(headers, COLS.designStyle);
        const iImage = idxOf(headers, COLS.image);
        const iYouTube = idxOf(headers, COLS.youtube);
        const iVizdomId = idxOf(headers, COLS.vizdomId);

        const items = body
          .map((r) => {
            const status = norm(safeGet(r, iStatus, "Active"));
            if (status !== "active") return null;
            return {
              sbu: safeGet(r, iSBU),
              projectName: safeGet(r, iProjectName),
              buildName: safeGet(r, iBuildName),
              buildVersion: safeGet(r, iBuildVersion),
              areaSqft: safeGet(r, iAreaSqft),
              industry: safeGet(r, iIndustry),
              designStyle: safeGet(r, iDesignStyle),
              thumb: safeGet(r, iImage),
              youtube: safeGet(r, iYouTube),
              vizdomId: safeGet(r, iVizdomId),
            };
          })
          .filter(Boolean);

        const qBuild = norm(buildQuery);
const qVer   = norm(verQuery);

let match;

if (qVer) {
  // Prefer exact Build + Version match
  match =
    items.find(
      (x) =>
        (norm(x.buildName) === qBuild || norm(x.projectName) === qBuild) &&
        norm(x.buildVersion || "") === qVer
    ) ||
    // Fallbacks if version not found
    items.find((x) => norm(x.buildName) === qBuild) ||
    items.find((x) => norm(x.projectName) === qBuild) ||
    items[0];
} else {
  // Old behaviour when no ?ver= in URL
  match =
    items.find((x) => norm(x.buildName) === qBuild) ||
    items.find((x) => norm(x.projectName) === qBuild) ||
    items[0];
}

setHeaderItem(match || null);

      } catch (err) {
        console.error(err);
        setHeaderItem(null);
      } finally {
        setLoadingHeader(false);
      }
    })();
  }, [buildQuery, verQuery]);


  const effectiveBuild = (headerItem?.buildName || buildQuery || "").trim();
  // const buildKey = effectiveBuild
  //   ? effectiveBuild.replace(/[^\w\-]+/g, "_").trim()
  //   : "";

  /** ====== LOAD SCREENSHOTS FOR THIS BUILD FROM APPS SCRIPT ====== */
useEffect(() => {
  if (!buildKey) return;
  (async () => {
    try {
      setLoadingShots(true);
      const url = new URL(GDRIVE_API_URL);
      url.searchParams.set("action", "listscreenshots");
      url.searchParams.set("build", buildKey);   // 👈 use buildKey
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) {
        setScreenshotsGroups(json.groups || []);
      } else {
        console.warn("listscreenshots error", json);
        setScreenshotsGroups([]);
      }
    } catch (err) {
      console.error("listscreenshots fetch error", err);
      setScreenshotsGroups([]);
    } finally {
      setLoadingShots(false);
    }
  })();
}, [buildKey, refreshKey]);






// Auto-refresh screenshots every 10 seconds
useEffect(() => {
  const interval = setInterval(() => {
    setRefreshKey((k) => k + 1);  // triggers listscreenshots again
  }, 20000); // 10,000 ms = 10 seconds

  return () => clearInterval(interval); // cleanup on unmount
}, []);


  /** 🔁 AUTO-REFRESH POLL */
  // useEffect(() => {
  //   if (!REFRESH_FILE_ID || !buildKey) return;

  //   const refreshUrl = `https://drive.google.com/uc?export=download&id=${REFRESH_FILE_ID}`;
  //   let lastTs = 0;

  //   const timer = setInterval(async () => {
  //     try {
  //       const res = await fetch(refreshUrl + "&cb=" + Date.now());
  //       const text = await res.text();
  //       if (!text) return;

  //       let json;
  //       try {
  //         json = JSON.parse(text);
  //       } catch {
  //         return;
  //       }

  //       console.log("refresh JSON:", json, "buildKey:", buildKey);

  //       if (json.build !== buildKey) return;

  //       const tsNum = Number(json.ts || 0);
  //       if (!Number.isFinite(tsNum)) return;

  //       if (tsNum > lastTs) {
  //         console.log("🔁 New screenshot detected for", buildKey, "ts:", tsNum);
  //         lastTs = tsNum;
  //         setRefreshKey((k) => k + 1);
  //       }
  //     } catch (e) {
  //       console.warn("refresh poll error", e);
  //     }
  //   }, 3000);

  //   return () => clearInterval(timer);
  // }, [buildKey]);

  /** ====== TAB DATA ====== */
  const dataForTab = activeTab === "screenshots" ? screenshotsGroups : [];

  /** ====== CLICK HANDLERS ====== */

  // Open image in new tab (view)
  const openImage = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Download: use Drive "export=download" link so browser opens Save dialog
  // Download: trigger Drive "export=download" in a hidden iframe
const dl = (url) => {
  if (!url) return;

  // If it's a Drive "export=view" URL, switch to "export=download"
  let downloadUrl = url.replace("export=view", "export=download");

  // Create a hidden iframe that points to the download URL
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = downloadUrl;

  document.body.appendChild(iframe);

  // Clean up after some time
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 60000);
};


  const openVizwalk = () => {
    if (!headerItem) return;

    const bust = Date.now();
    const projectLabel =
      headerItem.projectName || headerItem.buildName || "project";

    const sessionId = `${projectLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}`;

    let href;

    if (headerItem.url && /^https?:\/\//i.test(headerItem.url)) {
      const u = new URL(headerItem.url);
      u.searchParams.set("session", sessionId);
      u.searchParams.set(
        "build",
        headerItem.buildName || headerItem.projectName || "Build"
      );
      href = u.toString();
    } else {
      const id = projectLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const params = new URLSearchParams({
        project: id,
        s: bust,
        session: sessionId,
        build: headerItem.buildName || headerItem.projectName || "Build",
        ver: headerItem.buildVersion || "",        // 👈 add version here too
      });

      href = `/experience?${params.toString()}`;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };


  const projectSlot =
    headerItem?.projectName || headerItem?.projectSlot || "Project Slot Name";

  const areaDisplay = headerItem?.areaSqft
    ? formatSqft(headerItem.areaSqft)
    : "";
  const constructionType = headerItem?.industry || "";

  const heroImg = thumbQuery || headerItem?.thumb || "";


  const vizdomHref = headerItem?.vizdomId
    ? `https://vizdom.flipspaces.app/user/project/${encodeURIComponent(
        headerItem.vizdomId
      )}#Project#Summary`
    : null;

  /** ====== RENDER ====== */
  return (
    <div style={styles.page}>
      {/* HEADER CARD */}
      <div style={styles.headerCard}>
        <div style={styles.headerInner}>
          {/* TEXT COLUMN */}
          <div style={styles.headerTextCol}>
            {loadingHeader ? (
              <div>Loading…</div>
            ) : (
              <>
                <div style={styles.buildName}>
                  {buildName}
                  <span style={styles.version}>{version}</span>
                </div>

                <div style={styles.projectSlot}>{projectSlot}</div>

                <div style={styles.headerMeta}>
                  {areaDisplay && (
                    <div>
                      <strong>Area</strong> - {areaDisplay}
                    </div>
                  )}
                  {constructionType && (
                    <div>
                      <strong>Construction Type</strong> - {constructionType}
                    </div>
                  )}
                </div>

                <div style={styles.headerIconsRow}>
                  {/* YT */}
                  {headerItem?.youtube && (
                    <button
                      style={styles.headerIconBtnClear}
                      onMouseEnter={() => setYtHover(true)}
                      onMouseLeave={() => setYtHover(false)}
                      title="Watch walkthrough"
                      onClick={() =>
                        window.open(
                          headerItem.youtube,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        style={{
                          ...styles.headerYtSvg,
                          ...(ytHover ? styles.headerYtSvgHover : {}),
                          ...(ytHover ? styles.headerYtGlowHover : {}),
                        }}
                      >
                        <rect
                          x="2.8"
                          y="6.2"
                          width="18.4"
                          height="11.6"
                          rx="3.2"
                          fill={ytHover ? "#FF0000" : "#0D0D0D"}
                        />
                        <path d="M10 9v6l5-3-5-3z" fill="#FFF" />
                      </svg>
                    </button>
                  )}

                  {/* VIZDOM BADGE */}
                  {vizdomHref && (
                    <button
                      style={styles.vizdomCircle}
                      onMouseEnter={() => setVizHover(true)}
                      onMouseLeave={() => setVizHover(false)}
                      title="Open in Vizdom"
                      onClick={() =>
                        window.open(
                          vizdomHref,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <span
                        style={{
                          ...styles.vizGlow,
                          ...(vizHover ? styles.vizGlowOn : {}),
                        }}
                      />
                      <span
                        style={{
                          ...styles.vizMask,
                          ...(vizHover ? styles.vizMaskHover : {}),
                        }}
                      />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* HERO IMAGE */}
          <div style={styles.headerHeroWrap}>
            <div
              style={styles.headerHeroImgWrap}
              onMouseEnter={() => setHeroHover(true)}
              onMouseLeave={() => setHeroHover(false)}
            >
              <div
                style={{
                  ...styles.heroWrap,
                  ...(heroHover ? styles.heroWrapBlur : {}),
                }}
              >
                <ImageWithFallback src={heroImg} style={styles.headerHeroImg} />
              </div>

              <button
                style={{
                  ...styles.openVizwalkBtn,
                  ...(heroHover ? styles.openVizwalkBtnVisible : {}),
                }}
                onClick={openVizwalk}
              >
                Open Vizwalk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS + REFRESH */}
      <div style={styles.tabsRow}>
        <div style={styles.tabsLeft}>
          {TABS.map((t) => (
            <button
              key={t.key}
              style={{
                ...styles.tabBtn,
                ...(activeTab === t.key ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "screenshots" && (
          <button
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loadingShots}
          >
            {loadingShots ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </div>
      <div style={styles.tabsUnderline} />

      {/* GALLERY GRID */}
      <div style={{ marginTop: 24 }}>
        {activeTab === "screenshots" && loadingShots && (
          <div style={{ marginTop: 16, fontSize: 14, color: "#6b7280" }}>
            Loading screenshots…
          </div>
        )}

        {dataForTab.map((group, idx) => {
          const key = group.group || idx;
          return (
            <div key={key} style={styles.groupBlock}>
              <div style={styles.groupHeaderRow}>
                <div style={styles.dateLabel}>
                  {prettyDate(group.ts || group.group)}
                </div>

                <button
                  style={styles.groupDownloadAll}
                  onClick={() => group.items.forEach((img) => dl(img.url))}
                >
                  Download All
                </button>
              </div>

              <div style={styles.rowWrap}>
                <div
                  ref={(el) => (rowRefs.current[key] = el)}
                  style={styles.rowScroller}
                >
                  {group.items.map((img, i) => (
                    <div
                      key={img.url + i}
                      style={styles.shotCard}
                      onClick={() => openImage(img.url)}
                    >
                      <ImageWithFallback src={img.url} style={styles.shotImg} />

                      <button
                        style={styles.downloadIcon}
                        onClick={(e) => {
                          e.stopPropagation(); // don't trigger openImage
                          dl(img.url);
                        }}
                        title="Download"
                      >
                        ⤓
                      </button>
                    </div>
                  ))}
                </div>

                {group.items.length > 3 && (
                  <button
                    style={styles.rowArrow}
                    onClick={() =>
                      rowRefs.current[key]?.scrollBy({
                        left: 300,
                        behavior: "smooth",
                      })
                    }
                  >
                    ❯
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ============================================================
 * STYLES
 * ========================================================== */
const styles = {
  page: {
    minHeight: "100vh",
    maxHeight: "100vh",
    overflowY: "auto",
    background: "#e9eefc",
    padding: 24,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },

  headerCard: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  headerInner: {
    width: "min(900px, 100%)",
    display: "flex",
    gap: 20,
    background: "#fff",
    padding: 14,
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(110,129,255,0.18)",
  },
  headerTextCol: { flex: 1, display: "flex", flexDirection: "column" },

  buildName: { fontSize: 24, fontWeight: 800 },
  version: { marginLeft: 6, fontSize: 18, color: "#9aa4b2", fontWeight: 700 },
  projectSlot: { marginTop: 4, fontSize: 15, color: "#3b82f6", fontWeight: 700 },
  headerMeta: { marginTop: 8, fontSize: 14, color: "#444" },

  headerIconsRow: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  headerIconBtnClear: {
    width: 40,
    height: 40,
    border: "none",
    background: "transparent",
    position: "relative",
    cursor: "pointer",
  },
  headerYtSvg: {
    width: 38,
    height: 26,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(1.25)",
    transition: "140ms",
  },
  headerYtSvgHover: {
    transform: "translate(-50%, -50%) scale(1.25)",
  },
  

  vizdomCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "transparent",
    position: "relative",
    cursor: "pointer",
  },
  vizMask: {
    width: 34,
    height: 34,
    backgroundColor: "#0D0D0D",
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(.9)",
    WebkitMaskImage: `url(${vizIcon})`,
    maskImage: `url(${vizIcon})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    transition: "140ms",
  },
  vizMaskHover: {
    backgroundColor: "#06B6D4",
  },
  vizGlow: {
    width: 56,
    height: 56,
    borderRadius: 20,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0,
    filter:
      "blur(6px) drop-shadow(0 6px 16px rgba(6,182,212,0.25)) drop-shadow(0 0 14px rgba(6,182,212,0.25))",
    transition: "200ms",
  },
  vizGlowOn: { opacity: 1 },

  headerHeroWrap: {
    width: 320,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  headerHeroImgWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
  },
  headerHeroImg: {
    width: 320,
    height: 170,
    objectFit: "cover",
  },
  heroWrap: { transition: "200ms" },
  heroWrapBlur: {
    filter: "blur(4px) brightness(.9)",
    transform: "scale(1.02)",
  },
  openVizwalkBtn: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.8)",
    background: "rgba(255,255,255,0.9)",
    fontWeight: 700,
    fontSize: 15,
    opacity: 0,
    pointerEvents: "none",
    transition: "200ms",
  },
  openVizwalkBtnVisible: {
    opacity: 1,
    pointerEvents: "auto",
  },

  tabsRow: {
    display: "flex",
    alignItems: "center",
  },
  tabsLeft: { display: "flex", gap: 4 },
  tabBtn: {
    background: "transparent",
    border: "none",
    padding: "10px 18px",
    fontSize: 15,
    cursor: "pointer",
    borderRadius: "12px 12px 0 0",
    color: "#555",
  },
  tabBtnActive: {
    background: "#fff",
    boxShadow: "0 -1px 0 #fff, 0 0 0 1px #d4d9ff",
    color: "#111",
  },
  tabsUnderline: {
    borderBottom: "2px solid #d4d9ff",
    marginTop: -1,
  },

  groupBlock: { marginBottom: 32 },
  groupHeaderRow: {
    display: "flex",
    alignItems: "center",
    paddingInline: 4,
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "#374151",
  },
  groupDownloadAll: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#16a34a",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },

  rowWrap: { position: "relative" },
  rowScroller: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    paddingBottom: 6,
    paddingRight: 40,
  },
  rowArrow: {
    position: "absolute",
    top: "50%",
    right: 4,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
    fontSize: 20,
    cursor: "pointer",
  },

  shotCard: {
    minWidth: 260,
    maxWidth: 260,
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
    cursor: "pointer",
    transition: "200ms",
  },
  shotImg: {
    width: "100%",
    height: 170,
    objectFit: "cover",
  },
  downloadIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.96)",
    border: "none",
    fontSize: 18,
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    cursor: "pointer",
  },
};
