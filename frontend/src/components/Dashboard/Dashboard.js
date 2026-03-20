import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../../context/TaskContext";
import { useAuth } from "../../context/AuthContext";
import { statsAPI } from "../../utils/api";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Pencil,
  Trash2,
  Check,
  Plus,
  Zap,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import ConflictAlerts from "./ConflictAlerts";
import WorkloadHeatmap from "./WorkloadHeatmap";
import "./Dashboard.css";

const IMPORTANCE_COLOR = {
  low: "var(--green)",
  medium: "var(--yellow)",
  high: "var(--peach)",
  critical: "var(--red)",
};

function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div className="stat-card animate-fade" style={{ "--accent": accent }}>
      <div
        className="stat-icon"
        style={{ background: `${accent}18`, color: accent }}
      >
        <Icon size={20} />
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function TaskRow({ task, onComplete, onDelete, onEdit, selected, onSelect }) {
  const isOverdue = task.status === "overdue";
  const color = IMPORTANCE_COLOR[task.importance] || "var(--overlay1)";
  return (
    <div
      className={`task-row animate-fade ${isOverdue ? "overdue" : ""} ${selected ? "task-selected" : ""}`}
    >
      <input
        type="checkbox"
        className="task-checkbox"
        checked={selected}
        onChange={() => onSelect(task._id)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="task-row-accent" style={{ background: color }} />
      <div className="task-row-body">
        <div className="task-row-title" onClick={() => onEdit(task._id)}>
          {task.title}
        </div>
        <div className="task-row-meta">
          {task.deadline && (
            <span
              className={isOverdue ? "text-red text-xs" : "text-muted text-xs"}
            >
              <Clock size={11} /> {format(new Date(task.deadline), "MMM d")}
            </span>
          )}
          <span className="text-muted text-xs">
            ⏱ {task.estimatedDuration}h
          </span>
          {task.subtasks?.length > 0 && (
            <span className="text-muted text-xs">
              ☑ {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length}
            </span>
          )}
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="task-row-actions">
        <span className={`badge badge-${task.importance}`}>
          {task.importance}
        </span>
        {(task.deepsScore || task.priorityScore > 0) && (
          <span className="score-badge">
            {task.deepsScore?.total ?? task.priorityScore}
          </span>
        )}
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => onEdit(task._id)}
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => onDelete(task._id)}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
        {task.status !== "completed" && (
          <button
            className="btn btn-icon btn-sm complete-btn"
            onClick={() => onComplete(task._id)}
            title="Mark done"
          >
            <Check size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <div className="font-semibold">{label}</div>
        <div className="text-mauve">{payload[0].value} tasks</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { tasks, fetchTasks, updateTaskStatus, deleteTask } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const barColor = isDark ? "#cba6f7" : "#6d28d9";
  const axisColor = isDark ? "#7f849c" : "#6b748f";
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    await fetchTasks();
    try {
      const { data } = await statsAPI.getDashboard();
      setStats(data);
    } catch {}
    setLoading(false);
  }, [fetchTasks]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tasks.filter((t) => {
    if (filter === "all") return t.status !== "completed";
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    if (filter === "overdue") return t.status === "overdue";
    return true;
  });

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t._id)));
    }
  };

  const bulkComplete = async () => {
    setBulkLoading(true);
    try {
      const { tasksAPI } = await import("../../utils/api");
      await tasksAPI.bulkUpdateStatus([...selected], "completed");
      setSelected(new Set());
      await load();
    } catch {}
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} tasks?`)) return;
    setBulkLoading(true);
    try {
      const { tasksAPI } = await import("../../utils/api");
      await tasksAPI.bulkDelete([...selected]);
      setSelected(new Set());
      await load();
    } catch {}
    setBulkLoading(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
      </div>
    );

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="page-subtitle">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={ListTodo}
          value={stats?.stats.total ?? "—"}
          label="Total Tasks"
          accent="var(--mauve)"
        />
        <StatCard
          icon={CheckCircle2}
          value={stats?.stats.completed ?? "—"}
          label="Completed"
          accent="var(--green)"
        />
        <StatCard
          icon={Clock}
          value={stats?.stats.pending ?? "—"}
          label="Pending"
          accent="var(--yellow)"
        />
        <StatCard
          icon={AlertTriangle}
          value={stats?.stats.overdue ?? "—"}
          label="Overdue"
          accent="var(--red)"
        />
      </div>

      {/* Conflict alerts */}
      <ConflictAlerts />

      {/* Completion + Chart + Heatmap */}
      {stats && (
        <div className="dashboard-mid">
          <div className="card completion-card">
            <div className="completion-header">
              <TrendingUp size={16} className="text-mauve" />
              <span className="font-semibold">Overall Progress</span>
            </div>
            <div className="completion-ring-wrap">
              <svg viewBox="0 0 100 100" className="completion-ring">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--surface0)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--mauve)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.stats.completionRate / 100)}`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
                <text
                  x="50"
                  y="54"
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="18"
                  fontWeight="700"
                  fontFamily="Outfit"
                >
                  {stats.stats.completionRate}%
                </text>
              </svg>
            </div>
            <div className="completion-stats">
              <div className="cs-item">
                <span style={{ color: "var(--green)" }}>●</span>{" "}
                {stats.stats.completed} done
              </div>
              <div className="cs-item">
                <span style={{ color: "var(--yellow)" }}>●</span>{" "}
                {stats.stats.pending} pending
              </div>
              {stats.stats.overdue > 0 && (
                <div className="cs-item">
                  <span style={{ color: "var(--red)" }}>●</span>{" "}
                  {stats.stats.overdue} overdue
                </div>
              )}
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-header">
              <Zap size={16} className="text-mauve" />
              <span className="font-semibold">7-Day Completions</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.weeklyTrend} barSize={24}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(109,40,217,0.05)" }}
                />
                <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card heatmap-card">
            <div className="chart-header" style={{ marginBottom: 12 }}>
              <Layers size={16} className="text-blue" />
              <span className="font-semibold">Workload Heatmap</span>
            </div>
            <WorkloadHeatmap />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="card tasks-section">
        <div className="tasks-header">
          <h2 className="font-semibold text-lg">Your Tasks</h2>
          <div className="task-filters">
            {["all", "pending", "overdue", "completed"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => {
                  setFilter(f);
                  setSelected(new Set());
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate("/add-task")}
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="bulk-bar animate-fade">
            <span className="text-sm font-semibold">
              {selected.size} selected
            </span>
            <button
              className="btn btn-sm btn-success"
              onClick={bulkComplete}
              disabled={bulkLoading}
            >
              <Check size={13} /> Mark Done
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={bulkDelete}
              disabled={bulkLoading}
            >
              <Trash2 size={13} /> Delete
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        )}

        <div className="tasks-list-header">
          <label className="select-all-label">
            <input
              type="checkbox"
              className="task-checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={selectAll}
            />
            <span className="text-xs text-muted">Select all</span>
          </label>
        </div>

        <div className="tasks-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} className="empty-state-icon" />
              <h3>No tasks here</h3>
              <p>
                {filter === "completed"
                  ? "Complete some tasks to see them here."
                  : "Add a task to get started."}
              </p>
            </div>
          ) : (
            filtered.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                selected={selected.has(task._id)}
                onSelect={toggleSelect}
                onComplete={(id) => updateTaskStatus(id, "completed")}
                onDelete={deleteTask}
                onEdit={(id) => navigate(`/task/${id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
