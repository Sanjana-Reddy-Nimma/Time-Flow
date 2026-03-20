import React, { useState } from "react";
import { usePomodoro, POMODORO_MODES } from "../../context/PomodoroContext";
import { useTasks } from "../../context/TaskContext";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Bell,
  BellOff,
  ChevronDown,
  Timer,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import "./PomodoroTimer.css";

const CIRCUMFERENCE = 2 * Math.PI * 54;

export default function PomodoroTimer() {
  const pomo = usePomodoro();
  const { tasks } = useTasks();
  const [showTaskDrop, setDrop] = useState(false);

  const pendingTasks = tasks.filter(
    (t) => !["completed", "cancelled"].includes(t.status),
  );

  const handleToggleNotif = async () => {
    const wasOn = pomo.notifOn;
    const granted = await pomo.toggleNotif();
    if (wasOn) {
      toast("Notifications disabled", { icon: "🔕" });
    } else if (granted) {
      toast.success("Notifications enabled");
    } else {
      toast.error("Notifications blocked by browser");
    }
  };

  const selectedTaskObj = pendingTasks.find((t) => t._id === pomo.selectedTask);
  const modeConfig = POMODORO_MODES[pomo.mode];
  const strokeDash = CIRCUMFERENCE - (pomo.progress / 100) * CIRCUMFERENCE;

  const modeColors = {
    work: "var(--mauve)",
    shortBreak: "var(--green)",
    longBreak: "var(--blue)",
  };
  const color = modeColors[pomo.mode];

  // Steps use CSS classes so colors update with theme
  const steps = [
    { num: "1", text: "Pick a task to work on", cls: "step-mauve" },
    { num: "2", text: "Focus for 25 minutes", cls: "step-mauve" },
    { num: "3", text: "Take a 5-minute break", cls: "step-green" },
    { num: "4", text: "After 4 rounds, take 15 min", cls: "step-blue" },
  ];

  return (
    <div className="pomodoro-page animate-fade">
      <div className="page-header">
        <h1 className="page-title">Pomodoro Timer</h1>
        <p className="page-subtitle">
          25-minute focus cycles with automatic breaks
        </p>
      </div>

      <div className="pomodoro-layout">
        {/* ── Main timer card ── */}
        <div className="card pomodoro-main">
          {/* Mode tabs */}
          <div className="pomo-modes">
            {Object.values(POMODORO_MODES).map((m) => (
              <button
                key={m.key}
                className={`pomo-mode-btn ${pomo.mode === m.key ? "active" : ""}`}
                style={{ "--mc": modeColors[m.key] }}
                onClick={() => pomo.switchMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* SVG ring */}
          <div className="pomo-ring-wrap">
            <svg viewBox="0 0 120 120" className="pomo-ring-svg">
              {/* track */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="var(--surface0)"
                strokeWidth="5"
              />
              {/* progress arc */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDash}
                transform="rotate(-90 60 60)"
                style={{
                  transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease",
                }}
              />
              {/* time text */}
              <text
                x="60"
                y="52"
                textAnchor="middle"
                fill="var(--text)"
                fontSize="22"
                fontWeight="800"
                fontFamily="Outfit"
                letterSpacing="-1"
              >
                {pomo.minutes}:{pomo.seconds}
              </text>
              {/* mode label */}
              <text
                x="60"
                y="68"
                textAnchor="middle"
                fill={color}
                fontSize="8"
                fontWeight="600"
                fontFamily="Outfit"
                letterSpacing="0.5"
              >
                {modeConfig.label.toUpperCase()}
              </text>
              {/* round indicator */}
              <text
                x="60"
                y="80"
                textAnchor="middle"
                fill="var(--overlay0)"
                fontSize="6.5"
                fontFamily="Outfit"
              >
                Round {pomo.round}
              </text>
            </svg>
          </div>

          {/* Round dots */}
          <div className="pomo-rounds">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`round-dot ${
                  (pomo.round - 1) % 4 >= n - 1 && pomo.mode !== "work"
                    ? "done"
                    : ""
                } ${
                  (pomo.round - 1) % 4 === n - 1 && pomo.mode === "work"
                    ? "current"
                    : ""
                }`}
                style={{ "--dc": color }}
              />
            ))}
            <span className="text-xs text-muted">
              {pomo.cycleCount > 0
                ? `${pomo.cycleCount} cycle${pomo.cycleCount !== 1 ? "s" : ""} done`
                : "cycle 1"}
            </span>
          </div>

          {/* Controls */}
          <div className="pomo-controls">
            <button
              className="pomo-ctrl-btn"
              onClick={pomo.reset}
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="pomo-play-btn"
              style={{ "--pc": color }}
              onClick={pomo.running ? pomo.pause : pomo.start}
            >
              {pomo.running ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button className="pomo-ctrl-btn" onClick={pomo.skip} title="Skip">
              <SkipForward size={18} />
            </button>
          </div>

          {/* Task selector */}
          <div className="pomo-task-selector">
            <button
              className="pomo-task-btn"
              onClick={() => setDrop((d) => !d)}
            >
              <Timer size={14} />
              <span className="truncate">
                {selectedTaskObj
                  ? selectedTaskObj.title
                  : "Select a task to focus on..."}
              </span>
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: showTaskDrop ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              />
            </button>

            {showTaskDrop && (
              <div className="pomo-task-dropdown animate-scale">
                <div
                  className="pomo-task-option"
                  onClick={() => {
                    pomo.setSelectedTask("");
                    setDrop(false);
                  }}
                >
                  <span className="text-muted">— No task</span>
                </div>
                {pendingTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`pomo-task-option ${pomo.selectedTask === task._id ? "selected" : ""}`}
                    onClick={() => {
                      pomo.setSelectedTask(task._id);
                      setDrop(false);
                    }}
                  >
                    <span
                      className={`badge badge-${task.importance}`}
                      style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                    >
                      {task.importance}
                    </span>
                    <span className="truncate text-sm">{task.title}</span>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <div className="pomo-task-option">
                    <span className="text-muted text-sm">No pending tasks</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification toggle */}
          <button
            className={`notif-toggle ${pomo.notifOn ? "on" : ""}`}
            onClick={handleToggleNotif}
          >
            {pomo.notifOn ? <Bell size={14} /> : <BellOff size={14} />}
            {pomo.notifOn ? "Notifications on" : "Enable notifications"}
          </button>
        </div>

        {/* ── Right column ── */}
        <div className="pomodoro-right">
          {/* Technique info */}
          <div className="card pomo-info-card">
            <h3 className="font-semibold" style={{ marginBottom: 14 }}>
              🍅 The Pomodoro Technique
            </h3>
            <div className="pomo-steps">
              {steps.map((s) => (
                <div key={s.num} className="pomo-step">
                  <span className={`step-num ${s.cls}`}>{s.num}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="pomo-durations">
              <div className="pd-row">
                <span className="pomo-dur-label mauve">● Focus</span>
                <span className="font-semibold mono">
                  {Math.round(pomo.durations.work / 60)}m
                </span>
              </div>
              <div className="pd-row">
                <span className="pomo-dur-label green">● Short break</span>
                <span className="font-semibold mono">
                  {Math.round(pomo.durations.shortBreak / 60)}m
                </span>
              </div>
              <div className="pd-row">
                <span className="pomo-dur-label blue">● Long break</span>
                <span className="font-semibold mono">
                  {Math.round(pomo.durations.longBreak / 60)}m
                </span>
              </div>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: 8 }}>
              Adjust durations in Settings
            </p>
          </div>

          {/* Session log */}
          <div className="card pomo-log-card">
            <h3
              className="font-semibold"
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Award size={15} className="text-mauve" /> Session Log
            </h3>
            {pomo.sessionLog.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px" }}>
                <p className="text-muted text-sm">
                  Complete a focus session to see logs here.
                </p>
              </div>
            ) : (
              <div className="pomo-log-list">
                {pomo.sessionLog.map((entry, i) => (
                  <div key={i} className="pomo-log-row">
                    <div className="pomo-log-dot pomo-log-dot-mauve" />
                    <div className="pomo-log-info">
                      <div className="text-sm font-medium truncate">
                        {entry.task || "General focus"}
                      </div>
                      <div className="text-xs text-muted">
                        {format(new Date(entry.time), "HH:mm")} ·{" "}
                        {entry.duration}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
