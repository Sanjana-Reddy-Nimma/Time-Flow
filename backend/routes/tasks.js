const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");
const {
  calcDEEPSScore,
  sortByDEEPS,
  compareAlgorithms,
} = require("../utils/scheduling");
const { detectConflicts } = require("../utils/conflicts");

const router = express.Router();
router.use(protect);

// ─── LIST ───────────────────────────────────────────────────────────────────
// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const {
      status,
      importance,
      tags,
      sortBy = "deeps",
      search,
      startDate,
      endDate,
    } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (importance) filter.importance = importance;
    if (tags) filter.tags = { $in: tags.split(",") };
    if (search) filter.title = { $regex: search, $options: "i" };
    if (startDate || endDate) {
      filter.deadline = {};
      if (startDate) filter.deadline.$gte = new Date(startDate);
      if (endDate) filter.deadline.$lte = new Date(endDate);
    }

    const tasks = await Task.find(filter).populate(
      "dependencies",
      "title status",
    );

    if (sortBy === "deeps") {
      const sorted = sortByDEEPS(tasks);
      return res.json({ tasks: sorted, total: sorted.length });
    }

    const sorted = tasks.sort((a, b) => {
      if (sortBy === "deadline")
        return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "duration")
        return a.estimatedDuration - b.estimatedDuration;
      if (sortBy === "created")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    res.json({ tasks: sorted, total: sorted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPECIAL NAMED ROUTES (must be BEFORE /:id) ──────────────────────────────

// GET /api/tasks/schedule/compare
router.get("/schedule/compare", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const comparison = compareAlgorithms(tasks);
    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/conflicts
router.get("/conflicts", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const conflicts = detectConflicts(tasks);
    res.json({ conflicts, total: conflicts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/tags
router.get("/tags", async (req, res) => {
  try {
    const result = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ tags: result.map((r) => ({ name: r._id, count: r.count })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/calendar/:year/:month
router.get("/calendar/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const tasks = await Task.find({
      user: req.user._id,
      deadline: { $gte: start, $lte: end },
    }).select(
      "title deadline importance status estimatedDuration priorityScore",
    );
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/bulk/status
router.patch("/bulk/status", async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids?.length || !status)
      return res.status(400).json({ error: "ids and status required" });
    const valid = ["pending", "in-progress", "completed", "cancelled"];
    if (!valid.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const updateData = { status };
    if (status === "completed") updateData.completedAt = new Date();

    const result = await Task.updateMany(
      { _id: { $in: ids }, user: req.user._id },
      updateData,
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/bulk
router.delete("/bulk", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: "ids required" });
    const result = await Task.deleteMany({
      _id: { $in: ids },
      user: req.user._id,
    });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SINGLE TASK CRUD (:id must come after named routes) ─────────────────────

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("dependencies", "title status deadline importance");
    if (!task) return res.status(404).json({ error: "Task not found" });

    const allTasks = await Task.find({ user: req.user._id });
    const score = calcDEEPSScore(task, allTasks);
    res.json({ task: { ...task.toObject(), deepsScore: score } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("deadline").isISO8601().withMessage("Valid deadline required"),
    body("importance").optional().isIn(["low", "medium", "high", "critical"]),
    body("estimatedDuration")
      .isFloat({ min: 0.1 })
      .withMessage("Duration must be positive"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const {
        title,
        description,
        deadline,
        importance,
        estimatedDuration,
        tags,
        subtasks,
        dependencies,
        isRecurring,
        recurringPattern,
      } = req.body;

      const allTasks = await Task.find({ user: req.user._id });

      const task = new Task({
        user: req.user._id,
        title,
        description,
        deadline,
        importance,
        estimatedDuration,
        tags,
        subtasks,
        dependencies,
        isRecurring,
        recurringPattern,
      });

      const score = calcDEEPSScore(task, allTasks);
      task.priorityScore = score.total;
      task.lastScoreUpdate = new Date();

      await task.save();
      res.status(201).json({ task: { ...task.toObject(), deepsScore: score } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// PUT /api/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const allowed = [
      "title",
      "description",
      "deadline",
      "importance",
      "estimatedDuration",
      "tags",
      "subtasks",
      "dependencies",
      "isRecurring",
      "recurringPattern",
    ];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });

    const allTasks = await Task.find({ user: req.user._id });
    const score = calcDEEPSScore(task, allTasks);
    task.priorityScore = score.total;
    task.lastScoreUpdate = new Date();

    await task.save();
    res.json({ task: { ...task.toObject(), deepsScore: score } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["pending", "in-progress", "completed", "cancelled"];
    if (!valid.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = status;
    if (status === "completed") task.completedAt = new Date();
    await task.save();
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/subtask/:subtaskId
router.patch("/:id/subtask/:subtaskId", async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: "Subtask not found" });

    subtask.completed = !subtask.completed;
    if (subtask.completed) subtask.completedAt = new Date();

    await task.save();
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/timelog
router.post("/:id/timelog", async (req, res) => {
  try {
    const { action, note } = req.body;
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (action === "start") {
      task.timeLogs.push({ startTime: new Date(), note });
      task.status = "in-progress";
    } else if (action === "stop") {
      const activeLog = task.timeLogs.find((l) => !l.endTime);
      if (activeLog) {
        activeLog.endTime = new Date();
        activeLog.duration = Math.round(
          (activeLog.endTime - activeLog.startTime) / 60000,
        );
      }
    }
    await task.save();
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks  (delete ALL for user)
router.delete("/", async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user._id });
    res.json({ message: "All tasks deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
