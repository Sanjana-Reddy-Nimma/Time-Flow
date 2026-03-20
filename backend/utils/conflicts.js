/**
 * Conflict Detection Utility
 * Detects workload clashes between tasks:
 * - Multiple high/critical tasks with same deadline
 * - Day is overloaded (total estimated hours exceeds a threshold)
 * - Tasks whose combined duration on one day exceeds working hours
 */

const MAX_DAILY_HOURS = 8;

/**
 * Group tasks by deadline date
 */
function groupByDate(tasks) {
  const map = {};
  tasks.forEach((task) => {
    if (["completed", "cancelled"].includes(task.status)) return;
    const key = new Date(task.deadline).toDateString();
    if (!map[key]) map[key] = [];
    map[key].push(task);
  });
  return map;
}

/**
 * Detect conflicts across all pending tasks
 * Returns array of conflict objects
 */
function detectConflicts(tasks) {
  const conflicts = [];
  const byDate = groupByDate(tasks);

  Object.entries(byDate).forEach(([dateStr, dayTasks]) => {
    const date = new Date(dateStr);

    // 1. Multiple critical tasks on same day
    const criticalTasks = dayTasks.filter((t) => t.importance === "critical");
    if (criticalTasks.length > 1) {
      conflicts.push({
        type: "critical_clash",
        severity: "high",
        date,
        tasks: criticalTasks.map((t) => ({ id: t._id, title: t.title })),
        message: `${criticalTasks.length} critical tasks all due on ${dateStr}`,
      });
    }

    // 2. Total estimated hours > threshold for one day
    const totalHours = dayTasks.reduce(
      (sum, t) => sum + (t.estimatedDuration || 0),
      0,
    );
    if (totalHours > MAX_DAILY_HOURS) {
      conflicts.push({
        type: "overloaded_day",
        severity: totalHours > MAX_DAILY_HOURS * 1.5 ? "high" : "medium",
        date,
        tasks: dayTasks.map((t) => ({
          id: t._id,
          title: t.title,
          duration: t.estimatedDuration,
        })),
        totalHours: parseFloat(totalHours.toFixed(1)),
        message: `${totalHours.toFixed(1)}h of work due on ${dateStr} (max: ${MAX_DAILY_HOURS}h)`,
      });
    }

    // 3. High priority tasks mixed with many low-priority on same deadline
    const highPrio = dayTasks.filter((t) =>
      ["high", "critical"].includes(t.importance),
    );
    if (highPrio.length > 0 && dayTasks.length >= 5) {
      conflicts.push({
        type: "crowded_deadline",
        severity: "low",
        date,
        tasks: dayTasks.map((t) => ({ id: t._id, title: t.title })),
        message: `${dayTasks.length} tasks all due on ${dateStr} — consider spreading them out`,
      });
    }
  });

  // 4. Detect tasks that have unmet dependencies
  tasks.forEach((task) => {
    if (!task.dependencies?.length) return;
    task.dependencies.forEach((depId) => {
      const dep = tasks.find((t) => t._id?.toString() === depId?.toString());
      if (!dep) return;
      if (
        dep.status !== "completed" &&
        new Date(dep.deadline) >= new Date(task.deadline)
      ) {
        conflicts.push({
          type: "dependency_risk",
          severity: "medium",
          date: new Date(task.deadline),
          tasks: [
            { id: task._id, title: task.title },
            { id: dep._id, title: dep.title },
          ],
          message: `"${task.title}" depends on "${dep.title}" but both have same or earlier deadline`,
        });
      }
    });
  });

  // Sort by date, then severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  conflicts.sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
  });

  return conflicts;
}

module.exports = { detectConflicts, groupByDate, MAX_DAILY_HOURS };
