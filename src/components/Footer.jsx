import React from "react";
import "../styles/footer.css";

import vizIcon from "../assets/L1.png";
import flipspacesLogo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="vwFooter">
      <div className="vwFooterContainer">
        {/* Top */}
        <div className="vwFooterTop">
          {/* Divider (full height) */}
          <div className="vwFooterDivider" aria-hidden="true" />

          {/* Left brand */}
          <div className="vwFooterBrand">
            <img className="vwFooterVizLogo" src={vizIcon} alt="Vizwalk" />

            <div className="vwFooterDesc">
              Next-generation architectural visualization platform. Brings your designs to life with
              stunning realism.
            </div>
          </div>

          {/* ✅ RIGHT SIDE AS ONE BLOCK */}
          <div className="vwFooterRightBlock">
            <div className="vwFooterCol">
              <div className="vwFooterColTitle">PRODUCT</div>
              <a className="vwFooterLink" href="/features">Features</a>
              <a className="vwFooterLink" href="/gallery">Gallery</a>
              <a className="vwFooterLink" href="/updates">Updates</a>
            </div>

            <div className="vwFooterCol">
              <div className="vwFooterColTitle">RESOURCES</div>
              <a className="vwFooterLink" href="/docs">Documentation</a>
              <a className="vwFooterLink" href="/shortcuts">Shortcut Guide</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="vwFooterBottom">
          <div className="vwFooterBottomLeft" />
          <div className="vwFooterCopy">©2026 Flipspaces. All Rights Reserved.</div>

          {/* <div className="vwFooterRightBrand">
            <img className="vwFooterFlipLogo" src={flipspacesLogo} alt="Flipspaces" />
          </div> */}
        </div>
      </div>
    </footer>
  );
}
