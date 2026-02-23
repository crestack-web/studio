"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./dashboard/Sidebar";
import Topbar from "./dashboard/Topbar";
import HomePage from "./dashboard/HomePage";
import BusinessServicesPage from "./dashboard/BusinessServicesPage";
import StaffPage from "./dashboard/StaffPage";
import ReferralsPage from "./dashboard/ReferralsPage";
import CapitalPage from "./dashboard/CapitalPage";
import AvatarModal from "./dashboard/AvatarModal";
import AskMOPage from "./dashboard/AskMOPage";
import SalePage from "./dashboard/SalePage";
import "./dashboard/dashboard.css";

// Mobile bottom nav items

const mobileNav = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "sale", label: "Sale", icon: "🛒" },
  { id: "mo", label: "Ask MO", icon: "🤖" },
  { id: "staff", label: "Staff", icon: "👥" },
  { id: "services", label: "Services", icon: "🧰" },
];

const pageTitles: Record<string, string> = {
  home: "Welcome back, Abdullahi 👋",
  sale: "Record a Sale",
  mo: "Ask MO",
  services: "Business Services",
  staff: "Staff Management",
  referrals: "Referral Programme",
  capital: "Access Capital",
};

export default function DashboardPage() {
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [today, setToday] = useState("");
  const [mobileNavId, setMobileNavId] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Responsive: collapse sidebar on mobile, expand on desktop
  useEffect(() => {
    function handleResize() {
      setSidebarCollapsed(window.innerWidth <= 768);
      setIsMobile(window.innerWidth <= 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function nav(id: string) {
    setPage(id);
    setMobileNavId(id);
    setSidebarCollapsed(false);
  }

  function handleMobileNav(id: string) {
    nav(id);
    setMobileNavId(id);
  }

  function openAvatarModal() {
    setAvatarModal(true);
  }
  function closeAvatarModal() {
    setAvatarModal(false);
  }

  return (
    <>
      <div className="app">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed((v) => !v)}
          onNav={nav}
          activePage={page}
          onAvatarClick={openAvatarModal}
        />
        <div className="main">
          <Topbar
            title={pageTitles[page] || "Busmo"}
            date={today}
            onAvatarClick={openAvatarModal}
            onSidebarToggle={() => setSidebarCollapsed((v) => !v)}
          />
          <div className="pg-area">
            {page === "home" && <HomePage onNav={nav} />}
            {page === "sale" && <SalePage />}
            {page === "mo" && (
              <AskMOPage
                onBack={() => nav("home")}
              />
            )}
            {page === "services" && <BusinessServicesPage />}
            {page === "staff" && <StaffPage />}
            {page === "referrals" && <ReferralsPage onNav={nav} />}
            {page === "capital" && <CapitalPage onNav={nav} />}
          </div>
        </div>
      </div>
      {/* Mobile Bottom Nav */}
      <nav className="bot-nav">
        {mobileNav.map((item) =>
          item.id === "mo" ? (
            <button
              key={item.id}
              className={`bn-mo${mobileNavId === item.id ? " act" : ""}`}
              onClick={() => handleMobileNav(item.id)}
            >
              <div className="bn-mo-ic">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          ) : (
            <button
              key={item.id}
              className={`bn-item${mobileNavId === item.id ? " act" : ""}`}
              onClick={() => handleMobileNav(item.id)}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        )}
      </nav>
      {/* Avatar Modal */}
      <AvatarModal open={avatarModal} onClose={closeAvatarModal} />
    </>
  );
}