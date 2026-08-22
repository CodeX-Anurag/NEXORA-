const reminderJob = require("../jobs/reminder.job");

let timerId = null;
let isJobRunning = false;

const schedulerMetrics = {
  totalJobRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  notificationsCreated: 0,
  duplicatesSkipped: 0,
  lastRunTimestamp: null
};

/**
 * Execute single scheduler cycle with concurrency lock & telemetry
 */
const executeJobCycle = async () => {
  if (isJobRunning) {
    return { skippedOverlap: true };
  }

  isJobRunning = true;
  schedulerMetrics.totalJobRuns += 1;
  const startTime = Date.now();

  try {
    const stats = await reminderJob.runReminderJob();
    schedulerMetrics.successfulRuns += 1;
    schedulerMetrics.notificationsCreated += stats.createdCount || 0;
    schedulerMetrics.duplicatesSkipped += stats.skippedDuplicates || 0;
    schedulerMetrics.lastRunTimestamp = new Date().toISOString();

    return { success: true, stats, durationMs: Date.now() - startTime };
  } catch (err) {
    schedulerMetrics.failedRuns += 1;
    console.warn(`[Job Scheduler Warning] Cycle error: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    isJobRunning = false;
  }
};

/**
 * Start periodic in-process background job scheduler
 */
const startScheduler = (intervalMs = 300000) => {
  if (timerId) {
    return; // Already running
  }

  // Execute initial cycle asynchronously without blocking startup
  executeJobCycle().catch(() => {});

  timerId = setInterval(() => {
    executeJobCycle().catch(() => {});
  }, intervalMs);

  if (timerId.unref) {
    timerId.unref(); // Allow Node process to exit gracefully if only timer remains
  }
};

/**
 * Stop background scheduler cleanly during graceful shutdown
 */
const stopScheduler = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isJobRunning = false;
};

/**
 * Get background job scheduler telemetry metrics (for 11B observability)
 */
const getSchedulerMetrics = () => {
  return {
    isRunning: Boolean(timerId),
    isExecutingNow: isJobRunning,
    metrics: { ...schedulerMetrics }
  };
};

/**
 * Reset scheduler metrics (for tests)
 */
const resetSchedulerState = () => {
  stopScheduler();
  schedulerMetrics.totalJobRuns = 0;
  schedulerMetrics.successfulRuns = 0;
  schedulerMetrics.failedRuns = 0;
  schedulerMetrics.notificationsCreated = 0;
  schedulerMetrics.duplicatesSkipped = 0;
  schedulerMetrics.lastRunTimestamp = null;
};

module.exports = {
  startScheduler,
  stopScheduler,
  executeJobCycle,
  getSchedulerMetrics,
  resetSchedulerState
};
