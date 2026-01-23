import React, { useEffect, useMemo, useState } from "react";
import vizIcon from "../assets/L1.png";
import yt1 from "../assets/yt1.png";     // ✅ your YouTube icon
import vz1 from "../assets/vz1.png";     // ✅ your Vizdom icon
import { useAuth } from "../auth/AuthProvider";
import "../styles/lovable-navbar.css";
import "../styles/testimonials-marquee.css";
import indiaIcon from "../assets/india.png";
import usIcon from "../assets/usa.png";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../components/LandingNavbar.jsx";



const HERO_YOUTUBE_URL = "https://www.youtube.com/watch?v=dumslTDJfQk&feature=youtu.be";

/** ✅ EXACT chip names like your reference */
const categories2 = ["All", "Corporate Offices", "Residential", "Multifamily Apartment", "Retail", "Co-working", "Restaurant"];

/** ====== CONFIG ====== */
const SHEET_ID = "180yy7lM0CCtiAtSr87uEm3lewU-pIdvLMGl6RXBvf8o";
const GID = "0";



/** ====== CSV PARSER (robust) ====== */
function parseCSV(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

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
const norm = (s = "") => String(s).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();

const headerMap = (headers) => {
  const m = {};
  headers.forEach((h, i) => (m[norm(h)] = i));
  return m;
};

const safeGet = (row, idx, fallback = "") =>
  idx != null && idx < row.length && row[idx] != null ? String(row[idx]).trim() : fallback;

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

function formatSqft(n = "") {
  const s = String(n).replace(/,/g, "").trim();
  const val = Number(s);
  if (Number.isFinite(val) && val > 0) return `${val.toLocaleString()} sqft`;
  return n || "";
}

function normalizeServer(v = "") {
  const s = norm(v);
  if (s.includes("us")) return "us";
  if (s.includes("india") || s === "in") return "india";
  return "";
}

function getYouTubeEmbedUrl(url = "") {
  if (!url) return "";
  try {
    const short = url.match(/youtu\.be\/([^?&/]+)/i);
    if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`;
    const watch = url.match(/[?&]v=([^?&]+)/i);
    if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`;
    const embed = url.match(/youtube\.com\/embed\/([^?&/]+)/i);
    if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`;
    return "";
  } catch {
    return "";
  }
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

/** ====== NAVBAR ====== */
// function LandingNavbar({ user, signOut }) {
//   const [open, setOpen] = useState(false);
//   const [dd, setDd] = useState(false);
//   const ddRef = React.useRef(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const onDown = (e) => {
//       if (ddRef.current && !ddRef.current.contains(e.target)) setDd(false);
//     };
//     document.addEventListener("mousedown", onDown);
//     return () => document.removeEventListener("mousedown", onDown);
//   }, []);

//   const scrollTo = (id) => {
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   return (
//     <header className="lv-header">
//       <div className="lv-container">
//         <nav className="lv-nav">
//           <a href="/" className="lv-logo" onClick={(e) => e.preventDefault()}>
//             <img className="lv-logoImg" src={vizIcon} alt="Vizwalk — Powered by Flipspaces" />
//           </a>

//           <div className="lv-links">
//             <a
//               className="lv-link"
//               href="#featured-projects"
//               onClick={(e) => {
//                 e.preventDefault();
//                 scrollTo("featured-projects");
//               }}
//             >
//               Features
//             </a>

//             <a
//               className="lv-link"
//               href="/demo-videos"
//               onClick={(e) => {
//                 e.preventDefault();
//                 window.open("/demo-videos", "_blank", "noopener,noreferrer");
//               }}
//             >
//               Demo Videos
//             </a>



//             <div className="lv-dd" ref={ddRef}>
//               <button type="button" className="lv-link lv-ddBtn" onClick={() => setDd((v) => !v)}>
//                 Projects{" "}
//                 <span
//                   style={{
//                     marginLeft: 6,
//                     display: "inline-block",
//                     transform: dd ? "rotate(180deg)" : "none",
//                     transition: "transform 0.2s",
//                   }}
//                 >
//                   ▾
//                 </span>
//               </button>

//               {dd && (
//                 <div className="lv-ddMenu">
//                   <button
//                     type="button"
//                     className="lv-ddItem"
//                     onClick={() => {
//                       setDd(false);
//                       scrollTo("featured-projects");
//                     }}
//                   >
//                     Showcase Projects
//                   </button>
//                   <a
//                     className="lv-ddItem"
//                     href="/live-projects"
//                     onClick={(e) => {
//                       e.preventDefault();
//                       setDd(false);
//                     }}
//                   >
//                     Live Projects
//                   </a>
//                 </div>
//               )}
//             </div>

//             <a
//               className="lv-link"
//               href="#clients"
//               onClick={(e) => {
//                 e.preventDefault();
//                 scrollTo("clients");
//               }}
//             >
//               Testimonials
//             </a>
//           </div>

//           <div className="lv-actions">
//             <button type="button" className="lv-iconBtn" title="Settings">
//               ⚙
//             </button>
//             <div className="lv-userPill" title={user?.email || ""}>
//               {user?.email || "user"}
//             </div>
//             <button type="button" className="lv-logout" onClick={signOut}>
//               Logout
//             </button>
//           </div>

//           <button className="lv-mobileBtn" type="button" onClick={() => setOpen((v) => !v)}>
//             {open ? "✕" : "☰"}
//           </button>
//         </nav>

//         {open && (
//           <div className="lv-mobileMenu">
//             <a
//               href="#featured-projects"
//               onClick={(e) => {
//                 e.preventDefault();
//                 setOpen(false);
//                 scrollTo("featured-projects");
//               }}
//             >
//               Features
//             </a>
//             <a
//               href="#featured-projects"
//               onClick={(e) => {
//                 e.preventDefault();
//                 setOpen(false);
//                 scrollTo("featured-projects");
//               }}
//             >
//               Demo Videos
//             </a>
//             <button
//               type="button"
//               onClick={() => {
//                 setOpen(false);
//                 scrollTo("featured-projects");
//               }}
//             >
//               Showcase Projects
//             </button>
//             <a
//               href="/live-projects"
//               onClick={(e) => {
//                 e.preventDefault();
//                 setOpen(false);
//               }}
//             >
//               Live Projects
//             </a>
//             <a
//               href="#clients"
//               onClick={(e) => {
//                 e.preventDefault();
//                 setOpen(false);
//                 scrollTo("clients");
//               }}
//             >
//               Testimonials
//             </a>

//             <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setOpen(false);
//                   signOut();
//                 }}
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// }

/** ====== ICON (hover float) ====== */
function HoverIcon({ src, alt, href, title }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 6,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img src={src} alt={alt} style={{ width: 22, height: 22, display: "block" }} />
    </a>
  );
}

/** ====== Featured Card ====== */
function FeaturedCard({ item, onOpenScreenshotGallery, onOpenVizdom, onOpenVizwalk }) {
  const category = item.designStyle || item.industry || "Corporate Offices";
  const serverLabel = item.server === "india" ? "India Server" : item.server === "us" ? "US Server" : "";

  const [hover, setHover] = useState(false);

  return (
    <div style={sx.fpCard}>
      {/* media */}
      <div
        style={sx.fpMedia}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <ImageWithFallback src={item.thumb} alt={item.buildName} style={sx.fpImg} />

        {/* ✅ hover overlay */}
        <div
          style={{
            ...sx.fpHoverOverlay,
            opacity: hover ? 1 : 0,
            pointerEvents: hover ? "auto" : "none",
          }}
        >
          <button
            type="button"
            style={sx.fpHoverBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpenVizwalk();
            }}
          >
            Open Vizwalk
          </button>
        </div>

        {/* server pill */}
        {/* {serverLabel ? <div style={sx.fpServerPill}>{serverLabel}</div> : null} */}
      </div>

      {/* body */}
      <div style={sx.fpBody}>
        <div style={sx.fpName}>{item.buildName || "Project"}</div>

        <div style={sx.fpCatRow}>
          <span style={sx.fpCatPill}>{category}</span>
        </div>

        <div style={sx.fpArea}>Area – {formatSqft(item.areaSqft || "")}</div>

        <div style={sx.fpDivider} />

        <div style={sx.fpRow}>
          <div style={sx.fpLeftIcons}>
            {item.youtube ? (
              <HoverIcon src={yt1} alt="YouTube" href={item.youtube} title="Watch on YouTube" />
            ) : (
              <span style={{ opacity: 0.25, pointerEvents: "none" }}>
                <img src={yt1} alt="YouTube disabled" style={{ width: 22, height: 22 }} />
              </span>
            )}

            <span
              onClick={(e) => {
                e.stopPropagation();
                onOpenVizdom();
              }}
              style={{ display: "inline-flex", cursor: "pointer" }}
              title="Open in Vizdom"
            >
              <img src={vz1} alt="Vizdom" style={{ width: 22, height: 22, display: "block" }} />
            </span>
          </div>

          <button
            type="button"
            style={sx.fpDetail}
            onClick={(e) => {
              e.stopPropagation();
              onOpenScreenshotGallery();
            }}
          >
            View Details <span style={{ marginLeft: 6 }}>→</span>
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
      quote: "Flipspaces was a one-stop solution for our office expansion, using VR technology to perfectly visualize and execute our vision.",
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
      quote: "Flipspaces delivered our project on time with professionalism and excellence. Grateful for their hard work and eager to collaborate again!",
    },
  ];

  const loop = [...testimonials, ...testimonials];

  return (
    <section
      id="clients"
      className="lv-testimonials"
      style={{
        background: "#EAEAE8",
        padding: "90px 0 44px", // ✅ increases top gap

      }}
    >
      <div className="lv-container">
        <div className="lv-testimonialsHead">
          <h2 className="lv-testimonialsTitle">What Our Clients Say</h2>
          <div className="lv-testimonialsDesc">Trusted by leading businesses across industries for exceptional workspace transformations</div>
        </div>

        <div className="lv-marquee">
          <div className="lv-marqueeTrack" style={{ ["--duration"]: "40s", ["--gap"]: "18px" }}>
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

/** ✅ FOOTER (keep your existing sx.footer styles) */
function FooterFullBleed() {
  return (
    <footer style={sx.footerBleed}>
      <div style={sx.container}>
        <div style={sx.footerGrid}>
          <div style={sx.footerBrand}>
            <img src={vizIcon} alt="Vizwalk" style={sx.footerLogoImg} />
            <div style={sx.footerDesc}>
              Next-generation architectural visualization platform. Bring your designs to life with stunning realism.
            </div>
          </div>

          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>PRODUCT</div>
            <a href="#featured-projects" style={sx.footerLink}>
              Features
            </a>
            <a href="#featured-projects" style={{ ...sx.footerLink, opacity: 0.55, pointerEvents: "none" }}>
              Gallery
            </a>
            <a href="#featured-projects" style={{ ...sx.footerLink, opacity: 0.55, pointerEvents: "none" }}>
              Updates
            </a>
          </div>

          <div style={sx.footerCol}>
            <div style={sx.footerColTitle}>RESOURCES</div>
            <a href="/docs" style={sx.footerLink}>
              Documentation
            </a>
            <a href="/shortcuts" style={sx.footerLink}>
              Shortcut Guide
            </a>
          </div>
        </div>

        <div style={sx.footerBottom}>
          <div style={sx.footerCopy}>© 2026 Vizwalk.com All rights reserved.</div>
          <div style={sx.footerSocial}>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" style={sx.footerSocialLink}>
              YouTube
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={sx.footerSocialLink}>
              LinkedIn
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={sx.footerSocialLink}>
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

  const [selectedServer, setSelectedServer] = useState("india");
  const [activeCategory2, setActiveCategory2] = useState("All");
  const [searchQuery2, setSearchQuery2] = useState("");
  const [showAll2, setShowAll2] = useState(false);

  const [showLocbar, setShowLocbar] = useState(true);
  const handleContinue = () => setShowLocbar(false);

  useEffect(() => {
    setActiveCategory2("All");
    setSearchQuery2("");
    setShowAll2(false);
  }, [selectedServer]);

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
              server,
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

const handleOpenVizwalk = (item) => {
  if (!item) return;

  const bust = Date.now();
  const projectLabel = item.projectName || item.buildName || "project";

  const sessionId = `${projectLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  const id = projectLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const params = new URLSearchParams({
    project: id,
    s: String(bust),
    session: sessionId,
    build: item.buildName || item.projectName || "Build",
    ver: item.buildVersion || "",
  });

  window.open(`/experience?${params.toString()}`, "_blank", "noopener,noreferrer");
};




  /** ✅ filter logic: map your chip text to your sheet values */
  const filtered = useMemo(() => {
    const q = norm(searchQuery2);

    return items.filter((it) => {
      if (selectedServer && it.server && it.server !== selectedServer) return false;
      if (selectedServer && !it.server) return false;

      if (activeCategory2 !== "All") {
        const hay = norm(`${it.designStyle || ""} ${it.industry || ""}`);

        // ✅ chip label → matching keywords
        const key =
          activeCategory2 === "Corporate Offices"
            ? "corporate"
            : activeCategory2 === "Multifamily Apartment"
            ? "multifamily"
            : activeCategory2 === "Co-working"
            ? "co-working"
            : norm(activeCategory2);

        if (!hay.includes(key)) return false;
      }

      if (!q) return true;
      const big = `${it.projectName} ${it.buildName} ${it.buildVersion} ${it.areaSqft} ${it.industry} ${it.designStyle} ${it.sbu}`;
      return norm(big).includes(q);
    });
  }, [items, selectedServer, activeCategory2, searchQuery2]);

  /** ✅ View Detail -> ScreenshotGallery.jsx (your /gallery route) */
  const handleOpenScreenshotGallery = (item) => {
    const params = new URLSearchParams({
      build: item.buildName || item.projectName || "Build",
      ver: item.buildVersion || "",
    });
    window.open(`/gallery?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  /** ✅ vz1 -> open Vizdom (update base URL if needed) */
  const handleOpenVizdom = (item) => {
    const id = item.vizdomId || item.projectSlotId || item.projectName || item.buildName || "";
    if (!id) return;

    // IMPORTANT: change this if your Vizdom URL is different
    const url = `https://vizdom.flipspaces.app/user/project/${encodeURIComponent(id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div style={{ ...sx.page, padding: 24 }}>Loading…</div>;

  return (
    <div style={sx.page}>
      {/* Top announcement bar */}
      {showLocbar && (
        <div className="lv-locbar">
          <div className="lv-container">
            <div className="lv-locbarInner">
              <div className="lv-locbarText">Choose another country or region to see content specific to your location</div>

              <div className="lv-locbarRight">
                <div className="lv-togglePills">
                  <button
  type="button"
  className={`lv-pill ${selectedServer === "india" ? "lv-pillActive" : ""}`}
  onClick={() => setSelectedServer("india")}
>
  <img src={indiaIcon} alt="" className="lv-pillImg" />
  <span>India</span>
                  </button>

                  <button
                    type="button"
                    className={`lv-pill ${selectedServer === "us" ? "lv-pillActive" : ""}`}
                    onClick={() => setSelectedServer("us")}
                  >
                    <img src={usIcon} alt="" className="lv-pillImg" />
                    <span>US</span>
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

      <LandingNavbar user={user} signOut={signOut} />

      {/* Hero */}
      <div className="lv-container">
        <section className="lv-hero">
          <div className="lv-heroLeft">
            <div className="lv-heroTitle">
              Bring Your Spaces <br />
              <span className="lv-heroAccent">To Life</span>
            </div>

            <div className="lv-heroDesc">
              Interactive virtual walkthrough offering clients an immersive experience with real-time design modifications using Flipspaces&apos;
              integrated product library
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
            <div className="lv-heroCard" style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", width: "100%", height: 320, overflow: "hidden", borderRadius: 18 }}>
                <iframe
                  src={getYouTubeEmbedUrl(HERO_YOUTUBE_URL)}
                  title="Vizwalk demo"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "110%",
                    height: "100%",
                    border: 0,
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Featured Projects */}
      <section
  id="featured-projects"
  style={{
    background: "#FFFFFF",
    padding: "56px 0 80px", // ✅ more bottom gap
  }}
>

        <div style={sx.container}>
          <div style={sx.fpHeader}>
            <div style={sx.fpHeaderLeft}>
              <div style={sx.fpTitleRow}>
                <div style={sx.fpTitle}>Featured Projects</div>

                {/* ✅ badge aligned with title */}
                <div style={sx.serverBadge}>
                  <img
                    src={selectedServer === "india" ? indiaIcon : usIcon}
                    alt=""
                    style={sx.serverBadgeIcon}
                  />
                  <span style={sx.serverBadgeText}>
                    {selectedServer === "india" ? "India Server" : "US Server"}
                  </span>
                </div>
              </div>

              <div style={sx.fpSub}>
                Explore our projects showcasing tech-enabled interior design expertise
              </div>
            </div>
          </div>



          {/* ✅ one line: chips + search */}
          <div style={sx.fpControls}>
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
                  // ✅ removes the “focus ring/border” that you’re seeing
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={sx.fpSearchWrap}>
              <span style={sx.fpSearchIcon}>🔍</span>
              <input
                value={searchQuery2}
                onChange={(e) => setSearchQuery2(e.target.value)}
                placeholder="Search Projects.."
                style={sx.fpSearchInput}
              />
            </div>
          </div>

          <div style={sx.fpGrid}>
            {(showAll2 ? filtered : filtered.slice(0, 6)).map((item, idx) => (
             <FeaturedCard
  key={`${item.buildName || "p"}-${item.buildVersion || ""}-${idx}`}
  item={item}
  onOpenScreenshotGallery={() => handleOpenScreenshotGallery(item)}
  onOpenVizdom={() => handleOpenVizdom(item)}
  onOpenVizwalk={() => handleOpenVizwalk(item)}   // ✅ THIS
/>


            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", opacity: 0.75, fontWeight: 700 }}>No projects found matching your criteria.</div>
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

      <TestimonialsOnly />
      <FooterFullBleed />
    </div>
  );
}

/** ====== STYLES (CLEAN: no duplicates) ====== */
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

  fpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 10,
  },

  fpTitle: {
    fontSize: 44,
    fontWeight: 900,
    letterSpacing: -0.6,
    fontFamily: "var(--font-heading)",
  },

  fpSub: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 1.6,
    opacity: 0.72,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
  },

  /** ✅ one line layout */
  fpControls: {
    marginTop: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "nowrap",
  },

  /** ✅ NO SCROLL BAR */
  fpChips: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "nowrap",
    overflow: "visible",
    minWidth: 0,
  },

  /** ✅ chip: light/regular + subtle border like search (#EAEAE8) */
  chip: {
    height: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #EAEAE8",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 400,
    fontSize: 12,
    color: "#111",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",

    // ✅ kill focus outline/ring that looks like a border
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent",
  },

  /** ✅ active is YELLOW (your ask) and no border ring */
  chipActive: {
    background: "#FFC702",
    color: "#111",
    fontWeight: 500,
    borderColor: "transparent",
    outline: "none",
    boxShadow: "none",
  },

  fpSearchWrap: {
    height: 34,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid #EAEAE8",
    borderRadius: 999,
    padding: "0 14px",
    width: 260,
    flex: "0 0 auto",
  },

  fpSearchIcon: {
    opacity: 0.65,
    fontSize: 14,
  },

  fpSearchInput: {
    border: "none",
    outline: "none",
    boxShadow: "none",
    background: "transparent",
    fontSize: 13,
    width: "100%",
    fontFamily: "var(--font-sans)",
  },

  fpGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },

  /** ✅ Card (slightly taller) + card base color */
  fpCard: {
    background: "#F1F0EA",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
  },

  fpMedia: {
    position: "relative",
    cursor: "pointer",
  },

  /** ✅ bigger height */
  fpImg: {
    width: "100%",
    height: 255,
    objectFit: "cover",
    display: "block",
  },

  /** ✅ server pill like your screenshot */
  fpServerPill: {
    position: "absolute",
    right: 14,
    bottom: 12,
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    fontFamily: "var(--font-sans)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  },

  fpBody: {
    padding: 14,
    background: "#F1F0EA",
  },

  fpName: {
    fontSize: 20,
    fontWeight: 900,
    fontFamily: "var(--font-heading)",
  },

  /** ✅ tag like your Image3 */
  fpCatRow: { marginTop: 8 },

  fpCatPill: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    background: "rgba(255,199,2,0.22)",
    color: "#a56100",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "var(--font-sans)",
  },

  fpArea: {
    marginTop: 8,
    fontSize: 13,
    opacity: 0.75,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
  },

  fpDivider: {
    marginTop: 12,
    height: 1,
    background: "rgba(0,0,0,0.08)",
  },

  fpRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  fpLeftIcons: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  fpDetail: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 650,
    opacity: 0.8,
    fontFamily: "var(--font-sans)",
  },

  fpBottom: { display: "flex", justifyContent: "center", padding: "18px 0 0" },

  fpViewAllBottom: {
    border: "1px solid rgba(0,0,0,0.14)",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },

  /* Footer */
  footerBleed: {
    width: "100%",
    background: "#d0d0cc",
    padding: "42px 0 22px",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.7fr 0.7fr",
    gap: 80,
    alignItems: "start",
  },
  footerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 10,
    paddingLeft: 0,
    marginLeft: 0,
  },
  footerLogoImg: {
    display: "block",
    height: 44,
    width: "auto",
    margin: 0,
    padding: 0,
    objectFit: "contain",
  },
  footerDesc: {
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 1.55,
    color: "rgba(0,0,0,0.72)",
    fontWeight: 600,
  },
  footerCol: { paddingTop: 6 },
  footerColTitle: {
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "rgba(0,0,0,0.60)",
    marginBottom: 14,
  },
  footerLink: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(0,0,0,0.70)",
    marginBottom: 10,
    textDecoration: "none",
  },
  footerBottom: {
    marginTop: 28,
    paddingTop: 16,
    borderTop: "1px solid rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  footerCopy: {
    fontSize: 12,
    color: "rgba(0,0,0,0.65)",
    fontWeight: 600,
  },
  footerSocial: { display: "flex", gap: 22, alignItems: "center" },
  footerSocialLink: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(0,0,0,0.60)",
    textDecoration: "none",
  },
  fpMedia: {
  position: "relative",
  cursor: "pointer",
},

fpHoverOverlay: {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "rgba(0,0,0,0.18)",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 0.18s ease",
  borderRadius: 0, // image already clipped by card overflow
},

fpHoverBtn: {
  height: 40,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.65)",
  background: "#FFC702",
  color: "#111",
  fontWeight: 800,
  cursor: "pointer",
},

fpHoverBtnGhost: {
  height: 40,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.65)",
  background: "rgba(255,255,255,0.18)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
},
fpHeader: {
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  marginBottom: 10,
},

fpHeaderLeft: {
  width: "100%",
},

fpTitleRow: {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap", // allows clean wrap on small screens
},

serverBadge: {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 14px",
  borderRadius: 999,
  background: "#FFE39A",
  color: "#111",
  fontWeight: 800,
  fontSize: 14,
  boxShadow: "0 10px 24px rgba(245,165,36,0.22)",
  whiteSpace: "nowrap",
  height: 36,
},

serverBadgeIcon: {
  width: 18,
  height: 18,
  objectFit: "contain",
  display: "block",
},

serverBadgeText: {
  fontFamily: "var(--font-sans)",
},


};
