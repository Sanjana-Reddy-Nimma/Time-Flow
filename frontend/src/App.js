import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import ErrorBoundary from "./components/Layout/ErrorBoundary";
import AuthPage from "./components/Auth/AuthPage";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import AddTask from "./components/Tasks/AddTask";
import TaskDetail from "./components/Tasks/TaskDetail";
import CalendarView from "./components/Calendar/CalendarView";
import ProgressView from "./components/Progress/ProgressView";
import PomodoroTimer from "./components/Pomodoro/PomodoroTimer";
import Settings from "./components/Settings/Settings";
import NotFound from "./components/Layout/NotFound";
import "./index.css";

// ── Protected route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
};

// ── Toast colours adapt to current theme ──────────────────────────────────
const TOAST_DARK = {
  style: {
    background: "#1e1e2e",
    color: "#cdd6f4",
    border: "1px solid #313244",
  },
  success: { iconTheme: { primary: "#a6e3a1", secondary: "#1e1e2e" } },
  error: { iconTheme: { primary: "#f38ba8", secondary: "#1e1e2e" } },
};
const TOAST_LIGHT = {
  style: {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #dde2f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  success: { iconTheme: { primary: "#15803d", secondary: "#ffffff" } },
  error: { iconTheme: { primary: "#b91c1c", secondary: "#ffffff" } },
};

function ThemedToaster() {
  const { isDark } = useTheme();
  const opts = isDark ? TOAST_DARK : TOAST_LIGHT;
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: opts.style,
        success: opts.success,
        error: opts.error,
        duration: 3000,
      }}
    />
  );
}

// ── Routes ─────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />

      {/*
        PomodoroProvider wraps Layout so the timer context outlives any
        individual page — navigating away no longer resets the countdown.
      */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <PomodoroProvider>
                <Layout />
              </PomodoroProvider>
            </TaskProvider>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          }
        />
        <Route
          path="add-task"
          element={
            <ErrorBoundary>
              <AddTask />
            </ErrorBoundary>
          }
        />
        <Route
          path="task/:id"
          element={
            <ErrorBoundary>
              <TaskDetail />
            </ErrorBoundary>
          }
        />
        <Route
          path="calendar"
          element={
            <ErrorBoundary>
              <CalendarView />
            </ErrorBoundary>
          }
        />
        <Route
          path="progress"
          element={
            <ErrorBoundary>
              <ProgressView />
            </ErrorBoundary>
          }
        />
        <Route
          path="pomodoro"
          element={
            <ErrorBoundary>
              <PomodoroTimer />
            </ErrorBoundary>
          }
        />
        <Route
          path="settings"
          element={
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/* ThemeProvider must be outermost so every component can read the theme */}
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
