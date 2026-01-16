import React, { useEffect, useMemo, useState } from "react";
import vizIcon from "../assets/vizdom.png"; // your provided PNG

import { useAuth } from "../auth/AuthProvider";


/** ====== CONFIG ====== */
const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const GID = "0";



/** ====== CSV PARSER (robust) ====== */
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

/** ====== UTILS ====== */
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

/** ====== FLEXIBLE HEADER ALIASES ====== */
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
  image: ["thumbnail_url", "image_url", "image url", "thumbnail", "image", "thumb"],
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

/** ====== IMAGE (Google Drive fallback) ====== */
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

  const [idx, setIdx] = useState(0);

  const onError = () =>
    setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

  if (!src || idx === -1) {
    return (
      <img
        src="https://picsum.photos/seed/office/1200/800"
        alt={alt || "preview"}
        style={style}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
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

/** ====== HELPERS ====== */
function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

/** ====== CARD ====== */
function BuildCard({
  id,
  item,
  onOpenVizwalk,
  onOpenGallery,
  onSelect,
  selected,
}) {
  const [cardHover, setCardHover] = React.useState(false);
  const [mediaHover, setMediaHover] = React.useState(false);
  const [ytHover, setYtHover] = React.useState(false);
  const [vizHover, setVizHover] = React.useState(false);

  const cardStyle = {
    ...styles.card,
    ...(cardHover ? styles.cardHover : null),
    ...(selected ? styles.cardSelected : null),
  };

  const handleCardClick = () => {
    onSelect?.(id);
    onOpenGallery?.(); // clicking white area => gallery
  };

  const vizdomHref = item.vizdomId
    ? `https://vizdom.flipspaces.app/user/project/${encodeURIComponent(
        item.vizdomId
      )}#Project#Summary`
    : null;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => {
        setCardHover(false);
      }}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
    >
      {/* media (click -> vizwalk/experience) with overlay pill */}
      <div
        style={styles.mediaWrap}
        onMouseEnter={() => setMediaHover(true)}
        onMouseLeave={() => setMediaHover(false)}
        onClick={(e) => {
          e.stopPropagation(); // don’t trigger gallery
          onOpenVizwalk?.();
        }}
        onFocus={() => setMediaHover(true)}
        onBlur={() => setMediaHover(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setMediaHover(false);
            onOpenVizwalk?.();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Open Vizwalk"
        title="Open Vizwalk"
      >
        {/* image wrapper with blur on hover */}
        <div
          style={{
            ...styles.heroWrap,
            ...(mediaHover ? styles.heroWrapBlur : null),
          }}
        >
          <ImageWithFallback
            src={item.thumb}
            alt={item.projectName}
            style={styles.hero}
          />
        </div>

        {/* centered overlay pill */}
        <div
          style={{
            ...styles.mediaOverlay,
            ...(mediaHover ? styles.mediaOverlayOn : null),
          }}
        >
          <button
            type="button"
            style={styles.mediaBtn}
            onClick={(e) => {
              e.stopPropagation();
              setMediaHover(false);
              onOpenVizwalk?.();
            }}
          >
            Open Vizwalk
          </button>
        </div>
      </div>

      {/* Title + Version */}
      <div style={styles.titleWrap}>
        <div style={styles.titleText}>
          {item.buildName || "Build Name"}
          <span style={styles.versionText}>
            {item.buildVersion ? ` ${item.buildVersion}` : ""}
          </span>
        </div>
        <div style={styles.subLink}>
          {item.projectName || item.projectSlot || "Project Slot Name"}
        </div>
      </div>

      {/* Meta lines */}
      <div style={styles.metaBlock}>
        {item.areaSqft ? (
          <div>
            <strong>Area</strong> - {formatSqft(item.areaSqft)}
          </div>
        ) : null}
        {item.industry ? (
          <div>
            <strong>Construction Type</strong> - {item.industry}
          </div>
        ) : null}
      </div>

      {/* Bottom-right actions */}
      <div style={styles.actionsRow}>
        {/* YouTube */}
        {item.youtube ? (
          <a
            href={item.youtube}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              setYtHover(false);
            }}
            onMouseDown={() => setYtHover(false)}
            title="Watch walkthrough"
            style={styles.iconBtnClear}
            onMouseEnter={() => setYtHover(true)}
            onMouseLeave={() => setYtHover(false)}
          >
            <svg
              viewBox="0 0 24 24"
              style={{
                ...styles.ytSvg,
                ...(ytHover ? styles.ytSvgHover : null),
                ...(ytHover ? styles.ytGlowHover : null),
              }}
              aria-hidden
            >
              <rect
                x="2.8"
                y="6.2"
                width="18.4"
                height="11.6"
                rx="3.2"
                fill={ytHover ? "#FF0000" : "#0D0D0D"}
              />
              <path d="M10 9v6l5-3-5-3z" fill="#FFFFFF" />
            </svg>
          </a>
        ) : null}

        {/* Vizdom */}
        {vizdomHref ? (
          <a
            href={vizdomHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              setVizHover(false);
            }}
            onMouseDown={() => setVizHover(false)}
            title="Open in Vizdom"
            style={styles.iconBtnClear}
            onMouseEnter={() => setVizHover(true)}
            onMouseLeave={() => setVizHover(false)}
          >
            <span
              style={{ ...styles.vizGlow, ...(vizHover ? styles.vizGlowOn : null) }}
            />
            <span
              style={{
                ...styles.vizMask,
                ...(vizHover ? styles.vizMaskHover : null),
              }}
              aria-hidden
            />
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** ====== PAGE ====== */
export default function Landing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  const onSelect = (id) => setSelectedId((prev) => (prev === id ? null : id));

  const { user, signOut } = useAuth();

  const [logoutHover, setLogoutHover] = useState(false);


  useEffect(() => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&id=${SHEET_ID}&gid=${GID}`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const csv = await res.text();
        const rows = parseCSV(csv);
        if (!rows.length) throw new Error("Empty CSV");

        const headers = rows[0];
        const body = rows
          .slice(1)
          .filter((r) =>
            r.some((c) => String(c || "").trim() !== "")
          );

        const iStatus = idxOf(headers, COLS.status);
        const iSBU = idxOf(headers, COLS.sbu);
        const iProjectName = idxOf(headers, COLS.projectName);
        const iBuildName = idxOf(headers, COLS.buildName);
        const iBuildVersion = idxOf(headers, COLS.buildVersion);
        const iUploadId = idxOf(headers, COLS.uploadId);
        const iProjectSlot = idxOf(headers, COLS.projectSlot);
        const iProjectSlotId = idxOf(headers, COLS.projectSlotId);
        const iAreaSqft = idxOf(headers, COLS.areaSqft);
        const iIndustry = idxOf(headers, COLS.industry);
        const iDesignStyle = idxOf(headers, COLS.designStyle);
        const iImage = idxOf(headers, COLS.image);
        const iYouTube = idxOf(headers, COLS.youtube);
        const iVizdomId = idxOf(headers, COLS.vizdomId);

        const data = body
          .map((r) => {
            const status = norm(safeGet(r, iStatus, "Active"));
            if (status !== "active") return null;
            return {
              sbu: safeGet(r, iSBU),
              projectName: safeGet(r, iProjectName),
              buildName: safeGet(r, iBuildName),
              buildVersion: safeGet(r, iBuildVersion),
              uploadId: safeGet(r, iUploadId),
              projectSlot: safeGet(r, iProjectSlot),
              projectSlotId: safeGet(r, iProjectSlotId),
              areaSqft: safeGet(r, iAreaSqft),
              industry: safeGet(r, iIndustry),
              designStyle: safeGet(r, iDesignStyle),
              thumb: safeGet(r, iImage),
              youtube: safeGet(r, iYouTube),
              vizdomId: safeGet(r, iVizdomId),
            };
          })
          .filter(Boolean);

        setItems(data);
      } catch (e) {
        console.error("Sheet load error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.projectName} ${it.buildName} ${it.areaSqft} ${it.industry} ${it.designStyle} ${it.sbu}`;
      return norm(hay).includes(q);
    });
  }, [items, query]);

  const groups = useMemo(() => {
    const g = new Map();
    filtered.forEach((it) => {
      const key = it.sbu || "SBU";
      if (!g.has(key)) g.set(key, []);
      g.get(key).push(it);
    });
    const arr = Array.from(g.entries());
    const order = ["enterprise", "sme", "us"];
    arr.sort(
      (a, b) =>
        order.indexOf((a[0] || "").toLowerCase()) -
        order.indexOf((b[0] || "").toLowerCase())
    );
    return arr;
  }, [filtered]);

  const handleOpenVizwalk = (item) => {
    const bust = Date.now();
    const sessionId = `${(item.projectName || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}`;

    let href;
    if (item.url && /^https?:\/\//i.test(item.url)) {
      const u = new URL(item.url);
      u.searchParams.set("session", sessionId);
      u.searchParams.set("build", item.buildName || item.projectName || "Build");
      href = u.toString();
    } else {
      const id = (item.projectName || "project")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const params = new URLSearchParams({
        project: id,
        s: bust,
        session: sessionId,
        build: item.buildName || item.projectName || "Build",
        ver: item.buildVersion || "",      // 👈 add this line
      });
      href = `/experience?${params.toString()}`;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleOpenGallery = (item) => {
  const params = new URLSearchParams({
    build: item.buildName || item.projectName || "Build",
    ver: item.buildVersion || "",          // 👈 pass V1 / V2 etc.
  });

  const href = `/gallery?${params.toString()}`;
  window.open(href, "_blank", "noopener,noreferrer");
};



  if (loading) return <div style={styles.page}>Loading…</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.page}>
        {/* Sticky search bar */}
        <div style={styles.searchBarWrap}>
          <div style={styles.searchInner}>
            <span style={styles.searchIcon} aria-hidden>
              🔎
            </span>
            <button
                onClick={signOut}
                style={{
                  ...styles.logoutBtn,
                  ...(logoutHover ? styles.logoutBtnHover : null),
                }}
                onMouseEnter={() => setLogoutHover(true)}
                onMouseLeave={() => setLogoutHover(false)}
                title={user?.email || "Logout"}
              >
                <span style={styles.logoutDot} />
                Logout
              </button>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, builds, industries…"
              style={styles.searchInput}
              aria-label="Search projects"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={styles.clearBtn}
                aria-label="Clear search"
                title="Clear"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        <div style={styles.columns}>
          {groups.map(([sbu, arr]) => (
            <div key={sbu} style={styles.col}>
              <div style={{ display: "none" }}>{sbu}</div>
              {arr.map((item, i) => {
                const id =
                  (item.projectName || "project")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-") +
                  "-" +
                  i;
                return (
                  <BuildCard
                    key={id}
                    id={id}
                    item={item}
                    onOpenVizwalk={() => handleOpenVizwalk(item)}
                    onOpenGallery={() => handleOpenGallery(item)}
                    onSelect={onSelect}
                    selected={selectedId === id}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ====== STYLES ====== */
const styles = {
  wrapper: {
    width: "100%",
    height: "100vh",
    overflowY: "auto",
    background: "#e9eefc",
  },
  page: {
    padding: 24,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  /** Search bar */
  searchBarWrap: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    padding: "8px 0 32px 0",
    background: "linear-gradient(#e9eefc 60%, rgba(233,238,252,0.7))",
    backdropFilter: "saturate(1.05)",
  },
  searchInner: {
    width: "min(1100px, 92vw)",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    borderRadius: 999,
    border: "1px solid #e5eaf6",
    boxShadow: "0 6px 22px rgba(91, 125, 255, 0.15)",
    padding: "10px 14px",
  },
  searchIcon: { fontSize: 18, opacity: 0.7, marginLeft: 6 },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 16,
    padding: "6px 10px",
    background: "transparent",
  },
  clearBtn: {
    border: "none",
    background: "#f0f3ff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: 18,
    lineHeight: "28px",
    cursor: "pointer",
  },

  // Grid
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 360px)",
    gap: 36,
    justifyContent: "center",
  },
  col: { display: "flex", flexDirection: "column", gap: 36 },

  // Card
  card: {
    position: "relative",
    width: 360,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #eef1fb",
    boxShadow: "0 10px 30px rgba(110,129,255,0.18)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    transition: "transform 140ms ease, box-shadow 140ms ease",
    cursor: "pointer",
  },
  cardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 16px 38px rgba(110,129,255,0.26)",
  },
  cardSelected: {
    boxShadow:
      "0 18px 40px rgba(26,115,232,0.22), 0 0 0 2px rgba(26,115,232,0.32) inset",
  },

  // Media
  mediaWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
  hero: {
    width: "100%",
    aspectRatio: "1 / 0.62",
    height: "auto",
    objectFit: "cover",
    display: "block",
  },
  heroWrap: {
    position: "relative",
    transition: "filter 200ms ease, transform 200ms ease",
  },
  heroWrapBlur: {
    filter: "blur(4px) brightness(0.9)",
    transform: "scale(1.02)",
  },

  // Overlay pill
  mediaOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 160ms ease",
  },
  mediaOverlayOn: { opacity: 1 },
  mediaBtn: {
    pointerEvents: "auto",
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.75)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    color: "#1d2433",
    fontSize: 18,
    fontWeight: 800,
    padding: "10px 18px",
    borderRadius: 999,
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    cursor: "pointer",
    transform: "translateY(0)",
    transition:
      "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
  },

  // Title block
  titleWrap: { marginTop: 12 },
  titleText: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.15,
    color: "#1d2433",
  },
  versionText: {
    fontSize: 18,
    color: "#9aa4b2",
    marginLeft: 6,
    fontWeight: 700,
  },
  subLink: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: 700,
    color: "#3b82f6",
  },

  // Meta
  metaBlock: { marginTop: 10, color: "#3b3b3b", fontSize: 15, lineHeight: 1.45 },

  // Actions
  actionsRow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    display: "flex",
    gap: 12,
  },

  iconBtnClear: {
    width: 44,
    height: 44,
    position: "relative",
    display: "grid",
    placeItems: "center",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },

  ytSvg: {
    position: "absolute",
    left: "75%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(1.2)",
    width: 38,
    height: 26,
    pointerEvents: "none",
    transition: "transform 140ms ease",
  },
  ytSvgHover: {
    transform: "translate(-50%, -50%) scale(1.2)",
  },


  vizMask: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(0.9)",
    width: 34,
    height: 34,
    backgroundColor: "#0D0D0D",
    WebkitMaskImage: `url(${vizIcon})`,
    maskImage: `url(${vizIcon})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    pointerEvents: "none",
    zIndex: 1,
    transition:
      "transform 140ms ease, background-color 140ms ease",
  },
  vizMaskHover: {
    transform: "translate(-50%, -50%) scale(0.9)",
    backgroundColor: "#06B6D4",
  },

  vizGlow: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 56,
    height: 56,
    borderRadius: 16,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 160ms ease",
    zIndex: 0,
 
    filter:
      "blur(4px) drop-shadow(0 6px 16px rgba(6,182,212,0.30)) drop-shadow(0 0 14px rgba(6,182,212,0.26))",
  },
  vizGlowOn: {
    opacity: 1,
  },


  logoutBtn: {
  border: "1px solid #e5eaf6",
  background: "#ffffff",
  color: "#1d2433",
  fontWeight: 900,
  fontSize: 13,
  padding: "8px 12px",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(110,129,255,0.10)",
  transition: "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
  whiteSpace: "nowrap",
},
logoutBtnHover: {
  transform: "translateY(-1px)",
  boxShadow: "0 10px 24px rgba(110,129,255,0.18)",
  background: "#f8faff",
},
logoutDot: {
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: 99,
  background: "#06B6D4",
  marginRight: 8,
  boxShadow:
    "0 0 0 3px rgba(6,182,212,0.12), 0 8px 18px rgba(6,182,212,0.18)",
},

};
