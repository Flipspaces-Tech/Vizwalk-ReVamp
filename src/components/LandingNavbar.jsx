import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import vizIcon from "../assets/vw1.png";
import vIcon from "../assets/Viz logo_01_w.png";
import "../styles/navbar-v2.css";

export default function LandingNavbar({
  user,
  signOut,
  selectedServer = "india",
  setSelectedServer,
}) {
  const [dd, setDd] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const ddRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onDown = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDd(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ✅ active link logic
  const pathname = location.pathname || "/";
  const hash = location.hash || "";

  const isHomeActive =
    pathname === "/" && (hash === "" || hash === "#featured-projects");

  const isProjectsActive =
    pathname === "/live-projects" ||
    (pathname === "/" && hash === "#featured-projects");

  const isLearnActive = pathname.startsWith("/learn");

  const isDemoActive = pathname.startsWith("/demo-videos");

  const goOrScroll = (id) => {
    const el = document.getElementById(id);
    if (el) return el.scrollIntoView({ behavior: "smooth" });

    // go to landing with hash
    navigate(`/#${id}`);
  };

  const goTo = (path) => {
    // keep SPA navigation for active state
    navigate(path);
  };

  return (
    <>
      <div className="vwNavWrap">
        {/* Yellow info bar */}
        {showTopBar && (
          <div className="vwTopBar">
            <div className="vwContainer vwTopBarInner">
              <div className="vwTopBarText">
                Make Sure Choose the region closest to you for a seamless experience
              </div>
              <button
                type="button"
                className="vwTopBarClose"
                onClick={() => setShowTopBar(false)}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Dark navbar */}
        <div className="vwNav">
          <div className="vwContainer vwNavInner">
            {/* Left: Logo Area */}
            <a
              className="vwLogoGroup"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              <img className="vwLogoIcon" src={vizIcon} alt="Vizwalk Logo" />
              <div className="vwLogoDivider"></div>
              <img className="vwIcon" src={vIcon} alt="Vizwalk Logo" />
            </a>

            {/* Center: Links */}
            <div className="vwNavLinks">
              <button
                className={`vwNavLink ${isHomeActive ? "isActive" : ""}`}
                onClick={() => {
                  // HOME should go to landing top (no hash)
                  navigate("/");
                }}
              >
                HOME
              </button>

              <div className="vwDd" ref={ddRef}>
                <button
                  className={`vwNavLink ${isProjectsActive ? "isActive" : ""}`}
                  onClick={() => setDd((v) => !v)}
                >
                  PROJECTS ▾
                </button>

                {dd && (
                  <div className="vwDdMenu">
                    <button
                      className="vwDdItem"
                      onClick={() => {
                        setDd(false);
                        goOrScroll("featured-projects");
                      }}
                    >
                      Showcase Projects
                    </button>

                    <button
                      className="vwDdItem"
                      onClick={() => {
                        setDd(false);
                        goTo("/live-projects");
                      }}
                    >
                      Live Projects
                    </button>
                  </div>
                )}
              </div>

              <button
                className={`vwNavLink ${isLearnActive ? "isActive" : ""}`}
                onClick={() => goTo("/learn")}
              >
                LEARN
              </button>

              <button
                className={`vwNavLink ${isDemoActive ? "isActive" : ""}`}
                onClick={() => goTo("/demo-videos")}
              >
                DEMO VIDEOS
              </button>
            </div>

            {/* Right: Controls */}
            <div className="vwNavRight">
              <div className="vwRegionContainer">
                <button
                  className={`vwRegionBtn ${
                    selectedServer === "india" ? "active" : ""
                  }`}
                  onClick={() => setSelectedServer?.("india")}
                >
                  <img
                    src="https://flagcdn.com/w40/in.png"
                    alt="IN"
                    className="vwFlagIcon"
                  />
                  IN
                </button>

                <button
                  className={`vwRegionBtn ${selectedServer === "us" ? "active" : ""}`}
                  onClick={() => setSelectedServer?.("us")}
                >
                  <img
                    src="https://flagcdn.com/w40/us.png"
                    alt="US"
                    className="vwFlagIcon"
                  />
                  US
                </button>
              </div>

              <button className="vwIconBtn" title="Theme Settings">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </button>

              <button
                className="vwIconBtn"
                title={user?.email || "Logout"}
                onClick={signOut}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="vwHeaderSpacer"
        style={{ height: showTopBar ? "124px" : "76px" }}
      />
    </>
  );
}
