const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
});

const timeLogSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number, // in minutes
  note: String,
});

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"],
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"],
  },
  importance: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true,
    min: [0.1, "Duration must be at least 0.1 hours"],
    max: [100, "Duration cannot exceed 100 hours"],
  },
  actualDuration: {
    type: Number, // in hours, tracked via time logs
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "overdue", "cancelled"],
    default: "pending",
    index: true,
  },
  tags: [
    {
      type: String,
      trim: true,
      lowercase: true,
    },
  ],
  subtasks: [subtaskSchema],
  timeLogs: [timeLogSchema],
  dependencies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  ],
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
    interval: { type: Number, default: 1 },
    endDate: Date,
  },
  pomodoroCount: { type: Number, default: 0 },

  // DEEP-S Scheduling Score fields
  priorityScore: { type: Number, default: 0 },
  scheduledOrder: { type: Number, default: 0 }, // position in DEEP-S sorted list
  lastScoreUpdate: { type: Date, default: Date.now },

  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt
taskSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-mark overdue
  if (this.status === "pending" && this.deadline < new Date()) {
    this.status = "overdue";
  }

  // Calculate actual duration from time logs
  if (this.timeLogs && this.timeLogs.length > 0) {
    this.actualDuration = this.timeLogs
      .filter((log) => log.duration)
      .reduce((sum, log) => sum + log.duration / 60, 0);
  }

  next();
});

// Indexes for performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ user: 1, priorityScore: -1 });
taskSchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model("Task", taskSchema);
