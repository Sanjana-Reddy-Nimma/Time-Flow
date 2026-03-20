import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { authAPI, tasksAPI } from "../../utils/api";
import toast from "react-hot-toast";
import {
  User,
  Lock,
  Timer,
  Bell,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import "./Settings.css";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="settings-section card">
      <div className="settings-section-header">
        <Icon size={17} className="text-mauve" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user, updatePreferences } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const [profile, setProfile] = useState({ name: user?.name || "" });
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [prefs, setPrefs] = useState({
    pomodoroLength: user?.preferences?.pomodoroLength ?? 25,
    shortBreak: user?.preferences?.shortBreak ?? 5,
    longBreak: user?.preferences?.longBreak ?? 15,
  });
  const [saving, setSaving] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const withSaving = (key, fn) => async () => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await fn();
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const saveProfile = withSaving("profile", async () => {
    if (!profile.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    await authAPI.updatePreferences(user?.preferences || {});
    toast.success("Profile updated");
  });

  const savePassword = withSaving("password", async () => {
    if (!passwords.current) {
      toast.error("Enter your current password");
      return;
    }
    if (passwords.newPass.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      toast.success("Password updated successfully");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    }
  });

  const savePrefs = withSaving("prefs", async () => {
    await updatePreferences(prefs);
    toast.success("Preferences saved");
  });

  const handleDeleteAll = async () => {
    if (deleteInput !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    try {
      await tasksAPI.deleteAll();
      toast.success("All tasks deleted");
      setConfirmDelete(false);
      setDeleteInput("");
    } catch {
      toast.error("Failed to delete tasks");
    }
  };

  const pwChecks = {
    length: passwords.newPass.length >= 8,
    uppercase: /[A-Z]/.test(passwords.newPass),
    number: /\d/.test(passwords.newPass),
    special: /[!@#$%^&*]/.test(passwords.newPass),
  };
  const pwLabels = {
    length: "8+ chars",
    uppercase: "Uppercase",
    number: "Number",
    special: "Special char",
  };

  return (
    <div className="settings-page animate-fade">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="settings-layout">
        {/* ── Appearance (Theme) ── */}
        <Section icon={Palette} title="Appearance">
          <p className="text-muted text-sm">
            Choose between Dark mode (Catppuccin Mocha) and Light mode (clean
            professional). Your preference is saved automatically and restored
            on every visit.
          </p>

          <div className="theme-toggle-row">
            <div
              className={`theme-option ${isDark ? "active" : ""}`}
              onClick={() => {
                if (!isDark) toggleTheme();
              }}
            >
              <div className="theme-preview dark-preview">
                <div className="tp-sidebar" />
                <div className="tp-content">
                  <div className="tp-bar" />
                  <div className="tp-bar short" />
                </div>
              </div>
              <div className="theme-option-label">
                <Moon size={14} />
                <span>Dark</span>
                {isDark && <span className="theme-active-dot" />}
              </div>
            </div>

            <button
              className={`theme-switch-btn ${isDark ? "" : "light-active"}`}
              onClick={toggleTheme}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div
              className={`theme-option ${!isDark ? "active" : ""}`}
              onClick={() => {
                if (isDark) toggleTheme();
              }}
            >
              <div className="theme-preview light-preview">
                <div className="tp-sidebar" />
                <div className="tp-content">
                  <div className="tp-bar" />
                  <div className="tp-bar short" />
                </div>
              </div>
              <div className="theme-option-label">
                <Sun size={14} />
                <span>Light</span>
                {!isDark && <span className="theme-active-dot" />}
              </div>
            </div>
          </div>

          <div className="theme-current-badge">
            {isDark ? <Moon size={13} /> : <Sun size={13} />}
            <span>
              Currently using <strong>{isDark ? "Dark" : "Light"}</strong> theme
              — saved to your browser
            </span>
          </div>
        </Section>

        {/* ── Profile ── */}
        <Section icon={User} title="Profile">
          <div className="settings-avatar-row">
            <div className="settings-avatar">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-muted text-sm">{user?.email}</div>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Display Name</label>
            <input
              className="input"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              maxLength={50}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              value={user?.email || ""}
              disabled
              style={{ opacity: 0.5 }}
            />
            <span className="text-xs text-muted">Email cannot be changed</span>
          </div>
          <button
            className="btn btn-primary btn-sm settings-save-btn"
            onClick={saveProfile}
            disabled={saving.profile}
          >
            {saving.profile ? (
              <span className="loader-sm" />
            ) : (
              <>
                <Save size={14} /> Save Profile
              </>
            )}
          </button>
        </Section>

        {/* ── Password ── */}
        <Section icon={Lock} title="Change Password">
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <div className="pw-wrap">
              <input
                className="input"
                type={showPw ? "text" : "password"}
                value={passwords.current}
                placeholder="••••••••"
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={passwords.newPass}
              placeholder="Minimum 6 characters"
              onChange={(e) =>
                setPasswords((p) => ({ ...p, newPass: e.target.value }))
              }
            />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={passwords.confirm}
              placeholder="Repeat new password"
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
            />
          </div>
          {passwords.newPass && (
            <div className="pw-strength animate-fade">
              {Object.entries(pwChecks).map(([key, ok]) => (
                <div key={key} className={`pw-check ${ok ? "ok" : ""}`}>
                  <CheckCircle2 size={11} />
                  <span>{pwLabels[key]}</span>
                </div>
              ))}
            </div>
          )}
          <button
            className="btn btn-primary btn-sm settings-save-btn"
            onClick={savePassword}
            disabled={saving.password}
          >
            {saving.password ? (
              <span className="loader-sm" />
            ) : (
              <>
                <Save size={14} /> Update Password
              </>
            )}
          </button>
        </Section>

        {/* ── Pomodoro prefs ── */}
        <Section icon={Timer} title="Pomodoro Durations">
          <p className="text-muted text-sm">
            Customize focus and break lengths. Saved to your account.
          </p>
          <div className="prefs-grid">
            {[
              {
                key: "pomodoroLength",
                label: "Focus",
                min: 5,
                max: 90,
                color: "var(--mauve)",
              },
              {
                key: "shortBreak",
                label: "Short break",
                min: 1,
                max: 30,
                color: "var(--green)",
              },
              {
                key: "longBreak",
                label: "Long break",
                min: 5,
                max: 60,
                color: "var(--blue)",
              },
            ].map(({ key, label, min, max, color }) => (
              <div key={key} className="pref-item" style={{ "--pc": color }}>
                <label className="input-label">{label}</label>
                <div className="pref-input-row">
                  <input
                    className="input pref-input"
                    type="number"
                    min={min}
                    max={max}
                    value={prefs[key]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        [key]: Math.min(
                          max,
                          Math.max(min, parseInt(e.target.value) || min),
                        ),
                      }))
                    }
                  />
                  <span className="pref-unit" style={{ color }}>
                    min
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={prefs[key]}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [key]: parseInt(e.target.value) }))
                  }
                  className="pref-slider"
                  style={{ "--sc": color }}
                />
                <div className="pref-range-labels">
                  <span className="text-xs text-muted">{min}m</span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {prefs[key]}m
                  </span>
                  <span className="text-xs text-muted">{max}m</span>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm settings-save-btn"
            onClick={savePrefs}
            disabled={saving.prefs}
          >
            {saving.prefs ? (
              <span className="loader-sm" />
            ) : (
              <>
                <Save size={14} /> Save Preferences
              </>
            )}
          </button>
        </Section>

        {/* ── Notifications ── */}
        <Section icon={Bell} title="Notifications">
          <p className="text-muted text-sm">
            Browser push notifications are toggled in the Pomodoro timer.
            Deadline reminders shown on the dashboard automatically.
          </p>
          <div className="notif-options">
            {[
              "Notify 1 day before deadline",
              "Notify when a task becomes overdue",
              "Daily summary at 9:00 AM",
            ].map((label) => (
              <label key={label} className="notif-toggle-row">
                <input type="checkbox" className="notif-checkbox" disabled />
                <span className="text-sm">{label}</span>
                <span className="badge badge-soon">Coming soon</span>
              </label>
            ))}
          </div>
        </Section>

        {/* ── Danger zone ── */}
        <Section icon={AlertTriangle} title="Danger Zone">
          <p className="text-muted text-sm">
            These actions are permanent and cannot be undone.
          </p>
          {!confirmDelete ? (
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} /> Delete All My Tasks
            </button>
          ) : (
            <div className="confirm-delete-box animate-scale">
              <p className="text-sm text-red font-semibold">
                ⚠️ This will permanently delete ALL your tasks, subtasks, and
                time logs.
              </p>
              <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                className="input"
                style={{
                  marginTop: 8,
                  fontFamily: "JetBrains Mono, monospace",
                }}
                placeholder="DELETE"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
              <div className="flex gap-2" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteAll}
                  disabled={deleteInput !== "DELETE"}
                >
                  Confirm Delete
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteInput("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
