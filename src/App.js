import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";

import Landing from "./pages/Landing";
import ScreenshotGallery from "./pages/ScreenshotGallery";
import Login from "./pages/Login";
import DemoVideos from "./pages/DemoVideos.jsx";
import Learn from "./pages/Learn.jsx";
import Showcase from "./pages/Showcase.jsx";
import LiveProjects from "./pages/LiveProjects.jsx"; // ✅ ADD THIS

const Experience = lazy(() => import("./pages/Experience"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <Landing />
              </RequireAuth>
            }
          />

          {/* ✅ Showcase page */}
          <Route
            path="/showcase"
            element={
              <RequireAuth>
                <Showcase />
              </RequireAuth>
            }
          />

          {/* ✅ Live Projects page */}
          <Route
            path="/live-projects"
            element={
              <RequireAuth>
                <LiveProjects />
              </RequireAuth>
            }
          />

          <Route
            path="/experience"
            element={
              <RequireAuth>
                <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
                  <Experience />
                </Suspense>
              </RequireAuth>
            }
          />

          <Route
            path="/gallery"
            element={
              <RequireAuth>
                <ScreenshotGallery />
              </RequireAuth>
            }
          />

          <Route path="/demo-videos" element={<DemoVideos />} />
          <Route path="/learn" element={<Learn />} />

          {/* ✅ Important */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
