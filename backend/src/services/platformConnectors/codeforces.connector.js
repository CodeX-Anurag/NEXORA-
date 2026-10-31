/**
 * Codeforces Platform Connector (Official Codeforces REST API)
 */

const extractCodeforcesHandle = (input = "") => {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/^https?:\/\/(?:www\.)?codeforces\.com\/profile\//i, "");
  clean = clean.split("/")[0].split("?")[0].trim();
  return clean;
};

const fetchCodeforcesData = async (rawInput) => {
  const handle = extractCodeforcesHandle(rawInput);
  if (!handle) {
    const err = new Error("Please provide a valid Codeforces handle or profile URL.");
    err.statusCode = 400;
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const [infoRes, ratingRes] = await Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, {
        signal: controller.signal
      }),
      fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`, {
        signal: controller.signal
      })
    ]);

    clearTimeout(timeoutId);

    const infoJson = await infoRes.json();
    if (infoJson.status !== "OK" || !infoJson.result?.[0]) {
      const err = new Error(`Codeforces handle "${handle}" was not found.`);
      err.statusCode = 404;
      throw err;
    }

    const user = infoJson.result[0];
    const ratingJson = ratingRes.ok ? await ratingRes.json() : { result: [] };
    const contestCount = Array.isArray(ratingJson.result) ? ratingJson.result.length : 0;

    const rank = user.rank || "unranked";
    const maxRank = user.maxRank || rank;
    const rating = user.rating || 0;
    const maxRating = user.maxRating || rating;

    return {
      platform: "codeforces",
      username: user.handle,
      profileUrl: `https://codeforces.com/profile/${user.handle}`,
      connectionStatus: "connected",
      verificationStatus: "api_verified",
      retrievalMethod: "official_api",
      summary: {
        primaryMetric: `Rating: ${rating} (${rank.charAt(0).toUpperCase() + rank.slice(1)})`,
        secondaryMetric: `Peak: ${maxRating} (${maxRank}) • ${contestCount} Contests`,
        headline: `Competitive programmer on Codeforces with ${contestCount} contest participations`,
        avatarUrl: user.titlePhoto || user.avatar || ""
      },
      importedData: {
        handle: user.handle,
        rating,
        maxRating,
        rank,
        maxRank,
        contribution: user.contribution || 0,
        friendOfCount: user.friendOfCount || 0,
        contestCount
      },
      selectedItems: [],
      lastSyncedAt: new Date(),
      syncError: null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Codeforces API request timed out after 10 seconds.");
      timeoutErr.statusCode = 408;
      throw timeoutErr;
    }
    throw err;
  }
};

module.exports = {
  extractCodeforcesHandle,
  fetchCodeforcesData
};
