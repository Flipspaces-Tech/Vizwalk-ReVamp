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

/** ====== HELPERS ====== */
function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

/** ====== CARD (keep for Part 2 tuning later) ====== */
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

function FeaturedCard({ item, onOpenVizwalk, onOpenGallery }) {
  const category =
    item.designStyle || item.industry || "Modern Office"; // best available

  return (
    <div style={sx.fpCard}>
      <div style={sx.fpMedia} onClick={onOpenGallery} role="button" tabIndex={0}>
        <ImageWithFallback src={item.thumb} alt={item.buildName} style={sx.fpImg} />

        {/* right badge (server / sbu) */}
        {item.sbu ? <div style={sx.fpServerPill}>{item.sbu}</div> : null}
      </div>

      <div style={sx.fpBody}>
        <div style={sx.fpCatPill}>{category}</div>

        <div style={sx.fpName}>{item.buildName || "Project"}</div>

        <div style={sx.fpArea}>
          Area – {formatSqft(item.areaSqft || "")}
        </div>

        <div style={sx.fpRow}>
          {/* youtube icon */}
          {item.youtube ? (
            <a
              href={item.youtube}
              target="_blank"
              rel="noreferrer"
              style={sx.fpYt}
              title="Watch walkthrough"
            >
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





/** ====== PAGE ====== */
export default function Landing() {
  const { user, signOut } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Part 2 later: filter/search
  // Part 2 (Figma): filter/search + view all
const [searchQuery, setSearchQuery] = useState("");
const [activeCategory, setActiveCategory] = useState("All");
const [showAllProjects, setShowAllProjects] = useState(false);

// optional: responsive 3-col -> auto
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const onResize = () => setIsMobile(window.innerWidth < 980);
  onResize();
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);


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

  const filtered = useMemo(() => {
  const q = norm(searchQuery);

  return items.filter((it) => {
    const cat = (it.designStyle || it.industry || "Modern Office").trim();

    // Category filter
    const matchesCategory =
      activeCategory === "All" || norm(cat) === norm(activeCategory);

    // Search filter (title/category)
    const hay = `${it.buildName} ${it.projectName} ${cat} ${it.sbu}`;
    const matchesSearch = !q || norm(hay).includes(q);

    return matchesCategory && matchesSearch;
  });
}, [items, searchQuery, activeCategory]);



const displayedProjects = useMemo(() => {
  return showAllProjects ? filtered : filtered.slice(0, 6);
}, [filtered, showAllProjects]);




  const heroItem = displayedProjects[0] || filtered[0] || items[0] || null;


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
      {/* =========================
          PART 1 (Image2) START
         ========================= */}

      {/* Top announcement bar */}
      <div style={sx.topBar}>
        <div style={sx.container}>
          <div style={sx.topBarInner}>
            <div style={sx.topBarText}>
              Choose another country or region to see content specific to your location
            </div>

            <div style={sx.topBarRight}>
              <button type="button" style={sx.pillBtn}>
                🇮🇳 <span style={{ marginLeft: 6 }}>India</span>
              </button>
              <button type="button" style={sx.pillBtn}>
                🇺🇸 <span style={{ marginLeft: 6 }}>US</span>
              </button>
              <button type="button" style={sx.continueBtn}>Continue</button>
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
              <a style={sx.navLink} href="#featured-projects" onClick={(e)=>{e.preventDefault(); document.getElementById("featured-projects")?.scrollIntoView({behavior:"smooth"});}}>
                Features
              </a>
              <a style={sx.navLink} href="#featured-projects" onClick={(e)=>{e.preventDefault(); document.getElementById("featured-projects")?.scrollIntoView({behavior:"smooth"});}}>
                Demo Videos
              </a>
              <a style={sx.navLink} href="#featured-projects" onClick={(e)=>{e.preventDefault(); document.getElementById("featured-projects")?.scrollIntoView({behavior:"smooth"});}}>
                Projects
              </a>
              <a style={sx.navLink} href="#clients" onClick={(e)=>{e.preventDefault(); document.getElementById("clients")?.scrollIntoView({behavior:"smooth"});}}>
                Testimonials
              </a>
            </div>

            <div style={sx.navRight}>
              <button type="button" style={sx.iconCircle} title="Settings">⚙</button>
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
              Interactive virtual walkthrough offering clients an immersive experience
              with real-time design modifications using Flipspaces&apos; integrated product library
            </div>

            <div style={sx.heroButtons}>
              <button
                type="button"
                style={sx.heroPrimary}
                onClick={() =>
                  document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                ▶ Watch Demo
              </button>

              <button
                type="button"
                style={sx.heroSecondary}
                onClick={() =>
                  document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Platform
              </button>
            </div>
          </div>

          <div style={sx.heroRight}>
            <div style={sx.heroImageCard}>
              <ImageWithFallback
                src={heroItem?.thumb}
                alt="Hero preview"
                style={sx.heroImg}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          PART 1 (Image2) END
         ========================= */}

      {/* PART 2/3 placeholder (we’ll style later) */}
      <div style={sx.container}>
          <div id="featured-projects" style={{ padding: "44px 0 54px" }}>
  {/* header row */}
  <div style={sx.fpHeader}>
    <div>
      <div style={sx.fpTitle}>Featured Projects</div>
      <div style={sx.fpSub}>
        Explore our projects showcasing tech-enabled interior design expertise
      </div>
    </div>

    <button
      type="button"
      style={sx.fpViewAllTop}
      onClick={() => setShowAllProjects(true)}
    >
      View All Projects <span style={{ marginLeft: 6 }}>›</span>
    </button>
  </div>

  {/* chips + search row */}
  <div style={sx.fpControls}>
    <div style={sx.fpChips}>
      {[
        "All",
        "Corporate Design",
        "Modern Office",
        "Executive Suite",
        "Meeting Spaces",
        "Retail",
        "Hospitality",
        "Residential",
      ].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            setActiveCategory(c);
            setShowAllProjects(false);
          }}
          style={{
            ...sx.chip,
            ...(activeCategory === c ? sx.chipActive : null),
          }}
        >
          {c}
        </button>
      ))}
    </div>

    <div style={sx.fpSearchWrap}>
      <span style={sx.fpSearchIcon}>🔎</span>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search Projects.."
        style={sx.fpSearchInput}
      />
    </div>
  </div>

  {/* grid */}
  <div style={isMobile ? { ...sx.fpGrid, ...sx.fpGridMobile } : sx.fpGrid}>
    {displayedProjects.map((it, i) => (
      <FeaturedCard
        key={`${it.buildName}-${it.buildVersion}-${i}`}
        item={it}
        onOpenVizwalk={() => handleOpenVizwalk(it)}
        onOpenGallery={() => handleOpenGallery(it)}
      />
    ))}
  </div>

  {/* bottom view all */}
  {filtered.length > 6 && (
    <div style={sx.fpBottom}>
      <button
        type="button"
        style={sx.fpViewAllBottom}
        onClick={() => setShowAllProjects((v) => !v)}
      >
        {showAllProjects ? "Show Less" : "View All Projects"}{" "}
        <span style={{ marginLeft: 6 }}>›</span>
      </button>
    </div>
  )}
</div>



        <div id="clients" style={sx.clientsSection}>
  <div style={sx.container}>
    {/* Title */}
    <div style={sx.clientsHead}>
      <div style={sx.clientsTitle}>What Our Clients Say</div>
      <div style={sx.clientsSub}>
        Trusted by leading businesses across industries for exceptional workspace transformations
      </div>
    </div>

    {/* 5 cards row */}
    <div style={sx.clientsRow}>
      {[
        {
          initials: "SU",
          name: "Santosh Upadhyay",
          org: "BHIL (Bharat financial bank)",
          text:
            "Our new workspace embodies innovation, creativity, and forward-thinking. Huge thanks to Flipspaces for their expertise, dedication, and swift transformation!",
        },
        {
          initials: "VK",
          name: "Vivek Khemnani",
          org: "Quantiphi",
          text:
            "Flipspaces was a one-stop solution for our office expansion, using VR technology to perfectly visualize and execute our vision.",
        },
        {
          initials: "PT",
          name: "Pankaj Tripathi",
          org: "B/S/H",
          text:
            "Flipspaces designed our Mumbai, Hyderabad, Chennai, and Bangalore offices with open spaces, natural light, and a vibrant, modern work environment.",
        },
        {
          initials: "KS",
          name: "Kunal Shah",
          org: "Honest",
          text:
            "Flipspaces transformed my restaurant with creativity, precision, and exceptional craftsmanship. Special thanks to Richard for seamless communication and prompt support!",
        },
        {
          initials: "VS",
          name: "Vishal Soni",
          org: "Tacza",
          text:
            "Flipspaces delivered our project on time with professionalism and excellence. Grateful for their hard work and eager to collaborate again!",
        },
      ].map((t, idx) => (
        <div key={idx} style={sx.clientCard}>
          <div style={sx.clientCardTop}>
            <div style={sx.clientAvatar}>{t.initials}</div>
            <div>
              <div style={sx.clientName}>{t.name}</div>
              <div style={sx.clientOrg}>{t.org}</div>
            </div>
          </div>

          <div style={sx.clientQuote}>
            “{t.text}”
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Footer strip */}
  <div style={sx.footerWrap}>
    <div style={sx.container}>
      <div style={sx.footerTop}>
        {/* left brand */}
        <div style={sx.footerBrand}>
          <div style={sx.footerBrandRow}>
            <div style={sx.footerLogoMark}>V</div>
            <div style={{ fontWeight: 950 }}>Vizwalk</div>
          </div>

          <div style={sx.footerBrandText}>
            Next-generation architectural visualization platform.
            Bring your designs to life with stunning realism.
          </div>
        </div>

        {/* columns */}
        <div style={sx.footerCols}>
          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>PRODUCT</div>
            <a style={sx.footerLink} href="#featured-projects">Features</a>
            <a style={sx.footerLink} href="#featured-projects">Gallery</a>
            <a style={sx.footerLink} href="#featured-projects">Updates</a>
          </div>

          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>RESOURCES</div>
            <a style={sx.footerLink} href="#featured-projects">Documentation</a>
            <a style={sx.footerLink} href="#featured-projects">Shortcut Guide</a>
          </div>
        </div>
      </div>

      <div style={sx.footerBottom}>
        <div style={sx.footerCopyright}>
          © 2026 Vizwalk.com All rights reserved.
        </div>

        <div style={sx.footerSocial}>
          <a style={sx.footerSocialLink} href="#" onClick={(e) => e.preventDefault()}>LinkedIn</a>
          <a style={sx.footerSocialLink} href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
        </div>
      </div>
    </div>
  </div>
</div>


      </div>
    </div>
  );
}

/** ====== STYLES ====== */
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

  /* ===== Part 1 styles ===== */
  topBar: {
    background: "#f3efe7",
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

  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(247,244,239,0.92)",
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

  hero: {
  padding: "64px 0 24px",     // more top breathing room
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


  /* ===== Part 2 placeholder styles (we’ll refine later) ===== */
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



/* ===== Featured Projects (Part 2) ===== */
fpHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 10,
},

fpTitle: { fontSize: 32, fontWeight: 950, letterSpacing: -0.2 },

fpSub: { marginTop: 6, fontSize: 13, opacity: 0.72 },


fpViewAllTop: {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontWeight: 900,
  opacity: 0.75,
  padding: "8px 10px",
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
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 12,
},
chipActive: {
  background: "#f5a524",
  borderColor: "rgba(0,0,0,0.10)",
  boxShadow: "0 10px 20px rgba(245,165,36,0.18)",
},


fpSearchWrap: {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.85)",
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
  gap: 18,
},
fpGridMobile: {
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
},

fpCard: {
  background: "rgba(255,255,255,0.60)",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
},

fpMedia: { position: "relative" },
fpImg: { width: "100%", height: 210, objectFit: "cover", display: "block" },


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
  background: "rgba(255,255,255,0.7)",
  borderRadius: 999,
  padding: "10px 16px",
  fontWeight: 950,
  cursor: "pointer",
},



