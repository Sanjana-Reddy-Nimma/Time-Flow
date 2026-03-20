import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../../context/TaskContext";
import { useTheme } from "../../context/ThemeContext";
import { format } from "date-fns";
import {
  Plus,
  X,
  Tag,
  Clock,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "./TaskForm.css";

const IMPORTANCE_OPTIONS = [
  { value: "low", label: "Low", color: "var(--green)" },
  { value: "medium", label: "Medium", color: "var(--yellow)" },
  { value: "high", label: "High", color: "var(--peach)" },
  { value: "critical", label: "Critical", color: "var(--red)" },
];

const IMPORTANCE_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 };

function calcPreviewScore(deadline, importance, duration) {
  if (!deadline || !duration) return 0;
  const now = new Date();
  const hoursRemaining = (new Date(deadline) - now) / 3600000;
  if (hoursRemaining <= 0) return 100;
  const urgencyRatio = hoursRemaining / (duration || 1);
  const urgency = Math.min(100, (1 / urgencyRatio) * 50);
  const imp = (IMPORTANCE_WEIGHT[importance] / 4) * 100;
  const dur = Math.min(100, (1 / Math.sqrt(duration)) * 30);
  return parseFloat((0.45 * urgency + 0.3 * imp + 0.15 * dur).toFixed(1));
}

