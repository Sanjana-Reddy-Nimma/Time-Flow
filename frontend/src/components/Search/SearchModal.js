import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tasksAPI } from "../../utils/api";
import { Search, X, Clock, Tag, Calendar } from "lucide-react";
import { format } from "date-fns";
import "./SearchModal.css";

const IMPORTANCE_COLOR = {
  low: "var(--green)",
  medium: "var(--yellow)",
  high: "var(--peach)",
  critical: "var(--red)",
};

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await tasksAPI.getAll({ search: q, sortBy: "deeps" });
      setResults(data.tasks.slice(0, 8));
    } catch {}
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const go = (task) => {
    navigate(`/task/${task._id}`);
    onClose();
  };

  // Arrow key navigation
  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter" && results[cursor]) go(results[cursor]);
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        className="search-modal animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-input-row">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search tasks by title, tag, or description..."
            value={query}
            onChange={handleChange}
            onKeyDown={handleKey}
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
            >
              <X size={15} />
            </button>
          )}
          <kbd className="search-kbd">ESC</kbd>
        </div>

        {(results.length > 0 || loading || query) && (
          <div className="search-results">
            {loading && (
              <div className="search-loading">
                <div
                  className="loader"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                />
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="search-empty">
                <Search size={24} />
                <p>
                  No tasks found for "<strong>{query}</strong>"
                </p>
              </div>
            )}

            {results.map((task, i) => (
              <div
                key={task._id}
                className={`search-result-row ${i === cursor ? "focused" : ""}`}
                onClick={() => go(task)}
                onMouseEnter={() => setCursor(i)}
              >
                <div
                  className="sr-accent"
                  style={{ background: IMPORTANCE_COLOR[task.importance] }}
                />
                <div className="sr-body">
                  <div className="sr-title">{highlight(task.title, query)}</div>
                  <div className="sr-meta">
                    <span className={`badge badge-${task.importance}`}>
                      {task.importance}
                    </span>
                    <span className={`badge badge-${task.status}`}>
                      {task.status}
                    </span>
                    {task.deadline && (
                      <span className="sr-meta-item">
                        <Calendar size={11} />{" "}
                        {format(new Date(task.deadline), "MMM d")}
                      </span>
                    )}
                    <span className="sr-meta-item">
                      <Clock size={11} /> {task.estimatedDuration}h
                    </span>
                    {task.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="sr-meta-item">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <kbd className="sr-enter">↵</kbd>
              </div>
            ))}

            {results.length > 0 && (
              <div className="search-footer">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>ESC close</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Highlight matching text
function highlight(text, query) {
  if (!query.trim()) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
