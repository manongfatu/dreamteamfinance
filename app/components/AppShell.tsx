"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("pfm:sidebar:collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onRoute = () => setOpen(false);
    // Close on hash/navigation change as a safety
    window.addEventListener("hashchange", onRoute);
    return () => window.removeEventListener("hashchange", onRoute);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("pfm:sidebar:collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <div className="mobile-topbar">
        <button
          className="mobile-nav-button button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <div className="mobile-topbar-brand">Dream Team Finance</div>
      </div>
      <Sidebar
        open={open}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNavigate={() => setOpen(false)}
      />
      {open ? <div className="sidebar-overlay" onClick={() => setOpen(false)} /> : null}
      <main className="main">{children}</main>
    </div>
  );
}