export default function AddTask() {
  const { createTask } = useTasks();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: today,
    importance: "medium",
    estimatedDuration: 1,
    tags: [],
    subtasks: [],
    isRecurring: false,
    recurringPattern: { frequency: "weekly", interval: 1 },
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Tags
  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (!form.tags.includes(tag)) set("tags", [...form.tags, tag]);
      setTagInput("");
    }
  };
  const removeTag = (tag) =>
    set(
      "tags",
      form.tags.filter((t) => t !== tag),
    );

  // Subtasks
  const addSubtask = (e) => {
    if (e.key === "Enter" && subtaskInput.trim()) {
      e.preventDefault();
      set("subtasks", [
        ...form.subtasks,
        { title: subtaskInput.trim(), completed: false },
      ]);
      setSubtaskInput("");
    }
  };
  const removeSubtask = (i) =>
    set(
      "subtasks",
      form.subtasks.filter((_, idx) => idx !== i),
    );

  // Live score preview
  const previewScore = calcPreviewScore(
    form.deadline ? new Date(form.deadline + "T23:59:59") : null,
    form.importance,
    form.estimatedDuration,
  );

  // Ring colours
  const ringTrack = isDark ? "#313244" : "#dde2f0";
  const scoreColor =
    previewScore >= 70
      ? "var(--red)"
      : previewScore >= 40
        ? "var(--yellow)"
        : "var(--green)";

  // Component breakdown
  const urgencyVal = (() => {
    if (!form.deadline || !form.estimatedDuration) return "—";
    const hrs = (new Date(form.deadline + "T23:59:59") - new Date()) / 3600000;
    if (hrs <= 0) return 100;
    return parseFloat(
      Math.min(100, (1 / (hrs / form.estimatedDuration)) * 50).toFixed(1),
    );
  })();
  const importanceVal = { low: 25, medium: 50, high: 75, critical: 100 }[
    form.importance
  ];
  const durationVal = parseFloat(
    Math.min(100, (1 / Math.sqrt(form.estimatedDuration || 1)) * 30).toFixed(1),
  );

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deadlineDate = new Date(form.deadline + "T23:59:59");
      await createTask({ ...form, deadline: deadlineDate.toISOString() });
      navigate("/");
    } catch {
      // toast handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form-page">
      <div className="page-header">
        <h1 className="page-title">Create New Task</h1>
        <p className="page-subtitle">Add a new task to your schedule</p>
      </div>

      <div className="task-form-layout">
        {/* ── Form ── */}
        <form onSubmit={submit} className="card task-form">
          {/* Title */}
          <div className="input-group">
            <label className="input-label">Task Title *</label>
            <input
              className="input"
              placeholder="Enter task title..."
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Deadline + Duration */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Calendar size={13} /> Deadline *
              </label>
              <input
                className="input"
                type="date"
                value={form.deadline}
                min={today}
                onChange={(e) => set("deadline", e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <Clock size={13} /> Duration (hours) *
              </label>
              <input
                className="input"
                type="number"
                min="0.1"
                max="100"
                step="0.5"
                value={form.estimatedDuration}
                onChange={(e) =>
                  set("estimatedDuration", parseFloat(e.target.value) || 0.1)
                }
                required
              />
            </div>
          </div>

          {/* Importance */}
          <div className="input-group">
            <label className="input-label">Importance</label>
            <div className="importance-grid">
              {IMPORTANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`importance-btn ${form.importance === opt.value ? "active" : ""}`}
                  style={{ "--imp-color": opt.color }}
                  onClick={() => set("importance", opt.value)}
                >
                  <span className="imp-dot" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="input-group">
            <label className="input-label">
              <Tag size={13} /> Tags
            </label>
            <div className="tags-input-wrap">
              {form.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                className="tags-input"
                placeholder={
                  form.tags.length === 0 ? "Add tags (Enter or comma)..." : ""
                }
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-section animate-fade">
              {/* Subtasks */}
              <div className="input-group">
                <label className="input-label">Subtasks</label>
                <div className="subtasks-list">
                  {form.subtasks.map((st, i) => (
                    <div key={i} className="subtask-item">
                      <span className="subtask-check" />
                      <span className="flex-1">{st.title}</span>
                      <button type="button" onClick={() => removeSubtask(i)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  className="input"
                  placeholder="Add subtask (press Enter)..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={addSubtask}
                />
              </div>

              {/* Recurring */}
              <div className="input-group">
                <label className="input-label recurring-label">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => set("isRecurring", e.target.checked)}
                  />
                  Recurring Task
                </label>
                {form.isRecurring && (
                  <div className="form-row animate-fade">
                    <select
                      className="input"
                      value={form.recurringPattern.frequency}
                      onChange={(e) =>
                        set("recurringPattern", {
                          ...form.recurringPattern,
                          frequency: e.target.value,
                        })
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      placeholder="Every N..."
                      value={form.recurringPattern.interval}
                      onChange={(e) =>
                        set("recurringPattern", {
                          ...form.recurringPattern,
                          interval: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loader-sm" />
              ) : (
                <>
                  <Plus size={16} /> Create Task
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Score preview sidebar ── */}
        <div className="score-sidebar">
          <div className="card score-preview">
            <div className="score-preview-header">
              <Zap size={16} className="text-mauve" />
              <span className="font-semibold">DEEP-S Preview</span>
            </div>

            <div className="score-circle">
              <svg viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke={ringTrack}
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - previewScore / 100)}`}
                  transform="rotate(-90 40 40)"
                  style={{ transition: "all 0.4s ease" }}
                />
                <text
                  x="40"
                  y="44"
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="Outfit"
                >
                  {previewScore}
                </text>
              </svg>
            </div>

            <p className="score-label">Priority Score</p>
            <p className="score-hint">Higher = scheduled sooner by DEEP-S</p>

            <div className="score-breakdown">
              <div className="sb-row">
                <span>Urgency (45%)</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--blue)" }}
                >
                  {urgencyVal}
                </span>
              </div>
              <div className="sb-row">
                <span>Importance (30%)</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--mauve)" }}
                >
                  {importanceVal}
                </span>
              </div>
              <div className="sb-row">
                <span>Duration (15%)</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--teal)" }}
                >
                  {durationVal}
                </span>
              </div>
            </div>
          </div>

          <div className="card tips-card">
            <p className="font-semibold text-sm" style={{ marginBottom: 10 }}>
              💡 Scheduling Tips
            </p>
            {previewScore >= 70 && (
              <p className="tip-text text-red">
                ⚠️ High urgency — will be scheduled first.
              </p>
            )}
            {previewScore >= 40 && previewScore < 70 && (
              <p className="tip-text text-yellow">
                📌 Medium priority — schedule soon.
              </p>
            )}
            {previewScore < 40 && (
              <p className="tip-text text-green">
                ✅ Low urgency — you have time.
              </p>
            )}
            <p className="tip-text text-muted" style={{ marginTop: 8 }}>
              Tasks are auto-sorted by DEEP-S score on your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
