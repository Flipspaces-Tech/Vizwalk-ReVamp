import React, { useEffect, useMemo, useState } from "react";
import vizIcon from "../assets/vizdom.png";
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
  image: [
    "thumbnail_url",
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

function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
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
          `https://lh3.googleusercontent.com/d/${id}=w1400-h900-no`,
          `https://drive.google.com/uc?export=view&id=${id}`,
          `https://drive.google.com/thumbnail?id=${id}&sz=w1400-h900`,
          src,
        ]
      : [src || ""];

  const [idx, setIdx] = useState(0);
  const onError = () =>
    setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

  if (!src || idx === -1) {
    return (
      <img
        src="https://picsum.photos/seed/vizwalk/1400/900"
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

/** ====== UI: Small chip ====== */
function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...sx.chip,
        ...(active ? sx.chipActive : null),
      }}
    >
      {children}
    </button>
  );
}

/** ====== CARD (Image2 vibe) ====== */
function ProjectCard({ item, onOpenVizwalk, onOpenGallery }) {
  const vizdomHref = item.vizdomId
    ? `https://vizdom.flipspaces.app/user/project/${encodeURIComponent(
        item.vizdomId
      )}#Project#Summary`
    : null;

  return (
    <div style={sx.card}>
      <div style={sx.cardMedia} onClick={onOpenGallery} role="button" tabIndex={0}>
        <ImageWithFallback src={item.thumb} alt={item.buildName} style={sx.cardImg} />
        {item.sbu ? <div style={sx.badge}>{item.sbu}</div> : null}
      </div>

      <div style={sx.cardBody}>
        <div style={sx.cardTitleRow}>
          <div style={sx.cardTitle}>
            {item.buildName || "Build"}
            {item.buildVersion ? (
              <span style={sx.cardVer}> {item.buildVersion}</span>
            ) : null}
          </div>
        </div>

        <div style={sx.cardSub}>
          {item.projectName || item.projectSlot || "Project Slot"}
        </div>

        <div style={sx.cardMeta}>
          {item.areaSqft ? (
            <div>
              <span style={sx.metaK}>Area:</span> {formatSqft(item.areaSqft)}
            </div>
          ) : null}
          {item.industry ? (
            <div>
              <span style={sx.metaK}>Type:</span> {item.industry}
            </div>
          ) : null}
        </div>

        <div style={sx.cardActions}>
          <button type="button" style={sx.primaryBtn} onClick={onOpenVizwalk}>
            Open Vizwalk
          </button>

          <div style={sx.iconRow}>
            {item.youtube ? (
              <a
                href={item.youtube}
                target="_blank"
                rel="noopener noreferrer"
                style={sx.iconBtn}
                title="Watch walkthrough"
              >
                ▶
              </a>
            ) : null}

            {vizdomHref ? (
              <a
                href={vizdomHref}
                target="_blank"
                rel="noopener noreferrer"
                style={sx.iconBtn}
                title="Open in Vizdom"
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    display: "inline-block",
                    backgroundColor: "#111",
                    WebkitMaskImage: `url(${vizIcon})`,
                    maskImage: `url(${vizIcon})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </a>
            ) : null}

            <button type="button" style={sx.iconBtn} onClick={onOpenGallery} title="Open Gallery">
              ⧉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ====== PAGE ====== */
export default function Landing() {
  const { user, signOut } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [activeSbu, setActiveSbu] = useState("all");

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
          .filter((r) => r.some((c) => String(c || "").trim() !== ""));

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

  const sbus = useMemo(() => {
    const set = new Set(items.map((x) => (x.sbu || "").trim()).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = norm(query);
    return items.filter((it) => {
      if (activeSbu !== "all" && norm(it.sbu) !== norm(activeSbu)) return false;

      if (!q) return true;
      const hay = `${it.projectName} ${it.buildName} ${it.buildVersion} ${it.areaSqft} ${it.industry} ${it.designStyle} ${it.sbu}`;
      return norm(hay).includes(q);
    });
  }, [items, query, activeSbu]);

  const heroItem = filtered[0] || items[0] || null;

  const handleOpenVizwalk = (item) => {
    const bust = Date.now();
    const sessionId = `${(item.projectName || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().replace(/[:.]/g, "-")}`;

    const id = (item.projectName || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const params = new URLSearchParams({
      project: id,
      s: bust,
      session: sessionId,
      build: item.buildName || item.projectName || "Build",
      ver: item.buildVersion || "",
    });

    const href = `/experience?${params.toString()}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleOpenGallery = (item) => {
    const params = new URLSearchParams({
      build: item.buildName || item.projectName || "Build",
      ver: item.buildVersion || "",
    });

    const href = `/gallery?${params.toString()}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const scrollToProjects = () => {
    const el = document.getElementById("featured-projects");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <div style={{ ...sx.page, padding: 24 }}>Loading…</div>;
  }

  return (
    <div style={sx.page}>
      {/* Navbar */}
      <div style={sx.navWrap}>
        <div style={sx.container}>
          <div style={sx.nav}>
            <div style={sx.brand}>
              <div style={sx.brandDot} />
              <div>
                <div style={sx.brandName}>Vizwalk</div>
                <div style={sx.brandSub}>Project Showcase</div>
              </div>
            </div>

            <div style={sx.navLinks}>
              <a style={sx.navLink} href="#featured-projects" onClick={(e) => { e.preventDefault(); scrollToProjects(); }}>
                Featured Projects
              </a>
              <a style={sx.navLink} href="#clients" onClick={(e) => e.preventDefault()}>
                Clients
              </a>
              <a style={sx.navLink} href="#support" onClick={(e) => e.preventDefault()}>
                Support
              </a>
            </div>

            <div style={sx.navRight}>
              <div style={sx.userPill} title={user?.email || ""}>
                {user?.email ? user.email : "Signed in"}
              </div>
              <button onClick={signOut} style={sx.logoutBtn}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={sx.container}>
        <div style={sx.hero}>
          <div>
            <div style={sx.heroKicker}>Bring Spaces</div>
            <div style={sx.heroTitle}>
              To <span style={sx.heroAccent}>Life</span>
            </div>
            <div style={sx.heroText}>
              Browse interactive walkthroughs from our latest builds and explore
              design styles across industries.
            </div>

            <div style={sx.heroCtas}>
              <button style={sx.ctaPrimary} onClick={scrollToProjects}>
                Browse Demo
              </button>
              <button
                style={sx.ctaSecondary}
                onClick={() => setActiveSbu("all")}
              >
                Explore Projects
              </button>
            </div>
          </div>

          <div style={sx.heroMedia}>
            <div style={sx.heroMediaInner}>
              <ImageWithFallback
                src={heroItem?.thumb}
                alt="Hero"
                style={sx.heroImg}
              />
            </div>
          </div>
        </div>

        {/* Featured Projects */}
        <div id="featured-projects" style={sx.section}>
          <div style={sx.sectionHeader}>
            <div>
              <div style={sx.sectionTitle}>Featured Projects</div>
              <div style={sx.sectionSub}>
                Explore our curated projects and instantly launch a Vizwalk
                walkthrough.
              </div>
            </div>

            <div style={sx.searchWrap}>
              <span style={sx.searchIcon}>🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, builds, industries…"
                style={sx.searchInput}
              />
              {query ? (
                <button style={sx.clearBtn} onClick={() => setQuery("")} title="Clear">
                  ×
                </button>
              ) : null}
            </div>
          </div>

          <div style={sx.chipsRow}>
            {sbus.map((s) => (
              <Chip
                key={s}
                active={norm(activeSbu) === norm(s)}
                onClick={() => setActiveSbu(s)}
              >
                {s === "all" ? "All" : s}
              </Chip>
            ))}
          </div>

          <div style={sx.grid}>
            {filtered.map((it, i) => (
              <ProjectCard
                key={`${it.buildName}-${it.buildVersion}-${i}`}
                item={it}
                onOpenVizwalk={() => handleOpenVizwalk(it)}
                onOpenGallery={() => handleOpenGallery(it)}
              />
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div id="clients" style={sx.section}>
          <div style={sx.sectionTitle}>What Our Clients Say</div>
          <div style={sx.testGrid}>
            {[
              {
                n: "Enterprise PM",
                t: "Vizwalk made internal reviews faster — stakeholders could explore without long calls.",
              },
              {
                n: "Design Manager",
                t: "We now present iterations as interactive walkthroughs. Approvals got smoother.",
              },
              {
                n: "Client Team",
                t: "Clearer understanding of finishes and zoning before execution.",
              },
              {
                n: "Ops Lead",
                t: "Teams love the speed. Easy to open builds and view screenshots.",
              },
            ].map((x, idx) => (
              <div key={idx} style={sx.testCard}>
                <div style={sx.testName}>{x.n}</div>
                <div style={sx.testText}>{x.t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div id="support" style={sx.footer}>
          <div style={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} Vizwalk • Flipspaces
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ opacity: 0.7 }}>Help</span>
            <span style={{ opacity: 0.7 }}>Privacy</span>
            <span style={{ opacity: 0.7 }}>Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ====== STYLES (Image2 tone) ====== */
const sx = {
  page: {
    minHeight: "100vh",
    background: "#f7f4ef",
    color: "#141414",
  },
  container: {
    width: "min(1180px, 92vw)",
    margin: "0 auto",
  },

  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(247,244,239,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  nav: {
    height: 68,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#f5a524",
    boxShadow: "0 0 0 6px rgba(245,165,36,0.18)",
  },
  brandName: { fontWeight: 900, letterSpacing: 0.2 },
  brandSub: { fontSize: 12, opacity: 0.65, marginTop: 1 },

  navLinks: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    opacity: 0.85,
  },
  navLink: {
    textDecoration: "none",
    color: "#141414",
    fontWeight: 700,
    fontSize: 14,
  },

  navRight: { display: "flex", alignItems: "center", gap: 10 },
  userPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.05)",
    fontSize: 12,
    fontWeight: 800,
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },

  hero: {
    padding: "28px 0 10px",
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 24,
    alignItems: "center",
  },
  heroKicker: { fontSize: 34, fontWeight: 900, lineHeight: 1.05 },
  heroTitle: { fontSize: 44, fontWeight: 950, lineHeight: 1.02, marginTop: 4 },
  heroAccent: { color: "#f5a524" },
  heroText: { marginTop: 12, fontSize: 15, opacity: 0.8, maxWidth: 520 },
  heroCtas: { marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" },
  ctaPrimary: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f5a524",
    color: "#141414",
    fontWeight: 950,
    cursor: "pointer",
  },
  ctaSecondary: {
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  heroMedia: {
    background: "rgba(255,255,255,0.65)",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 18px 46px rgba(0,0,0,0.08)",
  },
  heroMediaInner: { borderRadius: 14, overflow: "hidden" },
  heroImg: { width: "100%", height: 280, objectFit: "cover", display: "block" },

  section: { padding: "18px 0 26px" },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  sectionTitle: { fontSize: 22, fontWeight: 950 },
  sectionSub: { marginTop: 6, fontSize: 13, opacity: 0.75 },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 999,
    padding: "10px 12px",
    minWidth: 320,
  },
  searchIcon: { opacity: 0.7 },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    flex: 1,
    fontSize: 14,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 999,
    border: "none",
    background: "rgba(0,0,0,0.06)",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: "26px",
  },

  chipsRow: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.75)",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
  },
  chipActive: {
    background: "#141414",
    color: "#fff",
    borderColor: "#141414",
  },

  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  card: {
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  cardMedia: { position: "relative", cursor: "pointer" },
  cardImg: { width: "100%", height: 160, objectFit: "cover", display: "block" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(0,0,0,0.08)",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
  },
  cardBody: { padding: 12 },
  cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: 950, lineHeight: 1.2 },
  cardVer: { fontSize: 13, fontWeight: 900, opacity: 0.6 },
  cardSub: { marginTop: 6, fontSize: 13, fontWeight: 800, opacity: 0.75 },
  cardMeta: { marginTop: 10, fontSize: 13, opacity: 0.85, lineHeight: 1.55 },
  metaK: { fontWeight: 950 },

  cardActions: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#f5a524",
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  iconRow: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    textDecoration: "none",
    color: "#111",
    fontWeight: 950,
  },

  testGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  testCard: {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
  },
  testName: { fontWeight: 950 },
  testText: { marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.55 },

  footer: {
    padding: "18px 0 34px",
    borderTop: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
};
