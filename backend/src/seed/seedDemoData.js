const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const User = require("../models/User.model");
const Skill = require("../models/Skill.model");
const CareerGoal = require("../models/CareerGoal.model");
const UserSkill = require("../models/UserSkill.model");
const Task = require("../models/Task.model");
const StudySession = require("../models/StudySession.model");
const Project = require("../models/Project.model");
const { hashPassword } = require("../utils/hashing");
const { SKILLS_SEED, CAREERS_SEED } = require("./careerData");

const seed = async () => {
  try {
    await connectDB();
    console.log("[Seed] Connected to database.");

    // Seed Skill catalog
    for (const skill of SKILLS_SEED) {
      await Skill.findOneAndUpdate(
        { name: skill.name },
        skill,
        { upsert: true, new: true }
      );
    }
    console.log("[Seed] Skills catalog seeded.");

    // Seed Career catalog
    for (const career of CAREERS_SEED) {
      await CareerGoal.findOneAndUpdate(
        { title: career.title },
        career,
        { upsert: true, new: true }
      );
    }
    console.log("[Seed] Career catalog seeded.");

    const passwordHash = await hashPassword("Password123!");

    // Seed Demo Student User
    const demoStudent = await User.findOneAndUpdate(
      { email: "demo@nexora.com" },
      {
        name: "Alex Rivera",
        email: "demo@nexora.com",
        passwordHash,
        role: "student",
        education: {
          degree: "B.Tech Computer Science",
          institution: "MITS",
          year: 2026
        },
        careerGoal: {
          targetRole: "Full Stack Developer",
          targetDate: new Date("2026-12-31")
        },
        preferences: {
          theme: "dark",
          notifications: true,
          aiMemoryEnabled: true,
          profileMemoryEnabled: true,
          conversationMemoryEnabled: true,
          preferenceMemoryEnabled: true
        }
      },
      { upsert: true, new: true }
    );
    console.log("[Seed] Demo student user seeded: demo@nexora.com");

    // Seed Demo Admin User
    await User.findOneAndUpdate(
      { email: "admin@nexora.com" },
      {
        name: "System Admin",
        email: "admin@nexora.com",
        passwordHash,
        role: "admin",
        education: {
          degree: "M.Tech Information Security",
          institution: "MITS",
          year: 2024
        },
        preferences: {
          theme: "dark",
          notifications: true
        }
      },
      { upsert: true, new: true }
    );
    console.log("[Seed] Demo admin user seeded: admin@nexora.com");

    const userId = demoStudent._id;

    // Seed Skills for Demo Student
    const sampleSkills = [
      { skillName: "JavaScript", currentLevel: 80 },
      { skillName: "React", currentLevel: 75 },
      { skillName: "Node.js", currentLevel: 70 },
      { skillName: "HTML", currentLevel: 90 },
      { skillName: "CSS", currentLevel: 85 },
      { skillName: "MongoDB", currentLevel: 65 }
    ];

    for (const s of sampleSkills) {
      await UserSkill.findOneAndUpdate(
        { userId, skillName: s.skillName },
        { ...s, userId },
        { upsert: true }
      );
    }

    // Seed Sample Tasks
    const sampleTasks = [
      {
        userId,
        title: "Complete React 19 State Management & Custom Hooks",
        description: "Practice building declarative state reducers and resilient custom hooks for data fetching.",
        status: "in_progress",
        priority: "high",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        title: "Review Operating Systems Chapter 4: CPU Scheduling",
        description: "Study Round Robin, FCFS, and Multi-Level Feedback Queue algorithms.",
        status: "todo",
        priority: "medium",
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        userId,
        title: "Setup REST API endpoints for Study Tracker",
        description: "Implement Express route handlers, input validation schemas, and unit tests.",
        status: "completed",
        priority: "high",
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const t of sampleTasks) {
      await Task.findOneAndUpdate(
        { userId, title: t.title },
        t,
        { upsert: true }
      );
    }

    // Seed Study Sessions
    const sampleSessions = [
      {
        userId,
        subject: "Operating Systems",
        duration: 60,
        notes: "Deep dive into virtual memory management, paging, and page replacement algorithms.",
        date: new Date()
      },
      {
        userId,
        subject: "Full Stack Development",
        duration: 90,
        notes: "Refactored UI/UX design system with warm charcoal and terracotta aesthetics.",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId,
        subject: "Data Structures & Algorithms",
        duration: 45,
        notes: "Solved dynamic programming problems on LeetCode.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const s of sampleSessions) {
      await StudySession.findOneAndUpdate(
        { userId, subject: s.subject, notes: s.notes },
        s,
        { upsert: true }
      );
    }

    // Seed Sample Project
    await Project.findOneAndUpdate(
      { userId, title: "NEXORA Student Platform" },
      {
        userId,
        title: "NEXORA Student Platform",
        description: "AI-Powered student productivity and career intelligence platform bridging academic study and career readiness.",
        techStack: ["React 19", "Vite", "Node.js", "Express", "MongoDB", "Tailwind CSS"],
        status: "in_progress",
        githubUrl: "https://github.com/CodeX-Anurag/NEXORA-",
        demoUrl: "http://localhost:5173"
      },
      { upsert: true }
    );

    console.log("[Seed] Demo student data fully seeded!");
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Error seeding data:", err);
    process.exit(1);
  }
};

seed();
