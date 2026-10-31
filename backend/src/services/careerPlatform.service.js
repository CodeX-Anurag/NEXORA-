const PlatformConnection = require("../models/PlatformConnection.model");
const Project = require("../models/Project.model");
const ResumeProfile = require("../models/ResumeProfile.model");
const { fetchGithubData } = require("./platformConnectors/github.connector");
const { fetchLeetCodeData } = require("./platformConnectors/leetcode.connector");
const { fetchCodeforcesData } = require("./platformConnectors/codeforces.connector");
const { processLinkedInData } = require("./platformConnectors/linkedin.connector");
const { fetchPortfolioData } = require("./platformConnectors/portfolio.connector");

const SUPPORTED_PLATFORMS = ["github", "leetcode", "codeforces", "linkedin", "portfolio"];

/**
 * 1. Retrieve all platform connections for authenticated user
 */
const getUserPlatforms = async (userId) => {
  const connections = await PlatformConnection.find({ userId }).lean();

  const connectionMap = new Map();
  connections.forEach((c) => connectionMap.set(c.platform, c));

  // Assemble full status array for all supported platforms
  const platforms = SUPPORTED_PLATFORMS.map((platformName) => {
    const existing = connectionMap.get(platformName);
    if (existing) {
      return existing;
    }
    return {
      platform: platformName,
      connectionStatus: "disconnected",
      verificationStatus: "unverified",
      username: "",
      profileUrl: "",
      summary: {},
      importedData: {},
      selectedItems: [],
      lastSyncedAt: null,
      syncError: null
    };
  });

  const connectedCount = connections.filter((c) => c.connectionStatus === "connected").length;

  return {
    success: true,
    connectedCount,
    totalSupported: SUPPORTED_PLATFORMS.length,
    platforms
  };
};

/**
 * 2. Connect or sync a platform for user
 */
const connectOrSyncPlatform = async (userId, platform, payload = {}) => {
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    const err = new Error(`Platform "${platform}" is not supported.`);
    err.statusCode = 400;
    throw err;
  }

  let connectionResult;

  if (platform === "github") {
    connectionResult = await fetchGithubData(payload.username || payload.profileUrl);
  } else if (platform === "leetcode") {
    connectionResult = await fetchLeetCodeData(payload.username || payload.profileUrl, payload);
  } else if (platform === "codeforces") {
    connectionResult = await fetchCodeforcesData(payload.username || payload.profileUrl);
  } else if (platform === "linkedin") {
    connectionResult = await processLinkedInData(payload.profileUrl || payload.username, payload);
  } else if (platform === "portfolio") {
    connectionResult = await fetchPortfolioData(payload.profileUrl, payload.title);
  }

  // Preserve existing user customizations for selected items if previously customized
  const existingConn = await PlatformConnection.findOne({ userId, platform });
  if (existingConn && Array.isArray(existingConn.selectedItems) && existingConn.selectedItems.length > 0) {
    const customMap = new Map(existingConn.selectedItems.map((item) => [item.id, item]));

    connectionResult.selectedItems = connectionResult.selectedItems.map((freshItem) => {
      const custom = customMap.get(freshItem.id);
      if (custom) {
        return {
          ...freshItem,
          title: custom.title || freshItem.title,
          description: custom.description || freshItem.description,
          techStack: custom.techStack?.length ? custom.techStack : freshItem.techStack,
          bulletPoints: custom.bulletPoints?.length ? custom.bulletPoints : freshItem.bulletPoints,
          selectedForResume: custom.selectedForResume !== undefined ? custom.selectedForResume : true
        };
      }
      return freshItem;
    });
  }

  const savedConnection = await PlatformConnection.findOneAndUpdate(
    { userId, platform },
    {
      ...connectionResult,
      userId
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    success: true,
    message: `${platform.toUpperCase()} connected and synchronized successfully.`,
    connection: savedConnection
  };
};

/**
 * 3. Disconnect platform and clean up connection data
 */
const disconnectPlatform = async (userId, platform) => {
  const result = await PlatformConnection.findOneAndDelete({ userId, platform });
  if (!result) {
    const err = new Error(`No active connection found for platform "${platform}".`);
    err.statusCode = 404;
    throw err;
  }

  return {
    success: true,
    message: `${platform.toUpperCase()} account disconnected and data removed.`
  };
};

/**
 * 4. Update user's selected repositories/items for resume
 */
