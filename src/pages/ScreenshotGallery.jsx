// src/pages/ScreenshotGallery.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import vizIcon from "../assets/vizdom.png";
import placeholderImg from "../assets/Flipspace - Logo - Black.png";
import LandingNavbar from "../components/LandingNavbar.jsx";
import { useAuth } from "../auth/AuthProvider";
import openIcon from "../assets/share.png"; // <-- change filename
import downloadIcon from "../assets/download.png"; // <-- use your file name





/** ====== CONFIG ====== */
const GDRIVE_API_URL =
  "https://script.google.com/macros/s/AKfycbxcVqr7exlAGvAVSh672rB_oG7FdL0W0ymkRb_6L7A8awu7gqYDInR_6FLczLNkpr0B/exec";

const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const GID = "0";

/** ====== QUERY ====== */
function getQuery(key, def = "") {
  const u = new URL(window.location.href);
  return u.searchParams.get(key) || def;
}

/** ====== CSV PARSER (robust) ====== */
function parseCSV(text) {
  if (!text) return [];
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
        } else inQuotes = false;
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





/** ====== UTILS ====== */
const norm = (s = "") =>
  String(s || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const headerMap = (headers) => {
  const m = {};
  (headers || []).forEach((h, i) => (m[norm(h)] = i));
  return m;
};

const safeGet = (row, idx, fallback = "") =>
  idx != null && idx < row.length && row[idx] != null
    ? String(row[idx]).trim()
    : fallback;



const COLS = {
  status: ["status"],
  server: ["server"],
  buildName: ["build name"],
  buildVersion: ["build version"],
  projectName: ["project slot name"],
  projectSlot: ["project slot name", "project slot"],
  sbu: ["sbu"],
  areaSqft: ["area(sqft)", "area sqft", "area"],
  industry: ["industry"],
  designStyle: ["design style", "style"],
  vizdomId: ["vizdom project id", "vizdom id"],
  image: [
    "thumbnail_url",
    "Thumbnail_URL",
    "image_url",
    "image url",
    "thumbnail",
    "image",
    "thumb",
  ],
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

function normalizeServer(v = "") {
  const s = String(v || "").trim().toLowerCase();
  if (s.startsWith("us") || s.includes("united")) return "us";
  if (s.startsWith("in") || s.includes("india")) return "india";
  return "india";
}

function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

/** ====== PRETTY DATE FOR GROUP LABELS ===== */
function prettyDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Date";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  const wk = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `Date: ${dd}/${mm} ${wk} ${hh}:${mn}`;
}

/** ====== IMAGE (Drive fallback) ====== */
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
          `https://lh3.googleusercontent.com/d/${id}=w1600-h1000-no`,
          `https://drive.google.com/uc?export=view&id=${id}`,
          `https://drive.google.com/thumbnail?id=${id}&sz=w1600-h1000`,
          src,
        ]
      : [src || ""];

  const [idx, setIdx] = useState(0);
  const onError = () =>
    setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

  if (!src || idx === -1) {
    return (
      <img
        src={placeholderImg}
        alt={alt || "preview"}
        style={style}
        loading="lazy"
      />
    );
  }

  const bust = Date.now();
  const current = candidates[idx]
    ? `${candidates[idx]}${candidates[idx].includes("?") ? "&" : "?"}cb=${bust}`
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

const TABS = [
  // { key: "walkthroughs", label: "Walkthroughs", disabled: true },
  { key: "screenshots", label: "Screenshots", disabled: false },
];

