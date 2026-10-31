/**
 * LeetCode Platform Connector
 * Supports permitted public GraphQL query with graceful user-confirmed manual fallback
 * (Respects platform terms: no brute-force scraping or bypassing bot protections)
 */

const extractLeetCodeUsername = (input = "") => {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, "");
  clean = clean.split("/")[0].split("?")[0].trim();
  return clean;
};

const LEETCODE_GRAPHQL_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      userAvatar
      realName
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}
`;

const fetchLeetCodeData = async (rawInput, userConfirmedPayload = null) => {
  const username = extractLeetCodeUsername(rawInput);
  if (!username) {
    const err = new Error("Please provide a valid LeetCode username or profile URL.");
    err.statusCode = 400;
    throw err;
  }

  // If user explicitly provided confirmed stats (manual entry mode)
  if (userConfirmedPayload && userConfirmedPayload.isManual) {
    const total =
      (userConfirmedPayload.easy || 0) +
      (userConfirmedPayload.medium || 0) +
      (userConfirmedPayload.hard || 0) ||
      userConfirmedPayload.totalSolved ||
      0;

    return {
      platform: "leetcode",
      username,
      profileUrl: `https://leetcode.com/u/${username}`,
      connectionStatus: "connected",
      verificationStatus: "user_confirmed",
      retrievalMethod: "user_input",
      summary: {
        primaryMetric: `${total} Problems Solved`,
        secondaryMetric: userConfirmedPayload.contestRating
          ? `Rating: ${Math.round(userConfirmedPayload.contestRating)}`
          : `${userConfirmedPayload.medium || 0} Medium • ${userConfirmedPayload.hard || 0} Hard`,
        headline: userConfirmedPayload.headline || "Self-verified LeetCode problem solving record",
        avatarUrl: ""
      },
      importedData: {
        totalSolved: total,
        easy: userConfirmedPayload.easy || 0,
        medium: userConfirmedPayload.medium || 0,
        hard: userConfirmedPayload.hard || 0,
        contestRating: userConfirmedPayload.contestRating || null,
        globalRanking: userConfirmedPayload.globalRanking || null
      },
      selectedItems: [],
      lastSyncedAt: new Date(),
      syncError: null
    };
  }

  // Attempt live public GraphQL query
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NEXORA/1.0"
      },
      body: JSON.stringify({
        query: LEETCODE_GRAPHQL_QUERY,
        variables: { username }
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`LeetCode service returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const matchedUser = json?.data?.matchedUser;

    if (!matchedUser) {
      const err = new Error(`LeetCode user "${username}" was not found or profile is private.`);
      err.statusCode = 404;
      err.canFallbackToManual = true;
      throw err;
    }

    const subList = matchedUser.submitStats?.acSubmissionNum || [];
    const all = subList.find((s) => s.difficulty === "All")?.count || 0;
    const easy = subList.find((s) => s.difficulty === "Easy")?.count || 0;
    const medium = subList.find((s) => s.difficulty === "Medium")?.count || 0;
    const hard = subList.find((s) => s.difficulty === "Hard")?.count || 0;

    const contest = json?.data?.userContestRanking;
    const contestRating = contest?.rating ? Math.round(contest.rating) : null;
    const globalRanking = contest?.globalRanking || matchedUser.profile?.ranking || null;

    return {
      platform: "leetcode",
      username,
      profileUrl: `https://leetcode.com/u/${username}`,
      connectionStatus: "connected",
      verificationStatus: "api_verified",
      retrievalMethod: "public_graphql",
      summary: {
        primaryMetric: `${all} Problems Solved`,
        secondaryMetric: contestRating
          ? `Contest Rating: ${contestRating}`
          : `${medium} Medium • ${hard} Hard`,
        headline: `Global Rank: #${globalRanking ? globalRanking.toLocaleString() : "N/A"}`,
        avatarUrl: matchedUser.profile?.userAvatar || ""
      },
      importedData: {
        totalSolved: all,
        easy,
        medium,
        hard,
        contestRating,
        globalRanking
      },
      selectedItems: [],
      lastSyncedAt: new Date(),
      syncError: null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    // If GraphQL is blocked or failed, allow fallback to manual entry
    const friendlyErr = new Error(
      err.statusCode === 404
        ? err.message
        : "Automated LeetCode sync was restricted by anti-bot checks. Please confirm your problem stats manually."
    );
    friendlyErr.statusCode = err.statusCode || 422;
    friendlyErr.canFallbackToManual = true;
    friendlyErr.username = username;
    throw friendlyErr;
  }
};

module.exports = {
  extractLeetCodeUsername,
  fetchLeetCodeData
};
