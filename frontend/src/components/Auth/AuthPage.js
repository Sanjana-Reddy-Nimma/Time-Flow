import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import "./AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () =>
    setForm((f) => ({ ...f, email: "demo@taskflow.com", password: "demo123" }));

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb-1" />
        <div className="auth-orb orb-2" />
        <div className="auth-orb orb-3" />
      </div>

      <div className="auth-card animate-scale">
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <h1>TaskFlow</h1>
          <p>Task Scheduling & Time Management</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            <LogIn size={15} /> Login
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <div className="input-group animate-fade">
              <label className="input-label">Full Name</label>
              <input
                className="input"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handle}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="password-wrap">
              <input
                className="input"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder={
                  mode === "register" ? "At least 6 characters" : "••••••••"
                }
                value={form.password}
                onChange={handle}
                required
                minLength={6}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="loader-sm" />
            ) : mode === "login" ? (
              <>
                <LogIn size={16} /> Login
              </>
            ) : (
              <>
                <UserPlus size={16} /> Create Account
              </>
            )}
          </button>
        </form>

        {mode === "login" && (
          <button className="demo-btn" onClick={fillDemo}>
            Use Demo Account
          </button>
        )}
      </div>
    </div>
  );
}