const updateSelectedItems = async (userId, platform, selectedItems) => {
  const connection = await PlatformConnection.findOne({ userId, platform });
  if (!connection) {
    const err = new Error(`Connection for "${platform}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  connection.selectedItems = selectedItems;
  await connection.save();

  return {
    success: true,
    message: "Selected items updated.",
    selectedItems: connection.selectedItems
  };
};

/**
 * 5. Sync selected GitHub projects into NEXORA's core Project collection
 */
const syncToNexoraProjects = async (userId) => {
  const githubConn = await PlatformConnection.findOne({ userId, platform: "github" });
  if (!githubConn || !Array.isArray(githubConn.selectedItems) || githubConn.selectedItems.length === 0) {
    const err = new Error("No selected GitHub projects found to sync. Please connect GitHub and select projects.");
    err.statusCode = 400;
    throw err;
  }

  const selected = githubConn.selectedItems.filter((i) => i.selectedForResume !== false);
  const syncedProjects = [];

  for (const item of selected) {
    let proj = await Project.findOne({ userId, githubUrl: item.url });
    if (!proj) {
      proj = new Project({
        userId,
        title: item.title,
        description: item.description,
        techStack: item.techStack || [],
        status: "completed",
        githubUrl: item.url
      });
    } else {
      proj.title = item.title;
      proj.description = item.description;
      proj.techStack = item.techStack || proj.techStack;
    }
    await proj.save();
    syncedProjects.push(proj);
  }

  return {
    success: true,
    message: `Synchronized ${syncedProjects.length} GitHub projects to your NEXORA portfolio.`,
    projects: syncedProjects
  };
};

/**
 * 6. Sync verified platform data into Resume Profile
 */
const syncToResumeProfile = async (userId) => {
  const [connections, resumeProfile] = await Promise.all([
    PlatformConnection.find({ userId }).lean(),
    ResumeProfile.findOne({ userId })
  ]);

  if (!resumeProfile) {
    const err = new Error("Resume profile not found. Please open Resume Builder to initialize your profile.");
    err.statusCode = 404;
    throw err;
  }

  const github = connections.find((c) => c.platform === "github" && c.connectionStatus === "connected");
  const leetcode = connections.find((c) => c.platform === "leetcode" && c.connectionStatus === "connected");
  const codeforces = connections.find((c) => c.platform === "codeforces" && c.connectionStatus === "connected");
  const linkedin = connections.find((c) => c.platform === "linkedin" && c.connectionStatus === "connected");
  const portfolio = connections.find((c) => c.platform === "portfolio" && c.connectionStatus === "connected");

  // Update links
  if (github?.profileUrl && !resumeProfile.personalInfo.github) {
    resumeProfile.personalInfo.github = github.profileUrl;
  }
  if (linkedin?.profileUrl && !resumeProfile.personalInfo.linkedin) {
    resumeProfile.personalInfo.linkedin = linkedin.profileUrl;
  }
  if (portfolio?.profileUrl && !resumeProfile.personalInfo.portfolio) {
    resumeProfile.personalInfo.portfolio = portfolio.profileUrl;
  }

  // Add verified GitHub projects
  if (github && Array.isArray(github.selectedItems)) {
    const activeSelected = github.selectedItems.filter((i) => i.selectedForResume !== false);
    const existingTitles = new Set((resumeProfile.projects || []).map((p) => p.title.toLowerCase()));

    activeSelected.forEach((repo) => {
      if (!existingTitles.has(repo.title.toLowerCase())) {
        resumeProfile.projects.push({
          title: repo.title,
          description: repo.description,
          techStack: repo.techStack || [],
          bulletPoints: repo.bulletPoints?.length
            ? repo.bulletPoints
            : [`Architected repository with ${repo.stars} stars and ${repo.forks} forks.`],
          githubUrl: repo.url,
          demoUrl: ""
        });
        existingTitles.add(repo.title.toLowerCase());
      }
    });
  }

  // Add verified coding platform achievements
  const existingAchTitles = new Set((resumeProfile.achievements || []).map((a) => a.title.toLowerCase()));

  if (leetcode && leetcode.importedData?.totalSolved) {
    const title = "LeetCode Competitive Problem Solving";
    if (!existingAchTitles.has(title.toLowerCase())) {
      resumeProfile.achievements.push({
        title,
        issuer: "LeetCode",
        date: "Present",
        description: `Solved ${leetcode.importedData.totalSolved} algorithmic problems (${leetcode.importedData.medium || 0} Medium, ${leetcode.importedData.hard || 0} Hard)${leetcode.importedData.contestRating ? ` with contest rating ${leetcode.importedData.contestRating}` : ""}.`
      });
      existingAchTitles.add(title.toLowerCase());
    }
  }

  if (codeforces && codeforces.importedData?.rating) {
    const title = `Codeforces Rating ${codeforces.importedData.rating} (${codeforces.importedData.rank})`;
    if (!existingAchTitles.has(title.toLowerCase())) {
      resumeProfile.achievements.push({
        title,
        issuer: "Codeforces",
        date: "Present",
        description: `Achieved ${codeforces.importedData.rank} tier with peak rating ${codeforces.importedData.maxRating} across ${codeforces.importedData.contestCount} contests.`
      });
      existingAchTitles.add(title.toLowerCase());
    }
  }

  resumeProfile.lastConfirmedAt = new Date();
  await resumeProfile.save();

  return {
    success: true,
    message: "Verified platform metrics and repositories synchronized to your Resume Profile.",
    profile: resumeProfile
  };
};

module.exports = {
  getUserPlatforms,
  connectOrSyncPlatform,
  disconnectPlatform,
  updateSelectedItems,
  syncToNexoraProjects,
  syncToResumeProfile
};