/** ====== MERGE (keep old, add new; no "unhide/blank" during refresh) ====== */
function mergeGroups(prev = [], next = []) {
  // group name can be session folder name. Use that + file id for dedupe.
  const map = new Map((prev || []).map((g) => [g.group || g.ts || "", g]));

  for (const ng of next || []) {
    const key = ng.group || ng.ts || "";
    const pg = map.get(key);

    if (!pg) {
      map.set(key, ng);
      continue;
    }

    const seen = new Set((pg.items || []).map((it) => it.id));
    const mergedItems = [...(pg.items || [])];

    for (const it of ng.items || []) {
      if (it?.id && !seen.has(it.id)) {
        mergedItems.push(it);
        seen.add(it.id);
      }
    }

    mergedItems.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
    map.set(key, { ...pg, ...ng, items: mergedItems });
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  return merged;
}

export default function ScreenshotGallery() {
  const [activeTab, setActiveTab] = useState("screenshots");

  const { user, signOut } = useAuth();

  const [loadingHeader, setLoadingHeader] = useState(true);
  const [headerItem, setHeaderItem] = useState(null);

  const [screenshotsGroups, setScreenshotsGroups] = useState([]);
  const [heroHover, setHeroHover] = useState(false);
  const [demoHover, setDemoHover] = useState(false);


  // IMPORTANT:
  // - initialLoadingShots: only true when we have ZERO screenshots and we are fetching
  // - isRefreshingShots: true during background refresh but we DO NOT hide old images
  const [initialLoadingShots, setInitialLoadingShots] = useState(false);
  const [isRefreshingShots, setIsRefreshingShots] = useState(false);

  const rowRefs = useRef({});

  /** ====== QUERY PARAMS ====== */
  const buildQuery = getQuery("build", "Build");
  const verQuery = getQuery("ver", "");
  const thumbQuery = getQuery("thumb", "");
  const serverQuery = normalizeServer(getQuery("server", "india"));
  const catQuery = getQuery("cat", "Corporate Design");
  const areaQuery = getQuery("area", "");

  /** ====== DERIVED BUILD KEY ====== */
  const buildName = headerItem?.buildName || buildQuery;
  const version = headerItem?.buildVersion || verQuery || "";
  const buildBase = (buildName || "").trim();
  const buildKey = version ? `${buildBase} ${version}` : buildBase;

  /** ====== LOAD HEADER DATA (from sheet) ====== */
  useEffect(() => {
    (async () => {
      setLoadingHeader(true);
      try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&id=${SHEET_ID}&gid=${GID}`;
        const res = await fetch(url, { cache: "no-store" });
        const csv = await res.text();
        const rows = parseCSV(csv);
        if (!rows.length) throw new Error("Empty CSV");

        const headers = rows[0];
        const body = rows
          .slice(1)
          .filter((r) => r.some((c) => String(c || "").trim() !== ""));

        const iStatus = idxOf(headers, COLS.status);
        const iServer = idxOf(headers, COLS.server);
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
              server: normalizeServer(safeGet(r, iServer, "")),
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
        const qVer = norm(verQuery);

        let match = null;

        if (qVer) {
          match =
            items.find(
              (x) =>
                (norm(x.buildName) === qBuild || norm(x.projectName) === qBuild) &&
                norm(x.buildVersion || "") === qVer
            ) ||
            items.find((x) => norm(x.buildName) === qBuild) ||
            items.find((x) => norm(x.projectName) === qBuild) ||
            items[0];
        } else {
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

  const hasAnyScreenshots = useMemo(() => {
    return (screenshotsGroups || []).some((g) => (g?.items || []).length > 0);
  }, [screenshotsGroups]);

  /** ====== LOAD SCREENSHOTS (Apps Script) ====== */
  const fetchScreenshots = useCallback(
    async ({ background = false } = {}) => {
      if (!buildKey) return;

      // initial load: show empty loader ONLY when there is nothing on screen yet
      if (!background) setInitialLoadingShots(!hasAnyScreenshots);
      else setIsRefreshingShots(true);

      try {
        const url = new URL(GDRIVE_API_URL);
        url.searchParams.set("action", "listscreenshots");
        url.searchParams.set("build", buildKey);

        const res = await fetch(url.toString(), { cache: "no-store" });
        const json = await res.json();

        if (json?.ok) {
          // ✅ MERGE: keep old, only add new
          setScreenshotsGroups((prev) => mergeGroups(prev, json.groups || []));
        } else {
          console.warn("listscreenshots error", json);
          // IMPORTANT: do NOT clear UI on refresh failure
          if (!hasAnyScreenshots) setScreenshotsGroups([]);
        }
      } catch (err) {
        console.error("listscreenshots fetch error", err);
        // do NOT clear UI on refresh failure
        if (!hasAnyScreenshots) setScreenshotsGroups([]);
      } finally {
        setInitialLoadingShots(false);
        setIsRefreshingShots(false);
      }
    },
    [buildKey, hasAnyScreenshots]
  );

  useEffect(() => {
    fetchScreenshots({ background: false });
  }, [fetchScreenshots]);

  // Auto-refresh every 20 seconds (background)
  useEffect(() => {
    const interval = setInterval(() => fetchScreenshots({ background: true }), 5000);
    return () => clearInterval(interval);
  }, [fetchScreenshots]);

  /** ====== ACTIONS ====== */
  const openImage = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const dl = (url) => {
    if (!url) return;
    const downloadUrl = url.replace("export=view", "export=download");
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 60000);
  };

  const openVizwalk = () => {
    if (!headerItem) return;

    const bust = Date.now();
    const projectLabel = headerItem.projectName || headerItem.buildName || "project";

    const sessionId = `${projectLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().replace(/[:.]/g, "-")}`;

    const id = projectLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const params = new URLSearchParams({
      project: id,
      s: bust,
      session: sessionId,
      build: headerItem.buildName || headerItem.projectName || "Build",
      ver: headerItem.buildVersion || "",
    });

    window.open(`/experience?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const category = headerItem?.designStyle || headerItem?.industry || catQuery;
  const server = headerItem?.server || serverQuery;
  const serverLabel = server === "us" ? "US Server" : "India Server";

  const areaDisplay = headerItem?.areaSqft
    ? formatSqft(headerItem.areaSqft)
    : areaQuery
    ? formatSqft(areaQuery)
    : "";

  const heroImg = thumbQuery || headerItem?.thumb || "";

  return (
    <div style={sx.page}>
      <LandingNavbar user={user} signOut={signOut} />


      <div style={sx.container}>
        {/* Back */}
        <div style={sx.backRow}>
          <button
            type="button"
            style={sx.backBtn}
            onClick={() =>
              window.history.length > 1
                ? window.history.back()
                : (window.location.href = "/")
            }
          >
            ← <span style={{ marginLeft: 8 }}>Back to Projects</span>
          </button>
        </div>

        {/* ===== Top Detail ===== */}
        <div style={sx.topGrid}>
          <div style={sx.leftMeta}>
            {loadingHeader ? (
              <div style={{ paddingTop: 10, opacity: 0.7, fontWeight: 700 }}>
                Loading…
              </div>
            ) : (
              <>
                <div style={sx.bigTitle}>{buildName || "Project"}</div>

                <div style={sx.metaRow}>
                  <div style={sx.catPill}>{category}</div>
                  <div style={sx.dot}>•</div>
                  <div style={sx.metaText}>Area – {areaDisplay || "—"}</div>
                  <div style={sx.dot}>•</div>
                  <div style={sx.metaText}>🇮🇳 {serverLabel}</div>
                  {version ? (
                    <>
                      <div style={sx.dot}>•</div>
                      <div style={sx.metaText}>v{version}</div>
                    </>
                  ) : null}
                </div>

                <div style={sx.btnStack}>
                  {/* Demo video */}
                  <button
                      type="button"
                      style={{
                        ...sx.demoBtn,
                        ...(demoHover ? sx.demoBtnHover : sx.demoBtnNoShadow),
                        ...(headerItem?.youtube ? null : sx.demoBtnDisabled),
                      }}
                      disabled={!headerItem?.youtube}
                      onMouseEnter={() => headerItem?.youtube && setDemoHover(true)}
                      onMouseLeave={() => setDemoHover(false)}
                      onClick={() => {
                        if (!headerItem?.youtube) return;
                        window.open(headerItem.youtube, "_blank", "noopener,noreferrer");
                      }}
                    >

                    <span style={sx.demoIcon}>▶</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={sx.demoTitle}>Vizwalk Interactive Demo</div>
                      <div style={sx.demoSub}>See the interactive finish video</div>
                    </div>
                  </button>

                  {/* Open vizwalk */}
                  <button type="button" style={sx.openBtn} onClick={openVizwalk}>
                    <img src={openIcon} alt="" style={sx.openIcon} />
                    <span>Open Vizwalk</span>
                  </button>

                </div>
              </>
            )}
          </div>

          {/* Hero */}
          <div style={sx.heroCard}>
  <div
  style={sx.heroImgWrap}
  role="button"
  tabIndex={0}
  onClick={openVizwalk}
  onMouseEnter={() => setHeroHover(true)}
  onMouseLeave={() => setHeroHover(false)}
>

    <ImageWithFallback src={heroImg} alt={buildName} style={sx.heroImg} />

    {/* ✅ show only on hover */}
    <div
  style={{
    ...sx.heroHoverOverlay,
    opacity: heroHover ? 1 : 0,
    pointerEvents: heroHover ? "auto" : "none",
  }}
>

      <button
        type="button"
        style={sx.heroCta}
        onClick={(e) => {
          e.stopPropagation();
          openVizwalk();
        }}
      >
        <img src={openIcon} alt="" style={sx.openIcon} />
        <span>Open Vizwalk</span>
      </button>
    </div>
  </div>
</div>

        </div>

        {/* ===== Panel ===== */}
        <div style={sx.panel}>
         <div style={sx.panelTop}>
            <div style={sx.tabRow}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={t.disabled}
                  title={t.disabled ? "Coming soon" : ""}
                  onClick={() => !t.disabled && setActiveTab(t.key)}
                  style={{
                    ...sx.tab,
                    ...(activeTab === t.key ? sx.tabActive : null),
                    ...(t.disabled ? sx.tabDisabled : null),
                  }}
                >
                  {t.key === "walkthroughs" ? "▷" : "⧉"}&nbsp;&nbsp;{t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* ✅ tiny background refresh indicator (does NOT hide grid) */}
              {isRefreshingShots && hasAnyScreenshots ? (
                <div style={sx.refreshHint}>Refreshing…</div>
              ) : null}

              <button
                type="button"
                style={sx.refreshBtn}
                onClick={() => fetchScreenshots({ background: true })}
                disabled={isRefreshingShots}
                title="Refresh"
              >
                ⟳&nbsp;&nbsp;{isRefreshingShots ? "Refreshing" : "Refresh"}
              </button>
            </div>
         </div>

          <div style={sx.panelBody}>
            {activeTab !== "screenshots" ? (
              <div style={sx.emptyWrap}>
                <div style={sx.emptyIcon}>▷</div>
                <div style={sx.emptyTitle}>Walkthroughs coming soon</div>
                <div style={sx.emptySub}>This section will appear here when available</div>
              </div>
            ) : !hasAnyScreenshots && initialLoadingShots ? (
              // ✅ only show this big empty state on first load with zero images
              <div style={sx.emptyWrap}>
                <div style={sx.emptyIcon}>⧉</div>
                <div style={sx.emptyTitle}>Loading screenshots…</div>
                <div style={sx.emptySub}>Content will appear here when available</div>
              </div>
            ) : !hasAnyScreenshots ? (
              <div style={sx.emptyWrap}>
                <div style={sx.emptyIcon}>🖼</div>
                <div style={sx.emptyTitle}>No screenshots available yet</div>
                <div style={sx.emptySub}>Content will appear here when available</div>
              </div>
            ) : (
              <div style={sx.groupsWrap}>
                {screenshotsGroups.map((group, idx) => {
                  const key = group.group || idx;
                  const items = group.items || [];
                  if (!items.length) return null;

                  return (
                    <div key={key} style={sx.group}>
                      <div style={sx.groupHeader}>
                        <div style={sx.groupTitle}>
                          {prettyDate(group.ts || group.group)}
                        </div>

                        <button
                          type="button"
                          style={sx.groupBtn}
                          onClick={() => items.forEach((img) => dl(img.url))}
                        >
                          Download All
                        </button>
                      </div>

                      <div style={sx.grid}>
                        {items.map((img, i) => (
                          <div
                            key={(img.id || img.url || "") + i}
                            style={sx.card}
                            onClick={() => openImage(img.url)}
                            role="button"
                            tabIndex={0}
                          >
                            <ImageWithFallback
                              src={img.url}
                              alt="Screenshot"
                              style={sx.cardImg}
                            />

                            <button
                              type="button"
                              style={sx.dlPill}
                              onClick={(e) => {
                                e.stopPropagation();
                                dl(img.url);
                              }}
                              title="Download"
                            >
                              <img src={downloadIcon} alt="" style={sx.dlIcon} />
                            </button>

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

/** ====== STYLES ======
 * ✅ Green annotated space fix:
 * Your figma has smaller left/right gutter.
 * So increase max width + slightly increase vw usage.
 */
const sx = {
  page: {
  minHeight: "100vh",
  background: "#f3f3f2",
  color: "#141414",
  fontFamily: "var(--font-sans)",
},


  // ✅ Reduce big left gap by increasing container max width + using more viewport width
  container: {
    width: "min(1320px, 96vw)", // was min(1180px, 92vw)
    margin: "0 auto",
    paddingBottom: 60,
  },


  brand: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "#f5a524",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontFamily:
      'Maven Pro, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  brandName: {
    fontWeight: 950,
    letterSpacing: 0.2,
    lineHeight: 1.1,
    fontFamily:
      'Maven Pro, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  brandSub: { fontSize: 11, opacity: 0.65, marginTop: 2, fontWeight: 600 },
  navLinks: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLink: {
    textDecoration: "none",
    color: "#141414",
    fontWeight: 800,
    fontSize: 13,
    opacity: 0.8,
  },
  navRight: { display: "flex", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontWeight: 900,
  },
  logoutMini: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  /* Back row */
  backRow: { padding: "22px 0 6px" },
  backBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    opacity: 0.8,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
  },

  /* Top grid */
  topGrid: {
    padding: "6px 0 10px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 28,
    alignItems: "start",
  },
  leftMeta: { paddingTop: 8 },
  bigTitle: {
    fontSize: 42,
    fontWeight: 950,
    letterSpacing: -0.7,
    lineHeight: 1.05,
    fontFamily:
      'Maven Pro, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  metaRow: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    opacity: 0.92,
  },
  catPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    background: "rgba(245,165,36,0.16)",
    color: "#7a4a00",
    fontWeight: 950,
    fontSize: 12,
  },
  dot: { opacity: 0.35, fontWeight: 900 },
  metaText: { fontSize: 12, fontWeight: 850, opacity: 0.75 },

  btnStack: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: 420,
  },

  demoBtn: {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "14px 14px",
  
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#F3F3F2",
  cursor: "pointer",
  transition: "box-shadow 0.18s ease, transform 0.18s ease",
},

demoBtnNoShadow: {
  boxShadow: "none",
  transform: "translateY(0)",
},

demoBtnHover: {
  background:"#FEFEFE",
  boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
  transform: "translateY(-1px)",
},


  demoBtnDisabled: {
  opacity: 0.55,
  cursor: "not-allowed",
  boxShadow: "none",
  transform: "translateY(0)",
},

  demoIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#DB2424",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
  },
  demoTitle: { fontWeight: 950, fontSize: 13 },
  demoSub: { marginTop: 2, fontSize: 11, opacity: 0.65, fontWeight: 800 },

  openBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#FFC702",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
  },

  /* Hero */
  heroCard: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.07)",
    background: "#fff",
    boxShadow: "0 26px 70px rgba(0,0,0,0.14)",
  },
  heroImgWrap: { position: "relative", cursor: "pointer" },
  heroHoverOverlay: {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.18)",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 0.18s ease",
},

  heroImg: { width: "100%", height: 240, objectFit: "cover", display: "block" },
  heroCta: {
  padding: "10px 18px",
  borderRadius: 999,
  border: "none",
  background: "#FFC702",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
},


  /* Panel */
  panel: {
    marginTop: 18,
    background: "#F1F0EA",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 0,
    overflow: "hidden",
  },
  panelTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },

  tabRow: { display: "flex", gap: 18, alignItems: "center" },
  tab: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
    color: "#6B7280",
    padding: "10px 2px",
    borderBottom: "2px solid transparent",
  },
  tabActive: { color: "#f5a524", borderBottom: "2px solid #f5a524" },
  tabDisabled: { opacity: 0.35, cursor: "not-allowed" },

  refreshBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
    color: "#f5a524",
    padding: "10px 8px",
  },
  refreshHint: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.65,
  },

  panelBody: { padding: 22 },

  emptyWrap: {
    height: 260,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 18,
    background: "rgba(255,255,255,0.20)",
    borderRadius: 12,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(0,0,0,0.08)",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 12px",
    fontSize: 18,
  },
  emptyTitle: { fontWeight: 950, fontSize: 13 },
  emptySub: { marginTop: 6, fontSize: 11, opacity: 0.65, fontWeight: 800 },

  groupsWrap: {
    marginTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  group: {},
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  groupTitle: { fontWeight: 950, fontSize: 12, opacity: 0.85 },
  groupBtn: {
    border: "none",
    background: "transparent",
    color: "#2e7d32",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  card: {
    position: "relative",
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
    cursor: "pointer",
  },
  cardImg: { width: "100%", height: 190, objectFit: "cover", display: "block" },
  dlPill: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.10)",
    display: "grid",
    placeItems: "center",
    color: "#111",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
  },
  openIcon: {
  width: 16,
  height: 16,
  display: "block",
},

// update openBtn to align icon + text
openBtn: {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#FFC702",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},

// update heroCta to align icon + text
heroCta: {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%,-50%)",
  padding: "10px 18px",
  borderRadius: 999,
  border: "none",
  background: "#FFC702",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
},
dlIcon: {
  width: 14,
  height: 14,
  display: "block",
  opacity: 0.9,
},

};
