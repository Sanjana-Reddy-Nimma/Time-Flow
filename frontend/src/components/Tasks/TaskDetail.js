import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tasksAPI } from "../../utils/api";
import { useTasks } from "../../context/TaskContext";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  Clock,
  Calendar,
  Tag,
  Play,
  Square,
  CheckSquare,
  Square as EmptySquare,
  Save,
  X,
  Zap,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import "./TaskDetail.css";

const IMPORTANCE_COLOR = {
  low: "var(--green)",
  medium: "var(--yellow)",
  high: "var(--peach)",
  critical: "var(--red)",
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateTask, updateTaskStatus, deleteTask, toggleSubtask } =
    useTasks();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    try {
      const { data } = await tasksAPI.getById(id);
      setTask(data.task);
      setEditForm({
        title: data.task.title,
        description: data.task.description || "",
        deadline: format(new Date(data.task.deadline), "yyyy-MM-dd"),
        importance: data.task.importance,
        estimatedDuration: data.task.estimatedDuration,
      });
    } catch {
      toast.error("Task not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      const deadline = new Date(editForm.deadline + "T23:59:59");
      await updateTask(id, { ...editForm, deadline: deadline.toISOString() });
      setEditing(false);
      load();
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(id);
    navigate("/");
  };

  const handleStatusChange = async (status) => {
    await updateTaskStatus(id, status);
    load();
  };

  const handleSubtask = async (subtaskId) => {
    await toggleSubtask(id, subtaskId);
    load();
  };

  const handleTimeLog = async (action) => {
    try {
      await tasksAPI.timeLog(id, action);
      load();
      toast.success(action === "start" ? "⏱ Timer started" : "⏹ Timer stopped");
    } catch {
      toast.error("Failed to update timer");
    }
  };

  // ── Loading / empty ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
      </div>
    );
  if (!task) return null;

  const isOverdue = task.status === "overdue";
  const accentColor = IMPORTANCE_COLOR[task.importance] || "var(--overlay1)";
  const hasActiveLog = task.timeLogs?.some((l) => !l.endTime);
  const totalLoggedMinutes =
    task.timeLogs
      ?.filter((l) => l.duration)
      .reduce((s, l) => s + l.duration, 0) || 0;
  const subtasksDone = task.subtasks?.filter((s) => s.completed).length || 0;

  return (
    <div className="task-detail animate-fade">
      {/* ── Header bar ── */}
      <div className="detail-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="detail-actions">
          {task.status !== "completed" && (
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleStatusChange("completed")}
            >
              <Check size={14} /> Mark Done
            </button>
          )}
          {editing ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing(false)}
              >
                <X size={14} /> Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                <Save size={14} /> Save
              </button>
            </>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="detail-layout">
        {/* ── Main column ── */}
        <div className="detail-main">
          {/* Task card */}
          <div className="card detail-card">
            <div
              className="detail-accent"
              style={{ background: accentColor }}
            />

            {editing ? (
              <div className="edit-form">
                <div className="input-group">
                  <label className="input-label">Title</label>
                  <input
                    className="input"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-row-2">
                  <div className="input-group">
                    <label className="input-label">Deadline</label>
                    <input
                      className="input"
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, deadline: e.target.value }))
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Duration (h)</label>
                    <input
                      className="input"
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={editForm.estimatedDuration}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          estimatedDuration: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Importance</label>
                    <select
                      className="input"
                      value={editForm.importance}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          importance: e.target.value,
                        }))
                      }
                    >
                      {["low", "medium", "high", "critical"].map((v) => (
                        <option key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="detail-title-row">
                  <h1 className="detail-title">{task.title}</h1>
                  <span className={`badge badge-${task.status}`}>
                    {task.status}
                  </span>
                </div>
                {task.description && (
                  <p className="detail-desc">{task.description}</p>
                )}
              </>
            )}

            <div className="detail-meta-row">
              <span className={`badge badge-${task.importance}`}>
                {task.importance}
              </span>
              <span className="detail-meta-item">
                <Calendar size={13} />
                {format(new Date(task.deadline), "MMM d, yyyy")}
              </span>
              <span
                className={`detail-meta-item ${isOverdue ? "text-red" : "text-muted"}`}
              >
                <Clock size={13} />
                {isOverdue
                  ? "Overdue"
                  : `Due ${formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}`}
              </span>
              <span className="detail-meta-item text-muted">
                <Clock size={13} /> Est. {task.estimatedDuration}h
              </span>
              {task.tags?.map((tag) => (
                <span key={tag} className="tag-chip">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          {task.subtasks?.length > 0 && (
            <div className="card">
              <div className="section-header">
                <h3 className="font-semibold">Subtasks</h3>
                <span className="text-muted text-sm">
                  {subtasksDone}/{task.subtasks.length}
                </span>
              </div>
              <div className="subtasks-progress" style={{ marginBottom: 12 }}>
                <div className="priority-bar">
                  <div
                    className="priority-bar-fill"
                    style={{
                      width: `${task.subtasks.length ? (subtasksDone / task.subtasks.length) * 100 : 0}%`,
                      background: "var(--mauve)",
                    }}
                  />
                </div>
              </div>
              <div className="subtasks-list-detail">
                {task.subtasks.map((st) => (
                  <div
                    key={st._id}
                    className={`subtask-row ${st.completed ? "done" : ""}`}
                    onClick={() => handleSubtask(st._id)}
                  >
                    {st.completed ? (
                      <CheckSquare size={16} className="text-green" />
                    ) : (
                      <EmptySquare size={16} className="text-muted" />
                    )}
                    <span>{st.title}</span>
                    {st.completedAt && (
                      <span className="text-xs text-muted ml-auto">
                        {format(new Date(st.completedAt), "MMM d")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time logs */}
          {task.timeLogs?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold" style={{ marginBottom: 12 }}>
                Time Logs
              </h3>
              <div className="time-logs">
                {task.timeLogs.map((log, i) => (
                  <div key={i} className="time-log-row">
                    <span className="text-sm">
                      {format(new Date(log.startTime), "MMM d, HH:mm")}
                    </span>
                    <span className="text-muted text-sm">
                      →{" "}
                      {log.endTime
                        ? format(new Date(log.endTime), "HH:mm")
                        : "Active..."}
                    </span>
                    {log.duration && (
                      <span className="text-sm font-semibold text-mauve">
                        {log.duration}m
                      </span>
                    )}
                    {log.note && (
                      <span className="text-xs text-muted">{log.note}</span>
                    )}
                  </div>
                ))}
                <div className="time-total">
                  <span className="text-sm text-muted">Total logged</span>
                  <span className="font-semibold text-mauve">
                    {(totalLoggedMinutes / 60).toFixed(1)}h /{" "}
                    {task.estimatedDuration}h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="detail-sidebar">
          {/* DEEP-S score */}
          {task.deepsScore && (
            <div className="card score-widget">
              <div className="section-header">
                <Zap size={14} className="text-mauve" />
                <span className="font-semibold text-sm">DEEP-S Score</span>
              </div>
              <div
                className="score-big"
                style={{
                  color:
                    task.deepsScore.total >= 70
                      ? "var(--red)"
                      : task.deepsScore.total >= 40
                        ? "var(--yellow)"
                        : "var(--green)",
                }}
              >
                {task.deepsScore.total}
              </div>
              <div className="score-bars">
                {Object.entries(task.deepsScore.breakdown).map(([key, val]) => (
                  <div key={key} className="score-bar-row">
                    <span className="text-xs text-muted capitalize">{key}</span>
                    <div className="priority-bar" style={{ flex: 1 }}>
                      <div
                        className="priority-bar-fill"
                        style={{ width: `${val}%`, background: "var(--mauve)" }}
                      />
                    </div>
                    <span className="text-xs mono text-mauve">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time tracking */}
          {!["completed", "cancelled"].includes(task.status) && (
            <div className="card">
              <div className="section-header" style={{ marginBottom: 12 }}>
                <Clock size={14} className="text-blue" />
                <span className="font-semibold text-sm">Time Tracking</span>
              </div>
              <div className="time-track-stats">
                <div className="tt-stat">
                  <span className="text-xs text-muted">Estimated</span>
                  <span className="font-semibold">
                    {task.estimatedDuration}h
                  </span>
                </div>
                <div className="tt-stat">
                  <span className="text-xs text-muted">Logged</span>
                  <span className="font-semibold text-mauve">
                    {(totalLoggedMinutes / 60).toFixed(1)}h
                  </span>
                </div>
              </div>
              {hasActiveLog ? (
                <button
                  className="btn btn-sm btn-danger w-full"
                  onClick={() => handleTimeLog("stop")}
                >
                  <Square size={13} /> Stop Timer
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-info w-full"
                  onClick={() => handleTimeLog("start")}
                >
                  <Play size={13} /> Start Timer
                </button>
              )}
            </div>
          )}

          {/* Status change */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <RefreshCw size={14} className="text-teal" />
              <span className="font-semibold text-sm">Change Status</span>
            </div>
            <div className="status-btns">
              {["pending", "in-progress", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  className={`status-btn ${task.status === s ? "active" : ""}`}
                  onClick={() => handleStatusChange(s)}
                  disabled={task.status === s}
                >
                  <span className={`badge badge-${s}`}>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <h4 className="font-semibold text-sm" style={{ marginBottom: 10 }}>
              Details
            </h4>
            <div className="meta-list">
              <div className="meta-row">
                <span className="text-muted text-xs">Created</span>
                <span className="text-xs">
                  {format(new Date(task.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <div className="meta-row">
                <span className="text-muted text-xs">Updated</span>
                <span className="text-xs">
                  {format(new Date(task.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
              {task.completedAt && (
                <div className="meta-row">
                  <span className="text-muted text-xs">Completed</span>
                  <span className="text-xs text-green">
                    {format(new Date(task.completedAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {task.isRecurring && (
                <div className="meta-row">
                  <span className="text-muted text-xs">Recurring</span>
                  <span className="text-xs text-mauve">
                    {task.recurringPattern?.frequency}
                  </span>
                </div>
              )}
              <div className="meta-row">
                <span className="text-muted text-xs">Pomodoros</span>
                <span className="text-xs">{task.pomodoroCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
