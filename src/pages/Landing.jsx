import React, { useEffect, useMemo, useState } from "react";
import vizIcon from "../assets/vizdom.png";
import { useAuth } from "../auth/AuthProvider";

/** ====== CONFIG ====== */
const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const GID = "0";

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
  String(s).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();

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
  server: ["server", "region", "country"],

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
  const onError = () => setIdx((i) => (i < candidates.length - 1 ? i + 1 : -1));

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

/** ====== HELPERS ====== */
function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

function normalizeServer(v = "") {
  const s = norm(v);
  if (s.includes("us")) return "us";
  if (s.includes("india") || s.includes("in")) return "india";
  return ""; // unknown
}

/** ====== Featured Card (Part 2) ====== */
function FeaturedCard({ item, onOpenVizwalk, onOpenGallery }) {
  const category = item.designStyle || item.industry || "Modern Office";

  return (
    <div style={sx.fpCard}>
      <div style={sx.fpMedia} onClick={onOpenGallery} role="button" tabIndex={0}>
        <ImageWithFallback src={item.thumb} alt={item.buildName} style={sx.fpImg} />
        {item.server ? <div style={sx.fpServerPill}>{item.server === "india" ? "India Server" : "US Server"}</div> : null}
      </div>

      <div style={sx.fpBody}>
        <div style={sx.fpCatPill}>{category}</div>
        <div style={sx.fpName}>{item.buildName || "Project"}</div>
        <div style={sx.fpArea}>Area – {formatSqft(item.areaSqft || "")}</div>

        <div style={sx.fpRow}>
          {item.youtube ? (
            <a href={item.youtube} target="_blank" rel="noreferrer" style={sx.fpYt} title="Watch walkthrough">
              ▶
            </a>
          ) : (
            <span style={{ ...sx.fpYt, opacity: 0.25 }}>▶</span>
          )}

          <button type="button" style={sx.fpDetail} onClick={onOpenVizwalk}>
            View Detail <span style={{ marginLeft: 6 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** ====== PART 3 (Testimonials like Figma) ====== */
function TestimonialsOnly() {
  const testimonials = [
    {
      initials: "SU",
      name: "Santosh Upadhyay",
      role: "BHIL (Bharat financial bank)",
      quote:
        "Our new workspace embodies innovation, creativity, and forward-thinking. Huge thanks to Flipspaces for their expertise, dedication, and swift transformation!",
    },
    {
      initials: "VK",
      name: "Vivek Khemani",
      role: "Quantiphi",
      quote:
        "Flipspaces was a one-stop solution for our office expansion, using VR technology to perfectly visualize and execute our vision.",
    },
    {
      initials: "PT",
      name: "Pankaj Tripathi",
      role: "B/S/H",
      quote:
        "Flipspaces designed our Mumbai, Hyderabad, Chennai, and Bangalore offices with open spaces, natural light, and a vibrant, modern work environment.",
    },
    {
      initials: "KS",
      name: "Kunal Shah",
      role: "Honest",
      quote:
        "Flipspaces transformed my restaurant with creativity, precision, and exceptional craftsmanship. Special thanks to Richard for seamless communication and prompt support!",
    },
    {
      initials: "VS",
      name: "Vishal Soni",
      role: "Tacza",
      quote:
        "Flipspaces delivered our project on time with professionalism and excellence. Grateful for their hard work and eager to collaborate again!",
    },
  ];

  return (
    <section id="clients" style={sx.part3Wrap}>
      <div style={sx.part3Title}>What Our Clients Say</div>
      <div style={sx.part3Sub}>
        Trusted by leading businesses across industries for exceptional workspace transformations
      </div>

      <div style={sx.part3CardsRow}>
        {testimonials.map((t, idx) => (
          <div key={idx} style={sx.part3Card}>
            <div style={sx.part3CardTop}>
              <div style={sx.part3Avatar}>{t.initials}</div>
              <div>
                <div style={sx.part3Name}>{t.name}</div>
                <div style={sx.part3Role}>{t.role}</div>
              </div>
            </div>

            <div style={sx.part3Quote}>&ldquo;{t.quote}&rdquo;</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** ====== FOOTER (Full-bleed like Figma) ====== */
function FooterFullBleed() {
  return (
    <footer style={sx.footerBleed}>
      <div style={sx.container}>
        <div style={sx.footerGrid}>
          <div style={sx.footerBrand}>
            <div style={sx.footerBrandRow}>
              <div style={sx.footerBrandMark}>V</div>
              <div>
                <div style={sx.footerBrandName}>Vizwalk</div>
                <div style={sx.footerBrandSub}>
                  Next-generation architectural visualization platform. Bring your designs to life with stunning realism.
                </div>
              </div>
            </div>
          </div>

          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>PRODUCT</div>
            <a href="#featured-projects" style={sx.footerLink}>
              Features
            </a>
            <a href="#featured-projects" style={sx.footerLink}>
              Gallery
            </a>
            <a href="#featured-projects" style={sx.footerLink}>
              Updates
            </a>
          </div>

          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>RESOURCES</div>
            <a href="#" style={sx.footerLink}>
              Documentation
            </a>
            <a href="#" style={sx.footerLink}>
              Shortcut Guide
            </a>
          </div>
        </div>

        <div style={sx.footerBottom}>
          <div>© 2026 Vizwalk.com All rights reserved.</div>
          <div style={sx.footerSocial}>
            <a href="#" style={sx.footerSocialLink}>
              LinkedIn
            </a>
            <a href="#" style={sx.footerSocialLink}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** ====== PAGE ====== */
export default function Landing() {
  const { user, signOut } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Server toggle (India / US)
  const [selectedServer, setSelectedServer] = useState("india");

  // Part 2: filter/search
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&id=${SHEET_ID}&gid=${GID}`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const csv = await res.text();
        const rows = parseCSV(csv);
        if (!rows.length) throw new Error("Empty CSV");

        const headers = rows[0];
        const body = rows.slice(1).filter((r) => r.some((c) => String(c || "").trim() !== ""));

        const iStatus = idxOf(headers, COLS.status);
        const iServer = idxOf(headers, COLS.server);

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

            const serverRaw = safeGet(r, iServer);
            const server = normalizeServer(serverRaw);

            return {
              server, // "india" | "us"
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

    return items.filter((it) => {
      // ✅ server filter (IMPORTANT)
      if (selectedServer && it.server && it.server !== selectedServer) return false;
      if (selectedServer && !it.server) return false; // if sheet missing server for a row, hide it

      // category chip filter (All means no filter)
      if (activeCategory !== "all") {
        const catHay = norm(`${it.designStyle || ""} ${it.industry || ""}`);
        if (!catHay.includes(norm(activeCategory))) return false;
      }

      // search filter
      if (!q) return true;
      const hay = `${it.projectName} ${it.buildName} ${it.buildVersion} ${it.areaSqft} ${it.industry} ${it.designStyle} ${it.sbu}`;
      return norm(hay).includes(q);
    });
  }, [items, query, activeCategory, selectedServer]);

  const heroItem = filtered[0] || items.find((x) => x.server === selectedServer) || items[0] || null;

  const handleOpenVizwalk = (item) => {
    const bust = Date.now();
    const sessionId = `${(item.projectName || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}`;

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

    window.open(`/experience?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const handleOpenGallery = (item) => {
    const params = new URLSearchParams({
      build: item.buildName || item.projectName || "Build",
      ver: item.buildVersion || "",
    });

    window.open(`/gallery?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div style={{ ...sx.page, padding: 24 }}>Loading…</div>;

  return (
    <div style={sx.page}>
      {/* Top announcement bar */}
      <div style={sx.topBar}>
        <div style={sx.container}>
          <div style={sx.topBarInner}>
            <div style={sx.topBarText}>
              Choose another country or region to see content specific to your location
            </div>

            <div style={sx.topBarRight}>
              <button
                type="button"
                style={{
                  ...sx.pillBtn,
                  ...(selectedServer === "india" ? sx.pillBtnActive : null),
                }}
                onClick={() => setSelectedServer("india")}
              >
                🇮🇳 <span style={{ marginLeft: 6 }}>India</span>
              </button>

              <button
                type="button"
                style={{
                  ...sx.pillBtn,
                  ...(selectedServer === "us" ? sx.pillBtnActive : null),
                }}
                onClick={() => setSelectedServer("us")}
              >
                🇺🇸 <span style={{ marginLeft: 6 }}>US</span>
              </button>

              <button type="button" style={sx.continueBtn}>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div style={sx.navWrap}>
        <div style={sx.container}>
          <div style={sx.nav}>
            <div style={sx.brand}>
              <div style={sx.brandMark}>V</div>
              <div>
                <div style={sx.brandName}>Vizwalk</div>
                <div style={sx.brandSub}>Powered by Flipspaces</div>
              </div>
            </div>

            <div style={sx.navLinks}>
              <a
                style={sx.navLink}
                href="#featured-projects"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Features
              </a>
              <a
                style={sx.navLink}
                href="#featured-projects"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Demo Videos
              </a>
              <a
                style={sx.navLink}
                href="#featured-projects"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Projects
              </a>
              <a
                style={sx.navLink}
                href="#clients"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("clients")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Testimonials
              </a>
            </div>

            <div style={sx.navRight}>
              <button type="button" style={sx.iconCircle} title="Settings">
                ⚙
              </button>
              <button type="button" style={sx.userMini} title={user?.email || ""}>
                {user?.email ? user.email : "user"}
              </button>
              <button onClick={signOut} style={sx.logoutMini} title="Logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={sx.container}>
        <div style={sx.hero}>
          <div style={sx.heroLeft}>
            <div style={sx.heroTitle}>
              Bring Spaces <br />
              <span style={sx.heroAccent}>To Life</span>
            </div>

            <div style={sx.heroDesc}>
              Interactive virtual walkthrough offering clients an immersive experience with real-time design modifications using
              Flipspaces&apos; integrated product library
            </div>

            <div style={sx.heroButtons}>
              <button
                type="button"
                style={sx.heroPrimary}
                onClick={() => document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })}
              >
                ▶ Watch Demo
              </button>

              <button
                type="button"
                style={sx.heroSecondary}
                onClick={() => document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore Platform
              </button>
            </div>
          </div>

          <div style={sx.heroRight}>
            <div style={sx.heroImageCard}>
              <ImageWithFallback src={heroItem?.thumb} alt="Hero preview" style={sx.heroImg} />
            </div>
          </div>
        </div>

        {/* ===== PART 2 (Featured Projects) ===== */}
        <div id="featured-projects" style={{ padding: "22px 0 38px" }}>
          <div style={sx.fpHeader}>
            <div>
              <div style={sx.fpTitle}>Featured Projects</div>
              <div style={sx.fpSub}>Explore our projects showcasing tech-enabled interior design expertise</div>
            </div>

            <button
              type="button"
              style={sx.fpViewAllTop}
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              View All Projects <span style={{ marginLeft: 6 }}>›</span>
            </button>
          </div>

          <div style={sx.fpControls}>
            <div style={sx.fpChips}>
              {["All", "Corporate Design", "Modern Office", "Executive Suite", "Meeting Spaces", "Retail", "Hospitality", "Residential"].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c === "All" ? "all" : c)}
                    style={{
                      ...sx.chip,
                      ...(activeCategory === (c === "All" ? "all" : c) ? sx.chipActive : null),
                    }}
                  >
                    {c}
                  </button>
                )
              )}
            </div>

            <div style={sx.fpSearchWrap}>
              <span style={sx.fpSearchIcon}>🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                style={sx.fpSearchInput}
              />
            </div>
          </div>

          <div style={sx.fpGrid}>
            {filtered.slice(0, 6).map((it, i) => (
              <FeaturedCard
                key={`${it.buildName}-${it.buildVersion}-${i}`}
                item={it}
                onOpenVizwalk={() => handleOpenVizwalk(it)}
                onOpenGallery={() => handleOpenGallery(it)}
              />
            ))}
          </div>

          <div style={sx.fpBottom}>
            <button
              type="button"
              style={sx.fpViewAllBottom}
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              View All Projects <span style={{ marginLeft: 6 }}>›</span>
            </button>
          </div>
        </div>

        {/* ===== PART 3 (Testimonials) ===== */}
        <TestimonialsOnly />
      </div>

      {/* ===== FOOTER (full width) ===== */}
      <FooterFullBleed />
    </div>
  );
}

/** ====== STYLES ====== */
const sx = {
  page: {
    minHeight: "100vh",
    background: "#ffffff", // ✅ make Image1/page background white
    color: "#141414",
  },

  container: {
    width: "min(1180px, 92vw)",
    margin: "0 auto",
  },

  /* Top bar */
  topBar: {
    background: "#ffffff",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 12,
  },
  topBarInner: {
    height: 38,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
  },
  topBarText: {
    gridColumn: "2 / 3",
    textAlign: "center",
    opacity: 0.75,
    fontWeight: 600,
    fontSize: 12,
  },
  topBarRight: {
    gridColumn: "3 / 4",
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pillBtn: {
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    height: 26,
    padding: "0 10px",
    borderRadius: 999,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
  },
  pillBtnActive: {
    borderColor: "rgba(0,0,0,0.18)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
  },
  continueBtn: {
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#f5a524",
    height: 26,
    padding: "0 12px",
    borderRadius: 999,
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
  },

  /* Navbar */
  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  nav: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "#f5a524",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
  },
  brandName: { fontWeight: 950, letterSpacing: 0.2, lineHeight: 1.1 },
  brandSub: { fontSize: 11, opacity: 0.65, marginTop: 2 },

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
  userMini: {
    maxWidth: 220,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.06)",
    fontSize: 12,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  logoutMini: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },

  /* Hero */
  hero: {
    padding: "64px 0 24px",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 34,
    alignItems: "center",
  },
  heroLeft: { paddingRight: 10 },
  heroTitle: {
    fontSize: 54,
    fontWeight: 950,
    lineHeight: 1.02,
    letterSpacing: -0.8,
  },
  heroAccent: { color: "#f5a524" },
  heroDesc: {
    marginTop: 18,
    fontSize: 14,
    opacity: 0.75,
    maxWidth: 480,
    lineHeight: 1.7,
  },
  heroButtons: { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" },
  heroPrimary: {
    background: "#f5a524",
    border: "1px solid rgba(0,0,0,0.10)",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  heroSecondary: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.18)",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  heroRight: { display: "flex", justifyContent: "flex-end" },
  heroImageCard: {
    width: "min(620px, 100%)",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.07)",
    background: "#fff",
    boxShadow: "0 26px 70px rgba(0,0,0,0.14)",
  },
  heroImg: {
    width: "100%",
    height: 320,
    objectFit: "cover",
    display: "block",
  },

  /* Featured Projects (Part 2) */
  fpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  fpTitle: { fontSize: 26, fontWeight: 950 },
  fpSub: { marginTop: 6, fontSize: 13, opacity: 0.72 },

  fpViewAllTop: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    opacity: 0.75,
  },

  fpControls: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  fpChips: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontWeight: 850,
    fontSize: 12,
  },
  chipActive: {
    background: "#f5a524",
    borderColor: "rgba(0,0,0,0.10)",
  },

  fpSearchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.90)",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 999,
    padding: "8px 12px",
    minWidth: 240,
  },
  fpSearchIcon: { opacity: 0.7, fontSize: 12 },
  fpSearchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 12,
    flex: 1,
  },

  fpGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  fpCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  fpMedia: { position: "relative", cursor: "pointer" },
  fpImg: { width: "100%", height: 170, objectFit: "cover", display: "block" },

  fpServerPill: {
    position: "absolute",
    right: 10,
    bottom: 10,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
  },

  fpBody: { padding: 12 },
  fpCatPill: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 6,
    background: "rgba(245,165,36,0.18)",
    color: "#a56100",
    fontSize: 11,
    fontWeight: 950,
  },
  fpName: { marginTop: 8, fontSize: 14, fontWeight: 950 },
  fpArea: { marginTop: 6, fontSize: 12, opacity: 0.75 },

  fpRow: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  fpYt: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    color: "#111",
    fontWeight: 950,
    fontSize: 12,
  },
  fpDetail: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.75,
  },

  fpBottom: {
    display: "flex",
    justifyContent: "center",
    marginTop: 18,
  },
  fpViewAllBottom: {
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 950,
    cursor: "pointer",
  },

  /* Part 3 */
  part3Wrap: { padding: "38px 0 16px" },
  part3Title: { textAlign: "center", fontSize: 28, fontWeight: 950 },
  part3Sub: { textAlign: "center", marginTop: 8, fontSize: 13, opacity: 0.72, fontWeight: 700 },

  part3CardsRow: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 14,
  },
  part3Card: {
    background: "rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 12,
    padding: 14,
    minHeight: 132,
  },
  part3CardTop: { display: "flex", alignItems: "center", gap: 10 },
  part3Avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "#f5a524",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
  },
  part3Name: { fontWeight: 950, fontSize: 12 },
  part3Role: { marginTop: 2, fontSize: 11, opacity: 0.7, fontWeight: 750 },
  part3Quote: { marginTop: 10, fontSize: 11.5, opacity: 0.82, lineHeight: 1.55, fontStyle: "italic" },

  /* Footer (full width like Figma) */
  footerBleed: {
    width: "100%",
    background: "rgba(0,0,0,0.14)",
    borderTop: "1px solid rgba(0,0,0,0.10)",
    marginTop: 10,
    padding: "22px 0 14px",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.9fr 0.9fr",
    gap: 28,
    alignItems: "start",
    paddingBottom: 16,
  },
  footerBrandRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  footerBrandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "#f5a524",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    flex: "0 0 auto",
  },
  footerBrandName: { fontWeight: 950, fontSize: 14, lineHeight: 1.1 },
  footerBrandSub: {
    marginTop: 6,
    maxWidth: 420,
    opacity: 0.78,
    fontSize: 12,
    lineHeight: 1.55,
    fontWeight: 700,
  },
  footerCol: { paddingTop: 4 },
  footerColTitle: {
    fontWeight: 950,
    fontSize: 11,
    opacity: 0.75,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  footerLink: {
    display: "block",
    fontSize: 12,
    fontWeight: 850,
    opacity: 0.82,
    marginBottom: 10,
    textDecoration: "none",
    color: "#141414",
  },
  footerBottom: {
    borderTop: "1px solid rgba(0,0,0,0.12)",
    paddingTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 11,
    opacity: 0.82,
    fontWeight: 850,
  },
  footerSocial: { display: "flex", gap: 18, alignItems: "center" },
  footerSocialLink: {
    textDecoration: "none",
    color: "#141414",
    fontWeight: 850,
    opacity: 0.85,
  },
};
