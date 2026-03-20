/**
 * DEEP-S Scheduling Algorithm
 * Dynamic EDF + Enhanced Priority Score
 *
 * FinalScore = w1 * urgency + w2 * importance + w3 * durationBoost + w4 * dependencyBoost
 *
 * - urgency: based on time remaining vs estimated duration (dynamic, recalculates live)
 * - importance: High/Critical tasks weighted more
 * - durationBoost: slight preference for shorter tasks to minimize completion time (SJF-inspired)
 * - dependencyBoost: tasks that unblock others get priority
 */

const WEIGHTS = {
  urgency: 0.45,
  importance: 0.3,
  duration: 0.15,
  dependency: 0.1,
};

const IMPORTANCE_MAP = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Calculate urgency score (0-100) based on time remaining vs estimated duration
 * Lower hours remaining = higher urgency
 */
function calcUrgencyScore(deadline, estimatedDuration, now = new Date()) {
  const hoursRemaining = (new Date(deadline) - now) / (1000 * 60 * 60);

  // Already overdue
  if (hoursRemaining <= 0) return 100;

  // Urgency ratio: how much buffer do we have relative to task size
  const urgencyRatio = hoursRemaining / (estimatedDuration || 1);

  // Convert to a 0-100 score (lower ratio = higher urgency)
  // urgencyRatio of 1 means "just barely enough time" → very high urgency
  // urgencyRatio of 10+ means plenty of time → low urgency
  const score = Math.max(0, Math.min(100, (1 / urgencyRatio) * 50));
  return parseFloat(score.toFixed(2));
}

/**
 * Calculate importance score (0-100)
 */
function calcImportanceScore(importance) {
  const weight = IMPORTANCE_MAP[importance] || 2;
  return (weight / 4) * 100;
}

/**
 * Calculate duration boost (0-100)
 * Shorter tasks get a slight boost to minimize total completion time (SJF inspired)
 * Uses inverse sqrt to prevent starvation of long tasks
 */
function calcDurationBoost(estimatedDuration) {
  const hours = Math.max(0.1, estimatedDuration);
  const score = (1 / Math.sqrt(hours)) * 30;
  return Math.min(100, parseFloat(score.toFixed(2)));
}

/**
 * Calculate dependency boost - tasks that unblock others get priority
 */
function calcDependencyBoost(dependencyCount = 0) {
  return Math.min(100, dependencyCount * 25);
}

/**
 * Main DEEP-S score calculator
 * Returns a score 0-100 (higher = should be done sooner)
 */
function calcDEEPSScore(task, allTasks = [], now = new Date()) {
  const urgency = calcUrgencyScore(task.deadline, task.estimatedDuration, now);
  const importance = calcImportanceScore(task.importance);
  const duration = calcDurationBoost(task.estimatedDuration);

  // Count how many tasks depend on this task
  const taskId = task._id?.toString();
  const dependentCount = allTasks.filter((t) =>
    t.dependencies?.some((d) => d.toString() === taskId),
  ).length;
  const dependency = calcDependencyBoost(dependentCount);

  const score =
    WEIGHTS.urgency * urgency +
    WEIGHTS.importance * importance +
    WEIGHTS.duration * duration +
    WEIGHTS.dependency * dependency;

  return {
    total: parseFloat(score.toFixed(2)),
    breakdown: { urgency, importance, duration, dependency },
  };
}

/**
 * Sort tasks using DEEP-S algorithm
 * Returns tasks sorted by priority (highest score first)
 */
function sortByDEEPS(tasks, now = new Date()) {
  const pendingTasks = tasks.filter(
    (t) => !["completed", "cancelled"].includes(t.status),
  );

  return pendingTasks
    .map((task) => ({
      ...(task.toObject ? task.toObject() : task),
      deepsScore: calcDEEPSScore(task, pendingTasks, now),
    }))
    .sort((a, b) => b.deepsScore.total - a.deepsScore.total);
}

/**
 * Compare all scheduling algorithms on a task set
 * Returns sorted results from each algorithm for analysis
 */
function compareAlgorithms(tasks) {
  const pending = tasks.filter(
    (t) => !["completed", "cancelled"].includes(t.status),
  );
  const now = new Date();

  // FCFS - sort by creation date
  const fcfs = [...pending].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  // SJF - shortest estimated duration first
  const sjf = [...pending].sort(
    (a, b) => a.estimatedDuration - b.estimatedDuration,
  );

  // EDF - earliest deadline first
  const edf = [...pending].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline),
  );

  // Priority Score - by importance level then deadline
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const priority = [...pending].sort((a, b) => {
    const diff =
      (priorityOrder[b.importance] || 0) - (priorityOrder[a.importance] || 0);
    if (diff !== 0) return diff;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // DEEP-S
  const deeps = sortByDEEPS(tasks, now);

  return {
    fcfs: fcfs.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      importance: t.importance,
      estimatedDuration: t.estimatedDuration,
    })),
    sjf: sjf.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      importance: t.importance,
      estimatedDuration: t.estimatedDuration,
    })),
    edf: edf.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      importance: t.importance,
      estimatedDuration: t.estimatedDuration,
    })),
    priority: priority.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      importance: t.importance,
      estimatedDuration: t.estimatedDuration,
    })),
    deeps: deeps.map((t) => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      importance: t.importance,
      estimatedDuration: t.estimatedDuration,
      score: t.deepsScore,
    })),
  };
}

module.exports = {
  calcDEEPSScore,
  sortByDEEPS,
  compareAlgorithms,
  calcUrgencyScore,
  WEIGHTS,
};
