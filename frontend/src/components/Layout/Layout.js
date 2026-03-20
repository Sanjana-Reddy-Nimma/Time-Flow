import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePomodoro } from "../../context/PomodoroContext";
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  BarChart3,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Timer,
  Search,
  Settings2,
} from "lucide-react";
import SearchModal from "../Search/SearchModal";
import "./Layout.css";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/add-task", icon: PlusCircle, label: "Add Task" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/pomodoro", icon: Timer, label: "Pomodoro" },
  { to: "/settings", icon: Settings2, label: "Settings" },
];

function PomodoroRunningBadge() {
  const { running, minutes, seconds, mode } = usePomodoro();
  if (!running) return null;
  const colors = {
    work: "var(--mauve)",
    shortBreak: "var(--green)",
    longBreak: "var(--blue)",
  };
  return (
    <div className="pomo-sidebar-badge" style={{ "--pc": colors[mode] }}>
      <span className="pomo-dot" />
      <span className="pomo-sidebar-time">
        {minutes}:{seconds}
      </span>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">⬡</div>
            <span className="logo-text">TaskFlow</span>
          </div>
        </div>

        <div className="sidebar-search">
          <button
            className="sidebar-search-btn"
            onClick={() => {
              setSearchOpen(true);
              setSidebarOpen(false);
            }}
          >
            <Search size={15} />
            <span>Search tasks...</span>
            <kbd className="sidebar-kbd">⌘K</kbd>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === "/pomodoro" && <PomodoroRunningBadge />}
              <ChevronRight size={14} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="logo mobile-logo">
            <div className="logo-icon">⬡</div>
            <span className="logo-text">TaskFlow</span>
          </div>
          <button
            className="topbar-search-btn"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
          </button>
          <div className="user-avatar-sm">{initials}</div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
