import React, { useState, useEffect, useCallback } from "react";
import { tasksAPI } from "../../utils/api";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CalendarView.css";

const IMPORTANCE_DOT = {
  low: "var(--green)",
  medium: "var(--yellow)",
  high: "var(--peach)",
  critical: "var(--red)",
};

function buildCalendarDays(currentMonth) {
  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadTasks = useCallback(async (month) => {
    setLoading(true);
    try {
      const { data } = await tasksAPI.getCalendar(
        month.getFullYear(),
        month.getMonth() + 1,
      );
      setTasks(data.tasks);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks(currentMonth);
  }, [currentMonth, loadTasks]);

  const days = buildCalendarDays(currentMonth);
  const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getTasksForDay = (day) =>
    tasks.filter((t) => isSameDay(new Date(t.deadline), day));

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="calendar-page animate-fade">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">View tasks by deadline</p>
      </div>

      <div className="calendar-layout">
        <div className="card calendar-card">
          {/* Nav */}
          <div className="cal-nav">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="cal-month-title">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </button>
          </div>

          {/* Week days */}
          <div className="cal-weekdays">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="cal-weekday">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className={`cal-grid ${loading ? "loading" : ""}`}>
            {days.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <div
                  key={i}
                  className={`cal-day ${!isCurrentMonth ? "other-month" : ""} ${today ? "today" : ""} ${isSelected ? "selected" : ""} ${dayTasks.length > 0 ? "has-tasks" : ""}`}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                >
                  <span className="cal-day-num">{format(day, "d")}</span>
                  {dayTasks.length > 0 && (
                    <div className="cal-dots">
                      {dayTasks.slice(0, 4).map((t, j) => (
                        <span
                          key={j}
                          className="cal-dot"
                          style={{ background: IMPORTANCE_DOT[t.importance] }}
                        />
                      ))}
                      {dayTasks.length > 4 && (
                        <span className="cal-dot-more">
                          +{dayTasks.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="cal-detail">
          {selectedDay ? (
            <div className="card cal-detail-card animate-scale">
              <div className="cal-detail-header">
                <Calendar size={15} className="text-mauve" />
                <span className="font-semibold">
                  {format(selectedDay, "EEEE, MMM d")}
                </span>
                <span className="text-muted text-sm">
                  {selectedTasks.length} task
                  {selectedTasks.length !== 1 ? "s" : ""}
                </span>
              </div>

              {selectedTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: "30px 20px" }}>
                  <p className="text-muted text-sm">No tasks due this day</p>
                </div>
              ) : (
                <div className="cal-task-list">
                  {selectedTasks.map((task) => (
                    <div
                      key={task._id}
                      className="cal-task-item"
                      style={{ "--imp": IMPORTANCE_DOT[task.importance] }}
                      onClick={() => navigate(`/task/${task._id}`)}
                    >
                      <div
                        className="cal-task-dot"
                        style={{ background: IMPORTANCE_DOT[task.importance] }}
                      />
                      <div className="cal-task-info">
                        <div className="cal-task-title">{task.title}</div>
                        <div className="cal-task-meta">
                          <span className={`badge badge-${task.importance}`}>
                            {task.importance}
                          </span>
                          <span className={`badge badge-${task.status}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card cal-hint">
              <Calendar
                size={28}
                className="text-muted"
                style={{ marginBottom: 10 }}
              />
              <p className="font-semibold text-sm">Select a day</p>
              <p className="text-muted text-sm">
                Click any date to see tasks due that day
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="card cal-legend">
            <p className="font-semibold text-sm" style={{ marginBottom: 10 }}>
              Legend
            </p>
            {Object.entries(IMPORTANCE_DOT).map(([key, color]) => (
              <div key={key} className="legend-row">
                <span className="legend-dot" style={{ background: color }} />
                <span className="text-sm text-muted capitalize">
                  {key} priority
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