/* ===== Part 3 (Centered Testimonials + Footer like Figma) ===== */
clientsSection: {
  padding: "80px 0 0",
  background: "#f7f4ef",
},


clientsHead: {
  textAlign: "center",
  marginBottom: 18,
},

clientsTitle: {
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: -0.2,
},

clientsSub: {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.75,
  fontWeight: 700,
},

clientsRow: {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 14,
  alignItems: "stretch",
},


clientCard: {
  background: "#f4f4f4",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 14px 30px rgba(0,0,0,0.10)",
  minHeight: 150,
  display: "flex",
  flexDirection: "column",
},


clientCardTop: {
  display: "flex",
  gap: 10,
  alignItems: "center",
},

clientAvatar: {
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "#f5a524",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  fontSize: 12,
},

clientName: { fontSize: 12, fontWeight: 950, lineHeight: 1.1 },
clientOrg: { fontSize: 11, opacity: 0.65, marginTop: 2, fontWeight: 700 },

clientQuote: {
  marginTop: 10,
  fontSize: 12,
  lineHeight: 1.6,
  opacity: 0.78,
  fontStyle: "normal",     // ✅ remove italic
  flex: 1,                 // ✅ forces equal-height cards
},


footerWrap: {
  marginTop: 28,
  background: "#cfcac2",          // ✅ closer to Figma grey band
  padding: "32px 0 20px",
},


