const express = require("express");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// @GET /api/stats/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user._id;

    // Auto-mark overdue tasks
    await Task.updateMany(
      { user: userId, status: "pending", deadline: { $lt: new Date() } },
      { status: "overdue" },
    );

    const [total, completed, pending, overdue, highPriority, inProgress] =
      await Promise.all([
        Task.countDocuments({ user: userId }),
        Task.countDocuments({ user: userId, status: "completed" }),
        Task.countDocuments({ user: userId, status: "pending" }),
        Task.countDocuments({ user: userId, status: "overdue" }),
        Task.countDocuments({
          user: userId,
          importance: { $in: ["high", "critical"] },
          status: { $ne: "completed" },
        }),
        Task.countDocuments({ user: userId, status: "in-progress" }),
      ]);

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // Weekly completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompletions = await Task.find({
      user: userId,
      status: "completed",
      completedAt: { $gte: sevenDaysAgo },
    }).select("completedAt");

    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStr = date.toDateString();
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        count: recentCompletions.filter(
          (t) => new Date(t.completedAt).toDateString() === dayStr,
        ).length,
      };
    });

    // Tag distribution
    const tagStats = await Task.aggregate([
      { $match: { user: userId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Importance distribution
    const importanceStats = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$importance", count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        total,
        completed,
        pending,
        overdue,
        highPriority,
        inProgress,
        completionRate,
      },
      weeklyTrend,
      tagStats,
      importanceStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/stats/productivity
router.get("/productivity", async (req, res) => {
  try {
    const userId = req.user._id;

    // On-time vs late
    const completedTasks = await Task.find({
      user: userId,
      status: "completed",
    });
    const onTime = completedTasks.filter(
      (t) => t.completedAt <= t.deadline,
    ).length;
    const late = completedTasks.length - onTime;

    // Average estimated vs actual duration
    const tasksWithLogs = completedTasks.filter((t) => t.actualDuration > 0);
    const avgEstimated =
      tasksWithLogs.length > 0
        ? tasksWithLogs.reduce((s, t) => s + t.estimatedDuration, 0) /
          tasksWithLogs.length
        : 0;
    const avgActual =
      tasksWithLogs.length > 0
        ? tasksWithLogs.reduce((s, t) => s + t.actualDuration, 0) /
          tasksWithLogs.length
        : 0;

    // Monthly completion trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Task.aggregate([
      {
        $match: {
          user: userId,
          status: "completed",
          completedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      onTime,
      late,
      avgEstimated: parseFloat(avgEstimated.toFixed(2)),
      avgActual: parseFloat(avgActual.toFixed(2)),
      monthlyData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
