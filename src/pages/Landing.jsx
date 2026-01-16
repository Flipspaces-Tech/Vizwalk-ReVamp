import React, { useEffect, useMemo, useState } from "react";
import vizIcon from "../assets/vizdom.png";
import { useAuth } from "../auth/AuthProvider";
import "../styles/lovable-navbar.css";
import "../styles/testimonials-marquee.css";



const categories2 = [
  "All",
  "Corporate Design",
  "Modern Office",
  "Executive Suite",
  "Meeting Spaces",
  "Retail",
  "Hospitality",
  "Residential",
];






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

function LandingNavbar({ user, signOut }) {
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const ddRef = React.useRef(null);

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
            <a className="lv-link" href="#featured-projects" onClick={(e) => { e.preventDefault(); scrollTo("featured-projects"); }}>
              Features
            </a>
            <a className="lv-link" href="#featured-projects" onClick={(e) => { e.preventDefault(); scrollTo("featured-projects"); }}>
              Demo Videos
            </a>

            {/* Projects dropdown */}
            <div className="lv-dd" ref={ddRef}>
              <button
                type="button"
                className="lv-link lv-ddBtn"
                onClick={() => setDd((v) => !v)}
              >
                Projects <span style={{ marginLeft: 6, display: "inline-block", transform: dd ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </button>

              {dd && (
                <div className="lv-ddMenu">
                  <button type="button" className="lv-ddItem" onClick={() => { setDd(false); scrollTo("featured-projects"); }}>
                    Showcase Projects
                  </button>
                  <a className="lv-ddItem" href="/live-projects" onClick={(e) => { e.preventDefault(); setDd(false); }}>
                    Live Projects
                  </a>
                </div>
              )}
            </div>

            <a className="lv-link" href="#clients" onClick={(e) => { e.preventDefault(); scrollTo("clients"); }}>
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
          <button className="lv-mobileBtn" type="button" onClick={() => setOpen((v) => !v)}>
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
              <button type="button" onClick={() => { setOpen(false); signOut(); }}>Logout</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
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

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function TestimonialsOnly() {
  const testimonials = [
    {
      name: "Santosh Upadhyay",
      role: "BHIL (Bharat financial bank)",
      quote:
        "Our new workspace embodies innovation, creativity, and forward-thinking. Huge thanks to Flipspaces for their expertise, dedication, and swift transformation!",
    },
    {
      name: "Vivek Khemani",
      role: "Quantiphi",
      quote:
        "Flipspaces was a one-stop solution for our office expansion, using VR technology to perfectly visualize and execute our vision.",
    },
    {
      name: "Pankaj Tripathi",
      role: "B/S/H",
      quote:
        "Flipspaces designed our Mumbai, Hyderabad, Chennai, and Bangalore offices with open spaces, natural light, and a vibrant, modern work environment.",
    },
    {
      name: "Kunal Shah",
      role: "Honest",
      quote:
        "Flipspaces transformed my restaurant with creativity, precision, and exceptional craftsmanship. Special thanks to Richard for seamless communication and prompt support!",
    },
    {
      name: "Vishal Soni",
      role: "Tacza",
      quote:
        "Flipspaces delivered our project on time with professionalism and excellence. Grateful for their hard work and eager to collaborate again!",
    },
  ];

  // Render twice for seamless loop
  const loop = [...testimonials, ...testimonials];

  return (
    <section id="clients" className="lv-testimonials">
      <div className="lv-container">
        <div className="lv-testimonialsHead">
          <h2 className="lv-testimonialsTitle">What Our Clients Say</h2>
          <div className="lv-testimonialsDesc">
            Trusted by leading businesses across industries for exceptional workspace transformations
          </div>
        </div>

        <div className="lv-marquee">
          <div
            className="lv-marqueeTrack"
            style={{ ["--duration"]: "40s", ["--gap"]: "18px" }}
          >
            {loop.map((t, idx) => (
              <div className="lv-tCard" key={idx}>
                <div className="lv-tTop">
                  <div className="lv-tAvatar">{getInitials(t.name)}</div>
                  <div>
                    <div className="lv-tName">{t.name}</div>
                    <div className="lv-tRole">{t.role}</div>
                  </div>
                </div>
                <div className="lv-tQuote">“{t.quote}”</div>
              </div>
            ))}
          </div>

          <div className="lv-marqueeFadeLeft" />
          <div className="lv-marqueeFadeRight" />
        </div>
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

    // ✅ Part 2 state (MUST be inside component)
  const [activeCategory2, setActiveCategory2] = useState("All");
  const [searchQuery2, setSearchQuery2] = useState("");
  const [showAll2, setShowAll2] = useState(false);

  // top of Landing()
const [showLocbar, setShowLocbar] = useState(true);

const handleContinue = () => {
  setShowLocbar(false);
};


// const handleContinue = () => {
//   localStorage.setItem("vw_locbar_hidden", "1");
//   setShowLocbar(false);
// };


  useEffect(() => {
    setActiveCategory2("All");
    setSearchQuery2("");
    setShowAll2(false);
  }, [selectedServer]);


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
    const q = norm(searchQuery2);

    return items.filter((it) => {
      // ✅ server filter (IMPORTANT)
      if (selectedServer && it.server && it.server !== selectedServer) return false;
      if (selectedServer && !it.server) return false;

      // ✅ category filter
      if (activeCategory2 !== "All") {
        const cat = norm(`${it.designStyle || ""} ${it.industry || ""}`);
        if (!cat.includes(norm(activeCategory2))) return false;
      }

      // ✅ search filter
      if (!q) return true;
      const hay = `${it.projectName} ${it.buildName} ${it.buildVersion} ${it.areaSqft} ${it.industry} ${it.designStyle} ${it.sbu}`;
      return norm(hay).includes(q);
    });
  }, [items, selectedServer, activeCategory2, searchQuery2]);


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
      {showLocbar && (
  <div className="lv-locbar">
    <div className="lv-container">
      <div className="lv-locbarInner">
        <div className="lv-locbarText">
          Choose another country or region to see content specific to your location
        </div>

        <div className="lv-locbarRight">
  <div className="lv-togglePills">
    <button
      type="button"
      className={`lv-pill ${selectedServer === "india" ? "lv-pillActive" : ""}`}
      onClick={() => setSelectedServer("india")}
    >
      🇮🇳 <span>India</span>
    </button>

    <button
      type="button"
      className={`lv-pill ${selectedServer === "us" ? "lv-pillActive" : ""}`}
      onClick={() => setSelectedServer("us")}
    >
      🇺🇸 <span>US</span>
    </button>
  </div>

  <button type="button" className="lv-continue" onClick={handleContinue}>
    Continue
  </button>
</div>

      </div>
    </div>
  </div>
)}



      

      {/* Navbar */}
      <LandingNavbar user={user} signOut={signOut} />

      

      {/* Hero */}
      <div className="lv-container">
  <section className="lv-hero">
    <div className="lv-heroLeft">
      <div className="lv-heroTitle">
        Bring Spaces <br />
        <span className="lv-heroAccent">To Life</span>
      </div>

      <div className="lv-heroDesc">
        Interactive virtual walkthrough offering clients an immersive experience with real-time design modifications using
        Flipspaces&apos; integrated product library
      </div>

      <div className="lv-heroBtns">
        <button
          type="button"
          className="lv-btnPrimary"
          onClick={() => document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })}
        >
          ▶ Watch Demo
        </button>

        <button
          type="button"
          className="lv-btnSecondary"
          onClick={() => document.getElementById("featured-projects")?.scrollIntoView({ behavior: "smooth" })}
        >
          Explore Platform
        </button>
      </div>
    </div>

    <div className="lv-heroRight">
      <div className="lv-heroCard">
        <ImageWithFallback
          src={heroItem?.thumb}
          alt="Hero preview"
          style={{ width: "100%", height: "320px", objectFit: "cover", display: "block" }}
        />
      </div>
    </div>
  </section>
</div>


{/* ===== PART 2: Featured Projects ===== */}
<section id="featured-projects" style={{ padding: "32px 0 18px" }}>
  <div style={sx.container}>
    <div style={sx.fpHeader}>
      <div>
        <div style={sx.fpTitle}>Featured Projects</div>
        <div style={sx.fpSub}>Explore our premium architectural visualizations and immersive 3D walkthroughs</div>
      </div>

      {filtered.length > 6 && (
        <button type="button" style={sx.fpViewAllTop} onClick={() => setShowAll2((v) => !v)}>
          {showAll2 ? "Show Less" : "View All Projects"} →
        </button>
      )}
    </div>

    <div style={sx.fpControls}>
      {/* categories */}
      <div style={sx.fpChips}>
        {categories2.map((c) => (
          <button
            key={c}
            type="button"
            style={{ ...sx.chip, ...(activeCategory2 === c ? sx.chipActive : {}) }}
            onClick={() => {
              setActiveCategory2(c);
              setShowAll2(false);
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* search */}
      <div style={sx.fpSearchWrap}>
        <span style={sx.fpSearchIcon}>🔎</span>
        <input
          value={searchQuery2}
          onChange={(e) => setSearchQuery2(e.target.value)}
          placeholder="Search projects..."
          style={sx.fpSearchInput}
        />
      </div>
    </div>

    <div style={sx.fpGrid}>
      {(showAll2 ? filtered : filtered.slice(0, 6)).map((item, idx) => (
        <FeaturedCard
          key={`${item.buildName || "p"}-${item.buildVersion || ""}-${idx}`}
          item={item}
          onOpenGallery={() => handleOpenGallery(item)}
          onOpenVizwalk={() => handleOpenVizwalk(item)}
        />
      ))}
    </div>

    {filtered.length === 0 && (
      <div style={{ textAlign: "center", padding: "24px 0", opacity: 0.75, fontWeight: 700 }}>
        No projects found matching your criteria.
      </div>
    )}

    {!showAll2 && filtered.length > 6 && (
      <div style={sx.fpBottom}>
        <button type="button" style={sx.fpViewAllBottom} onClick={() => setShowAll2(true)}>
          View All Projects →
        </button>
      </div>
    )}
  </div>
</section>



      {/* ===== PART 3: Testimonials ===== */}
<TestimonialsOnly />

{/* ===== FOOTER (full width) ===== */}
<FooterFullBleed />

    </div>
  );
}

/** ====== STYLES ====== */
const sx = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#141414",
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
  },

  /* Navbar */
  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-heading)",
  },
  brandName: {
    fontWeight: 950,
    letterSpacing: 0.2,
    lineHeight: 1.1,
    fontFamily: "var(--font-heading)",
  },
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
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
  },
  logoutMini: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
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
    fontWeight: 800,
    lineHeight: 1.02,
    letterSpacing: -0.8,
    fontFamily: "var(--font-heading)",
  },
  heroAccent: { color: "#f5a524" },
  heroDesc: {
    marginTop: 18,
    fontSize: 14,
    opacity: 0.75,
    maxWidth: 480,
    lineHeight: 1.7,
    fontFamily: "var(--font-sans)",
  },
  heroButtons: { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" },
  heroPrimary: {
    background: "#f5a524",
    border: "1px solid rgba(0,0,0,0.10)",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    boxShadow: "var(--shadow-yellow)",
  },
  heroSecondary: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.18)",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  heroRight: { display: "flex", justifyContent: "flex-end" },
  heroImageCard: {
    width: "min(620px, 100%)",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.07)",
    background: "#fff",
    boxShadow: "var(--shadow-yellow)",
  },
  heroImg: {
    width: "100%",
    height: 320,
    objectFit: "cover",
    display: "block",
  },

  /* Featured Projects */
  fpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  fpTitle: { fontSize: 26, fontWeight: 800, fontFamily: "var(--font-heading)" },
  fpSub: { marginTop: 6, fontSize: 13, opacity: 0.72, fontFamily: "var(--font-sans)" },

  fpViewAllTop: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    opacity: 0.75,
    fontFamily: "var(--font-sans)",
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
    fontWeight: 700,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
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
    fontFamily: "var(--font-sans)",
  },
  fpSearchIcon: { opacity: 0.7, fontSize: 12 },
  fpSearchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 12,
    flex: 1,
    fontFamily: "var(--font-sans)",
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
    boxShadow: "var(--shadow-card)",
    fontFamily: "var(--font-sans)",
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
    fontWeight: 700,
    fontFamily: "var(--font-sans)",
  },

  fpBody: { padding: 12 },
  fpCatPill: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 6,
    background: "rgba(245,165,36,0.18)",
    color: "#a56100",
    fontSize: 11,
    fontWeight: 800,
    fontFamily: "var(--font-sans)",
  },
  fpName: { marginTop: 8, fontSize: 14, fontWeight: 800, fontFamily: "var(--font-heading)" },
  fpArea: { marginTop: 6, fontSize: 12, opacity: 0.75, fontFamily: "var(--font-sans)" },

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
    fontWeight: 800,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
  },
  fpDetail: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.75,
    fontFamily: "var(--font-sans)",
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
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },

  /* Part 3 */
  part3Wrap: { padding: "38px 0 16px", fontFamily: "var(--font-sans)" },
  part3Title: { textAlign: "center", fontSize: 28, fontWeight: 800, fontFamily: "var(--font-heading)" },
  part3Sub: { textAlign: "center", marginTop: 8, fontSize: 13, opacity: 0.72, fontWeight: 600 },

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
    fontWeight: 800,
    fontSize: 12,
    fontFamily: "var(--font-heading)",
  },
  part3Name: { fontWeight: 800, fontSize: 12, fontFamily: "var(--font-heading)" },
  part3Role: { marginTop: 2, fontSize: 11, opacity: 0.7, fontWeight: 600 },
  part3Quote: { marginTop: 10, fontSize: 11.5, opacity: 0.82, lineHeight: 1.55, fontStyle: "italic" },

  /* Footer */
  footerBleed: {
    width: "100%",
    background: "rgba(0,0,0,0.14)",
    borderTop: "1px solid rgba(0,0,0,0.10)",
    marginTop: 10,
    padding: "22px 0 14px",
    fontFamily: "var(--font-sans)",
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
    fontWeight: 800,
    flex: "0 0 auto",
    fontFamily: "var(--font-heading)",
  },
  footerBrandName: { fontWeight: 800, fontSize: 14, lineHeight: 1.1, fontFamily: "var(--font-heading)" },
  footerBrandSub: {
    marginTop: 6,
    maxWidth: 420,
    opacity: 0.78,
    fontSize: 12,
    lineHeight: 1.55,
    fontWeight: 600,
  },
  footerCol: { paddingTop: 4 },
  footerColTitle: {
    fontWeight: 800,
    fontSize: 11,
    opacity: 0.75,
    marginBottom: 10,
    letterSpacing: 0.3,
    fontFamily: "var(--font-sans)",
  },
  footerLink: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.82,
    marginBottom: 10,
    textDecoration: "none",
    color: "#141414",
    fontFamily: "var(--font-sans)",
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
    fontWeight: 700,
  },
  footerSocial: { display: "flex", gap: 18, alignItems: "center" },
  footerSocialLink: {
    textDecoration: "none",
    color: "#141414",
    fontWeight: 700,
    opacity: 0.85,
    fontFamily: "var(--font-sans)",
  },

  /* Unchanged */
  fpServerPill: undefined,
};

