import React, { useEffect, useState, useCallback } from "react";
import { tasksAPI } from "../../utils/api";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import "./WorkloadHeatmap.css";

// Color levels based on total estimated hours per day
function getHeatLevel(hours) {
  if (hours === 0) return 0;
  if (hours <= 2) return 1;
  if (hours <= 4) return 2;
  if (hours <= 6) return 3;
  if (hours <= 8) return 4;
  return 5; // overloaded
}

function buildDays(month) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

export default function WorkloadHeatmap() {
  const [month, setMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (m) => {
    try {
      const { data } = await tasksAPI.getCalendar(
        m.getFullYear(),
        m.getMonth() + 1,
      );
      setTasks(data.tasks || []);
    } catch {}
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const days = buildDays(month);

  // Build per-day stats
  const dayMap = {};
  tasks.forEach((task) => {
    const key = format(new Date(task.deadline), "yyyy-MM-dd");
    if (!dayMap[key]) dayMap[key] = { tasks: [], totalHours: 0 };
    dayMap[key].tasks.push(task);
    dayMap[key].totalHours += task.estimatedDuration || 0;
  });

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedData = selectedKey ? dayMap[selectedKey] : null;
  const maxHours = Math.max(
    8,
    ...Object.values(dayMap).map((d) => d.totalHours),
  );

  const IMPORTANCE_COLOR = {
    low: "var(--green)",
    medium: "var(--yellow)",
    high: "var(--peach)",
    critical: "var(--red)",
  };

  return (
    <div className="heatmap-root">
      {/* Nav */}
      <div className="heatmap-nav">
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-sm">
          {format(month, "MMMM yyyy")}
        </span>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="heatmap-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="heatmap-weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="heatmap-grid">
        {days.map((day, i) => {
          const key = format(day, "yyyy-MM-dd");
          const data = dayMap[key];
          const hours = data?.totalHours || 0;
          const level = getHeatLevel(hours);
          const inMonth = isSameMonth(day, month);
          const isSelected = selectedKey === key;

          return (
            <div
              key={i}
              className={`heatmap-cell level-${level} ${!inMonth ? "out" : ""} ${isToday(day) ? "today" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(isSelected ? null : day)}
              title={
                hours > 0
                  ? `${hours.toFixed(1)}h on ${format(day, "MMM d")}`
                  : format(day, "MMM d")
              }
            >
              <span className="heatmap-day-num">{format(day, "d")}</span>
              {hours > 0 && (
                <span className="heatmap-hours">
                  {hours > 9.9 ? "10+" : hours.toFixed(hours % 1 === 0 ? 0 : 1)}
                  h
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="text-xs text-muted">Light</span>
        {[0, 1, 2, 3, 4, 5].map((l) => (
          <div key={l} className={`legend-cell level-${l}`} />
        ))}
        <span className="text-xs text-muted">Heavy</span>
        <Flame size={12} className="text-red" style={{ marginLeft: 6 }} />
        <span className="text-xs text-muted">&gt;8h = overloaded</span>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="heatmap-detail animate-fade">
          <div className="heatmap-detail-header">
            <span className="font-semibold text-sm">
              {format(selected, "EEEE, MMM d")}
            </span>
            {selectedData ? (
              <span
                className={`text-sm font-semibold ${selectedData.totalHours > 8 ? "text-red" : "text-mauve"}`}
              >
                {selectedData.totalHours.toFixed(1)}h total
              </span>
            ) : (
              <span className="text-muted text-sm">No tasks</span>
            )}
          </div>
          {selectedData?.tasks.map((task) => (
            <div key={task._id} className="heatmap-task-row">
              <div
                className="heatmap-task-dot"
                style={{ background: IMPORTANCE_COLOR[task.importance] }}
              />
              <span className="text-sm truncate flex-1">{task.title}</span>
              <span className="text-xs text-muted">
                {task.estimatedDuration}h
              </span>
              <span className={`badge badge-${task.importance}`}>
                {task.importance}
              </span>
            </div>
          ))}
          {/* Hours bar */}
          {selectedData && (
            <div className="heatmap-bar-wrap">
              <div className="heatmap-bar">
                <div
                  className="heatmap-bar-fill"
                  style={{
                    width: `${Math.min(100, (selectedData.totalHours / 10) * 100)}%`,
                    background:
                      selectedData.totalHours > 8
                        ? "var(--red)"
                        : selectedData.totalHours > 5
                          ? "var(--yellow)"
                          : "var(--mauve)",
                  }}
                />
                <div
                  className="heatmap-bar-mark"
                  style={{ left: "80%" }}
                  title="8h limit"
                />
              </div>
              <div className="heatmap-bar-labels">
                <span className="text-xs text-muted">0h</span>
                <span className="text-xs text-muted">8h (max)</span>
                <span className="text-xs text-muted">10h+</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
