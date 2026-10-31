/**
 * NEXORA Task AI Intelligence Service
 * Powers AI Task Breakdown, AI Daily Planning, Deadline Risk Detection, and Smart Rescheduling
 */

const LLMClient = require("../ai/llmClient");

/**
 * Robustly parses JSON from LLM output
 */
const parseJsonFromLlm = (text) => {
  if (!text) return null;
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * 1. AI Task Breakdown
 * Takes a high-level student/dev goal (e.g. "Prepare for DBMS exam") and breaks it into actionable tasks
 */
const breakdownGoal = async (goal, context = "") => {
  if (!goal || typeof goal !== "string" || goal.trim().length < 3) {
    const err = new Error("Goal description must be at least 3 characters.");
    err.statusCode = 400;
    throw err;
  }

  const prompt = `You are the NEXORA Student Productivity & Task Architect.
Break down the following student goal into 3 to 6 actionable, well-scoped tasks.

GOAL: "${goal.trim()}"
${context ? `ADDITIONAL CONTEXT: "${context.trim()}"` : ""}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON matching the exact schema below. No markdown fences, no conversational text.
2. Estimated minutes must be realistic (between 15 and 120 minutes per task).
3. Priority must be one of: "low", "medium", "high", "urgent".
4. Suggest 2-4 concrete subtasks for each task.
5. Suggest an appropriate category: "Academics", "Development", "Career", "Project", or "Personal".

SCHEMA:
{
  "goalTitle": "${goal.trim()}",
  "suggestedTasks": [
    {
      "title": "Clear actionable task name",
      "description": "Brief description of outcome",
      "category": "Academics",
      "priority": "high",
      "estimatedMinutes": 45,
      "subtasks": ["Subtask 1", "Subtask 2"]
    }
  ]
}`;

  let parsed = null;
  try {
    const llm = new LLMClient();
    const res = await llm.generateResponse({
      systemPrompt: "You are an expert student productivity planner. Return strictly valid JSON.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxOutputTokens: 2048
    });
    parsed = parseJsonFromLlm(res.content);
  } catch (err) {
    console.warn("[TaskAI] LLM breakdown warning:", err.message);
  }

  // Fallback heuristic breakdown if LLM is unavailable or returned invalid structure
  if (!parsed || !Array.isArray(parsed.suggestedTasks) || parsed.suggestedTasks.length === 0) {
    const cleanGoal = goal.trim();
    parsed = {
      goalTitle: cleanGoal,
      suggestedTasks: [
        {
          title: `Initial research and syllabus review for ${cleanGoal}`,
          description: "Review core topics, lecture notes, and requirements",
          category: "Academics",
          priority: "high",
          estimatedMinutes: 45,
          subtasks: ["Collect reference materials", "List key chapters", "Outline roadmap"]
        },
        {
          title: `Deep-dive study & conceptual problem solving for ${cleanGoal}`,
          description: "Work through high-yield concepts and hands-on exercises",
          category: "Academics",
          priority: "medium",
          estimatedMinutes: 60,
          subtasks: ["Solve exercise problems", "Note doubts and clarifications"]
        },
        {
          title: `Review and self-assessment for ${cleanGoal}`,
          description: "Test understanding and verify all prerequisites",
          category: "Academics",
          priority: "medium",
          estimatedMinutes: 30,
          subtasks: ["Quick revision", "Final checklist confirmation"]
        }
      ]
    };
  }

  return {
    success: true,
    goal: goal.trim(),
    suggestedTasks: parsed.suggestedTasks.map((t) => ({
      title: t.title || "Study Session",
      description: t.description || "",
      category: t.category || "Academics",
      priority: ["low", "medium", "high", "urgent"].includes(t.priority) ? t.priority : "medium",
      estimatedMinutes: Number(t.estimatedMinutes) || 45,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((st) => (typeof st === "string" ? st : st.title || "")) : []
    }))
  };
};

/**
 * 2. AI Daily Planner
 * Prioritizes user's pending tasks and constructs a realistic daily schedule
 */
const generateDailyPlan = async (tasks, availableHours = 6) => {
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const availableMinutes = Math.max(60, availableHours * 60);

  // Sort by priority and deadline
  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
  const sorted = [...pendingTasks].sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    if (pDiff !== 0) return pDiff;

    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const scheduledTasks = [];
  let allocatedMinutes = 0;

  for (const task of sorted) {
    const est = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : 45;
    if (allocatedMinutes + est <= availableMinutes || scheduledTasks.length === 0) {
      scheduledTasks.push({
        taskId: task._id,
        title: task.title,
        priority: task.priority,
        category: task.category || "General",
        deadline: task.deadline,
        estimatedMinutes: est,
        progress: task.progress || 0
      });
      allocatedMinutes += est;
    }
  }

  const prompt = `You are the NEXORA Student Daily Planner.
Given the candidate tasks scheduled for today within a ${availableHours}-hour budget, formulate a brief motivating plan.
Output JSON only.

TASKS:
${JSON.stringify(scheduledTasks, null, 2)}

SCHEMA:
{
  "summary": "1-2 sentence encouraging overview of the day's focus",
  "timeBlocks": [
    {
      "timeSlot": "Morning (9:00 AM - 11:00 AM)",
      "focus": "Deep work on highest priority task",
      "taskTitles": ["Task name"]
    }
  ],
  "productivityTip": "A concise tip for maintaining focus"
}`;

  let parsedPlan = null;
  try {
    const llm = new LLMClient();
    const res = await llm.generateResponse({
      systemPrompt: "You are an expert student productivity scheduler. Return strictly valid JSON.",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxOutputTokens: 1024
    });
    parsedPlan = parseJsonFromLlm(res.content);
  } catch (err) {
    console.warn("[TaskAI] LLM daily plan warning:", err.message);
  }

  if (!parsedPlan || !Array.isArray(parsedPlan.timeBlocks)) {
    parsedPlan = {
      summary: `Targeting ${scheduledTasks.length} key tasks today with an estimated ${allocatedMinutes} minutes of focused work.`,
      timeBlocks: [
        {
          timeSlot: "Block 1 — High Urgency",
          focus: "Address critical deadlines and top priority milestones",
          taskTitles: scheduledTasks.slice(0, 2).map((t) => t.title)
        },
        {
          timeSlot: "Block 2 — Steady Progress",
          focus: "Advance remaining scheduled deliverables",
          taskTitles: scheduledTasks.slice(2).map((t) => t.title)
        }
      ],
      productivityTip: "Use NEXORA Focus Mode (25m Pomodoro) to maintain deep attention during each block."
    };
  }

  return {
    success: true,
    availableHours,
    allocatedMinutes,
    scheduledTasks,
    plan: parsedPlan
  };
};

/**
 * 3. Deadline Risk Detection
 * Identifies tasks at risk based on deadline proximity, priority, and remaining subtasks
 */
const detectDeadlineRisks = (tasks) => {
  const now = new Date();
  const atRiskTasks = [];

  for (const task of tasks) {
    if (task.status === "completed") continue;
    if (!task.deadline) continue;

    const deadline = new Date(task.deadline);
    const hoursUntil = (deadline - now) / (1000 * 60 * 60);

    const isOverdue = deadline < now;
    const isImminent = hoursUntil <= 48 && hoursUntil >= 0;

    let riskLevel = null;
    let reason = "";

    if (isOverdue) {
      riskLevel = "critical";
      const daysOverdue = Math.max(1, Math.round((now - deadline) / (1000 * 60 * 60 * 24)));
      reason = `Task is overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}.`;
    } else if (isImminent) {
      const remainingSubtasks = Array.isArray(task.subtasks)
        ? task.subtasks.filter((st) => !st.completed).length
        : 0;

      if (task.priority === "urgent" || task.priority === "high") {
        riskLevel = "high";
        reason = `High-priority task due in ${Math.round(hoursUntil)} hours with ${remainingSubtasks} remaining subtasks.`;
      } else if (remainingSubtasks > 2) {
        riskLevel = "medium";
        reason = `Due in ${Math.round(hoursUntil)} hours with ${remainingSubtasks} unfinished subtasks.`;
      }
    }

    if (riskLevel) {
      atRiskTasks.push({
        taskId: task._id,
        title: task.title,
        priority: task.priority,
        deadline: task.deadline,
        riskLevel,
        reason,
        suggestedAction: isOverdue
          ? "Reschedule to a realistic target date or mark complete if finished."
          : "Start a 25-minute Focus Session now to complete first subtask."
      });
    }
  }

  return {
    success: true,
    totalAtRisk: atRiskTasks.length,
    criticalCount: atRiskTasks.filter((t) => t.riskLevel === "critical").length,
    highRiskCount: atRiskTasks.filter((t) => t.riskLevel === "high").length,
    atRiskTasks
  };
};

/**
 * 4. Smart Rescheduling Suggestion
 * Proposes a realistic new deadline for overdue tasks based on workload
 */
const suggestSmartReschedule = (task, allUserTasks) => {
  const now = new Date();
  const activeTasks = allUserTasks.filter((t) => t.status !== "completed");

  // Determine current day of week and calculate next optimal window (typically tomorrow or +2 days)
  let suggestedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  suggestedDate.setHours(18, 0, 0, 0); // 6:00 PM standard target

  // Check how many tasks already due tomorrow
  const tomorrowStr = suggestedDate.toISOString().split("T")[0];
  const tasksDueTomorrow = activeTasks.filter(
    (t) => t.deadline && new Date(t.deadline).toISOString().split("T")[0] === tomorrowStr
  ).length;

  if (tasksDueTomorrow >= 3) {
    // Push +2 days to avoid overload
    suggestedDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    suggestedDate.setHours(18, 0, 0, 0);
  }

  return {
    success: true,
    taskId: task._id,
    currentDeadline: task.deadline,
    suggestedDeadline: suggestedDate,
    reason:
      tasksDueTomorrow >= 3
        ? "Tomorrow already has 3 or more deadlines scheduled. Moving to +2 days ensures manageable workload."
        : "Tomorrow evening provides a clean window to complete this task without disruption."
  };
};

module.exports = {
  breakdownGoal,
  generateDailyPlan,
  detectDeadlineRisks,
  suggestSmartReschedule
};
