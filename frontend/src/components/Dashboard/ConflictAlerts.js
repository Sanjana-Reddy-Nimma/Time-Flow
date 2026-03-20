import React, { useEffect, useState } from "react";
import { tasksAPI } from "../../utils/api";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import "./ConflictAlerts.css";

// Use CSS class names instead of hardcoded rgba so light theme works
const SEVERITY_CONFIG = {
  high: { icon: AlertTriangle, color: "var(--red)", cls: "conflict-high" },
  medium: { icon: AlertCircle, color: "var(--yellow)", cls: "conflict-medium" },
  low: { icon: Info, color: "var(--blue)", cls: "conflict-low" },
};

const TYPE_LABEL = {
  critical_clash: "Critical Clash",
  overloaded_day: "Overloaded Day",
  crowded_deadline: "Crowded Deadline",
  dependency_risk: "Dependency Risk",
};

export default function ConflictAlerts() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    tasksAPI
      .getConflicts()
      .then(({ data }) => setConflicts(data.conflicts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || conflicts.length === 0) return null;

  const high = conflicts.filter((c) => c.severity === "high").length;
  const medium = conflicts.filter((c) => c.severity === "medium").length;
  const shown = expanded ? conflicts : conflicts.slice(0, 3);

  return (
    <div className="conflict-alerts-wrap">
      <div className="conflict-alerts-header">
        <AlertTriangle size={15} className="text-red" />
        <span className="font-semibold text-sm">
          Scheduling Conflicts Detected
        </span>
        <div className="conflict-counts">
          {high > 0 && <span className="conflict-badge high">{high} high</span>}
          {medium > 0 && (
            <span className="conflict-badge medium">{medium} medium</span>
          )}
        </div>
      </div>

      <div className="conflict-list">
        {shown.map((c, i) => {
          const cfg = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.low;
          const Icon = cfg.icon;
          return (
            <div key={i} className={`conflict-item animate-fade ${cfg.cls}`}>
              <Icon
                size={14}
                style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }}
              />
              <div className="conflict-body">
                <div className="conflict-title">
                  <span className="conflict-type" style={{ color: cfg.color }}>
                    {TYPE_LABEL[c.type] || c.type}
                  </span>
                  <span className="text-xs text-muted">
                    {format(new Date(c.date), "MMM d")}
                  </span>
                </div>
                <p className="conflict-msg">{c.message}</p>
                {c.tasks?.length > 0 && (
                  <div className="conflict-tasks">
                    {c.tasks.slice(0, 3).map((t, j) => (
                      <span key={j} className="conflict-task-chip">
                        {t.title}
                      </span>
                    ))}
                    {c.tasks.length > 3 && (
                      <span className="conflict-task-chip muted">
                        +{c.tasks.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {conflicts.length > 3 && (
        <button
          className="conflict-toggle-btn"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} /> Show {conflicts.length - 3} more
            </>
          )}
        </button>
      )}
    </div>
  );
}
