import React, { useEffect, useState } from "react";
import { statsAPI } from "../../utils/api";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Award, Clock, Target } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "./ProgressView.css";

// Colors that work for both themes by using the CSS variable values
const IMPORTANCE_COLORS_DARK = {
  low: "#a6e3a1",
  medium: "#f9e2af",
  high: "#fab387",
  critical: "#f38ba8",
};
const IMPORTANCE_COLORS_LIGHT = {
  low: "#15803d",
  medium: "#b45309",
  high: "#c2410c",
  critical: "#b91c1c",
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <div className="font-semibold text-sm">{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: "0.8rem" }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ProgressView() {
  const [dashData, setDashData] = useState(null);
  const [prodData, setProdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const IMP_COLORS = isDark ? IMPORTANCE_COLORS_DARK : IMPORTANCE_COLORS_LIGHT;
  const gridColor = isDark ? "#313244" : "#dde2f0";
  const axisColor = isDark ? "#7f849c" : "#6b748f";
  const barColor = isDark ? "#cba6f7" : "#6d28d9";
  const lineColor = isDark ? "#cba6f7" : "#6d28d9";

  useEffect(() => {
    const load = async () => {
      try {
        const [d, p] = await Promise.all([
          statsAPI.getDashboard(),
          statsAPI.getProductivity(),
        ]);
        setDashData(d.data);
        setProdData(p.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loader" />
      </div>
    );
  if (!dashData) return <p className="text-muted">Failed to load stats.</p>;

  const { stats, weeklyTrend, importanceStats } = dashData;

  const pieData =
    importanceStats?.map((s) => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count,
    })) || [];
  const pieColors = importanceStats?.map((s) => IMP_COLORS[s._id]) || [];

  const monthlyData =
    prodData?.monthlyData?.map((m) => ({
      name: format(new Date(m._id.year, m._id.month - 1), "MMM yy"),
      completed: m.count,
    })) || [];

  const ringStroke = isDark ? "#cba6f7" : "#6d28d9";
  const ringTrack = isDark ? "#313244" : "#dde2f0";
  const ringTextColor = isDark ? "#cdd6f4" : "#111827";
  const completionRate = stats.completionRate;

  return (
    <div className="progress-page animate-fade">
      <div className="page-header">
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="progress-stats-grid">
        {[
          {
            icon: Target,
            value: stats.total,
            label: "Total Tasks",
            accent: "var(--mauve)",
            cls: "si-mauve",
          },
          {
            icon: Award,
            value: stats.completed,
            label: "Completed",
            accent: "var(--green)",
            cls: "si-green",
          },
          {
            icon: Clock,
            value: stats.pending,
            label: "Pending",
            accent: "var(--yellow)",
            cls: "si-yellow",
          },
          {
            icon: TrendingUp,
            value: `${completionRate}%`,
            label: "Completion Rate",
            accent:
              completionRate >= 70
                ? "var(--green)"
                : completionRate >= 40
                  ? "var(--yellow)"
                  : "var(--red)",
            cls:
              completionRate >= 70
                ? "si-green"
                : completionRate >= 40
                  ? "si-yellow"
                  : "si-red",
          },
        ].map(({ icon: Icon, value, label, accent, cls }) => (
          <div key={label} className="card prog-stat">
            <div className={`prog-stat-icon ${cls}`}>
              <Icon size={20} />
            </div>
            <div className="prog-stat-num" style={{ color: accent }}>
              {value}
            </div>
            <div className="prog-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="charts-row">
        {/* Completion donut */}
        <div className="card chart-box">
          <h3 className="chart-title">Overall Completion</h3>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={ringTrack}
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={ringStroke}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionRate / 100)}`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              <text
                x="60"
                y="65"
                textAnchor="middle"
                fill={ringTextColor}
                fontSize="20"
                fontWeight="800"
                fontFamily="Outfit"
              >
                {completionRate}%
              </text>
            </svg>
          </div>
          <div className="donut-legend">
            {[
              { color: "var(--green)", label: `${stats.completed} Completed` },
              { color: "var(--yellow)", label: `${stats.pending} Pending` },
              ...(stats.overdue > 0
                ? [{ color: "var(--red)", label: `${stats.overdue} Overdue` }]
                : []),
            ].map(({ color, label }) => (
              <div key={label} className="dl-item">
                <span className="dl-dot" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Importance pie */}
        <div className="card chart-box">
          <h3 className="chart-title">By Importance</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--mantle)",
                    border: "1px solid var(--surface0)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--subtext0)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: "30px" }}>
              <p className="text-muted text-sm">No data yet</p>
            </div>
          )}
        </div>

        {/* 7-day bar */}
        <div className="card chart-box">
          <h3 className="chart-title">7-Day Completions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTrend} barSize={28}>
              <XAxis
                dataKey="day"
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(109,40,217,0.04)" }}
              />
              <Bar
                dataKey="count"
                fill={barColor}
                radius={[4, 4, 0, 0]}
                name="Tasks"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 */}
      {prodData && (
        <div className="charts-row">
          {/* Monthly trend */}
          <div className="card chart-box" style={{ gridColumn: "span 2" }}>
            <h3 className="chart-title">Monthly Completion Trend</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={lineColor}
                    strokeWidth={2.5}
                    dot={{ fill: lineColor, r: 4 }}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: "30px" }}>
                <p className="text-muted text-sm">
                  Complete tasks to see trends
                </p>
              </div>
            )}
          </div>

          {/* Punctuality */}
          <div className="card chart-box">
            <h3 className="chart-title">Punctuality</h3>
            <div className="punctuality-stats">
              <div className="punct-item">
                <span className="punct-num" style={{ color: "var(--green)" }}>
                  {prodData.onTime}
                </span>
                <span className="punct-label">On Time</span>
              </div>
              <div className="punct-divider" />
              <div className="punct-item">
                <span className="punct-num" style={{ color: "var(--red)" }}>
                  {prodData.late}
                </span>
                <span className="punct-label">Late</span>
              </div>
            </div>
            {prodData.avgEstimated > 0 && (
              <div className="duration-stats">
                <div className="dur-row">
                  <span className="text-xs text-muted">Avg Estimated</span>
                  <span className="text-sm font-semibold">
                    {prodData.avgEstimated}h
                  </span>
                </div>
                <div className="dur-row">
                  <span className="text-xs text-muted">Avg Actual</span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color:
                        prodData.avgActual > prodData.avgEstimated
                          ? "var(--red)"
                          : "var(--green)",
                    }}
                  >
                    {prodData.avgActual}h
                  </span>
                </div>
                <div className="dur-row">
                  <span className="text-xs text-muted">Accuracy</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--mauve)" }}
                  >
                    {prodData.avgEstimated > 0
                      ? Math.round(
                          (1 -
                            Math.abs(
                              prodData.avgActual - prodData.avgEstimated,
                            ) /
                              prodData.avgEstimated) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
