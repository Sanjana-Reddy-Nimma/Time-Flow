/**
 * Seed script — creates demo user + sample tasks
 * Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Task = require("./models/Task");
const { calcDEEPSScore } = require("./utils/scheduling");

const DEMO_EMAIL = "demo@taskflow.com";
const DEMO_PASSWORD = "demo123";
const DEMO_NAME = "Demo User";

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 59, 0);
  return d;
}

const SAMPLE_TASKS = [
  {
    title: "Set up CI/CD pipeline",
    description:
      "Configure GitHub Actions for automated testing and deployment to staging.",
    deadline: daysFromNow(2),
    importance: "critical",
    estimatedDuration: 4,
    tags: ["devops", "backend"],
    subtasks: [
      { title: "Write GitHub Actions workflow", completed: true },
      { title: "Configure environment secrets", completed: false },
      { title: "Test deployment to staging", completed: false },
    ],
  },
  {
    title: "Write unit tests for auth module",
    description: "Cover login, register, JWT validation and edge cases.",
    deadline: daysFromNow(3),
    importance: "high",
    estimatedDuration: 3,
    tags: ["testing", "backend"],
    subtasks: [
      { title: "Test login success/failure", completed: false },
      { title: "Test JWT expiry", completed: false },
    ],
  },
  {
    title: "Design new landing page mockup",
    description:
      "Create high-fidelity Figma mockup for the new marketing landing page.",
    deadline: daysFromNow(5),
    importance: "medium",
    estimatedDuration: 6,
    tags: ["design", "frontend"],
  },
  {
    title: "Prepare Q1 progress report",
    description:
      "Compile metrics, KPIs and highlights for the quarterly board report.",
    deadline: daysFromNow(7),
    importance: "high",
    estimatedDuration: 2,
    tags: ["reporting", "management"],
  },
  {
    title: "Fix responsive layout on mobile",
    description:
      "Dashboard breaks below 480px — fix grid and sidebar overflow.",
    deadline: daysFromNow(1),
    importance: "high",
    estimatedDuration: 1.5,
    tags: ["frontend", "bug"],
  },
  {
    title: "Code review — payment service PR",
    description: "Review 3 open PRs on the payments microservice.",
    deadline: daysFromNow(1),
    importance: "medium",
    estimatedDuration: 1,
    tags: ["backend", "review"],
  },
  {
    title: "Update API documentation",
    description: "Sync Swagger docs with latest endpoint changes.",
    deadline: daysFromNow(10),
    importance: "low",
    estimatedDuration: 2,
    tags: ["docs", "backend"],
  },
  {
    title: "Weekly team standup prep",
    description: "Prepare talking points and blockers for Friday standup.",
    deadline: daysFromNow(4),
    importance: "low",
    estimatedDuration: 0.5,
    tags: ["management"],
    isRecurring: true,
    recurringPattern: { frequency: "weekly", interval: 1 },
  },
  {
    title: "Implement dark mode toggle",
    description:
      "Add CSS variable swap for light/dark theme with localStorage persistence.",
    deadline: daysFromNow(6),
    importance: "medium",
    estimatedDuration: 2,
    tags: ["frontend", "ui"],
  },
  {
    title: "Database performance audit",
    description:
      "Identify slow queries, add missing indexes, run EXPLAIN on top endpoints.",
    deadline: daysFromNow(8),
    importance: "high",
    estimatedDuration: 5,
    tags: ["backend", "database"],
  },
  {
    title: "Onboard new team member",
    description: "Set up access, walk through codebase, pair on first ticket.",
    deadline: daysFromNow(3),
    importance: "medium",
    estimatedDuration: 3,
    tags: ["management"],
  },
  {
    title: 'Read "Clean Architecture" — chapter 5',
    description: "Personal development reading.",
    deadline: daysFromNow(14),
    importance: "low",
    estimatedDuration: 1,
    tags: ["learning"],
  },
];

// One completed task
const COMPLETED_TASK = {
  title: "Deploy v1.2.0 to production",
  description: "Successful production deployment with zero downtime.",
  deadline: daysFromNow(-3),
  importance: "critical",
  estimatedDuration: 2,
  status: "completed",
  completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  tags: ["devops", "backend"],
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Upsert demo user
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    console.log("✅ Demo user created");
  } else {
    console.log("ℹ️  Demo user already exists");
  }

  // Clear existing tasks for demo user
  await Task.deleteMany({ user: user._id });
  console.log("🗑️  Cleared existing tasks");

  // Create sample tasks with DEEP-S scores
  const allTasks = [...SAMPLE_TASKS, COMPLETED_TASK];
  const created = [];

  for (const taskData of allTasks) {
    const task = new Task({ ...taskData, user: user._id });
    const score = calcDEEPSScore(task, created);
    task.priorityScore = score.total;
    task.lastScoreUpdate = new Date();
    await task.save();
    created.push(task);
    console.log(`  ✓ ${task.title} (score: ${score.total})`);
  }

  console.log(
    `\n🎉 Seeded ${created.length} tasks for demo@taskflow.com / demo123`,
  );
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