footerTop: {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 40,
  alignItems: "start",
},


footerBrand: {
  maxWidth: 360,
},

footerBrandRow: {
  display: "flex",
  alignItems: "center",
  gap: 10,
},

footerLogoMark: {
  width: 28,
  height: 28,
  borderRadius: 10,
  background: "#f5a524",
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
},

footerBrandText: {
  marginTop: 10,
  fontSize: 12,
  lineHeight: 1.55,
  opacity: 0.7,
  fontWeight: 700,
},

footerCols: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 60,
  justifyContent: "end",
},


footerColTitle: {
  fontSize: 11,
  fontWeight: 950,
  opacity: 0.7,
  marginBottom: 10,
  letterSpacing: 0.6,
},

footerCol: {
  display: "flex",
  flexDirection: "column",
  gap: 8,
},

footerLink: {
  fontSize: 12,
  textDecoration: "none",
  color: "#141414",
  opacity: 0.75,
  fontWeight: 800,
},

footerBottom: {
  marginTop: 26,
  paddingTop: 16,
  borderTop: "1px solid rgba(0,0,0,0.12)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
},


footerCopyright: {
  fontSize: 11,
  opacity: 0.65,
  fontWeight: 800,
},

footerSocial: {
  display: "flex",
  gap: 16,
  alignItems: "center",
},

footerSocialLink: {
  fontSize: 11,
  textDecoration: "none",
  color: "#141414",
  opacity: 0.75,
  fontWeight: 900,
},






};




