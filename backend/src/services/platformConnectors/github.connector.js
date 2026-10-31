/**
 * GitHub Platform Connector (Official GitHub REST API v3)
 */

const extractGithubUsername = (input = "") => {
  if (!input) return "";
  let clean = input.trim();
  // Strip URL prefix if provided
  clean = clean.replace(/^https?:\/\/(?:www\.)?github\.com\//i, "");
  // Strip trailing slashes or queries
  clean = clean.split("/")[0].split("?")[0].trim();
  return clean;
};

const fetchGithubData = async (rawInput) => {
  const username = extractGithubUsername(rawInput);
  if (!username) {
    const err = new Error("Please provide a valid GitHub username or profile URL.");
    err.statusCode = 400;
    throw err;
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "NEXORA-Career-Intelligence/1.0"
  };

  // Optional server-side personal access token for higher API rate limits (5000 req/hr)
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
        signal: controller.signal
      }),
      fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
        { headers, signal: controller.signal }
      )
    ]);

    clearTimeout(timeoutId);

    if (userRes.status === 404) {
      const err = new Error(`GitHub user "${username}" was not found. Please check your username.`);
      err.statusCode = 404;
      throw err;
    }

    if (userRes.status === 403 || reposRes.status === 403) {
      const err = new Error(
        "GitHub API rate limit exceeded. Please wait a short while or configure a GITHUB_TOKEN."
      );
      err.statusCode = 429;
      throw err;
    }

    if (!userRes.ok) {
      const err = new Error(`GitHub API request failed with status ${userRes.status}`);
      err.statusCode = userRes.status;
      throw err;
    }

    const userData = await userRes.json();
    const reposData = reposRes.ok ? await reposRes.json() : [];

    // Calculate aggregated statistics
    let totalStars = 0;
    let totalForks = 0;
    const languagesCount = {};

    const cleanRepos = Array.isArray(reposData)
      ? reposData
          .filter((r) => !r.fork) // prioritize original repositories
          .map((r) => {
            totalStars += r.stargazers_count || 0;
            totalForks += r.forks_count || 0;

            if (r.language) {
              languagesCount[r.language] = (languagesCount[r.language] || 0) + 1;
            }

            const techStack = [];
            if (r.language) techStack.push(r.language);
            if (Array.isArray(r.topics)) {
              r.topics.slice(0, 4).forEach((t) => {
                if (!techStack.includes(t)) techStack.push(t);
              });
            }

            return {
              id: String(r.id),
              name: r.name,
              title: r.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              description: r.description || "Open source software project",
              url: r.html_url,
              language: r.language || "JavaScript",
              techStack,
              stars: r.stargazers_count || 0,
              forks: r.forks_count || 0,
              updatedAt: r.updated_at,
              defaultBranch: r.default_branch
            };
          })
      : [];

    // Pre-select top 3 repos with most stars/recent activity for resume
    const sortedForResume = [...cleanRepos]
      .sort((a, b) => b.stars - a.stars || new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 4)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        techStack: r.techStack,
        url: r.url,
        stars: r.stars,
        forks: r.forks,
        bulletPoints: [
          `Architected open-source repository with ${r.stars} GitHub stars and ${r.forks} community forks.`,
          `Engineered core features utilizing ${r.techStack.join(", ") || r.language}.`
        ],
        selectedForResume: true
      }));

    const topLanguages = Object.entries(languagesCount)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    return {
      platform: "github",
      username: userData.login,
      profileUrl: userData.html_url,
      connectionStatus: "connected",
      verificationStatus: "api_verified",
      retrievalMethod: "official_api",
      summary: {
        primaryMetric: `${userData.public_repos || cleanRepos.length} Repositories`,
        secondaryMetric: `${totalStars} Stars • ${totalForks} Forks`,
        headline: userData.bio || `Active developer on GitHub (${userData.public_repos} public repos)`,
        avatarUrl: userData.avatar_url
      },
      importedData: {
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        followers: userData.followers,
        publicRepos: userData.public_repos,
        totalStars,
        totalForks,
        topLanguages,
        repos: cleanRepos
      },
      selectedItems: sortedForResume,
      lastSyncedAt: new Date(),
      syncError: null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      const timeoutErr = new Error("GitHub API request timed out after 12 seconds.");
      timeoutErr.statusCode = 408;
      throw timeoutErr;
    }
    throw err;
  }
};

module.exports = {
  extractGithubUsername,
  fetchGithubData
};
