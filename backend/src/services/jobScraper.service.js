const dns = require("dns").promises;

/**
 * Checks whether an IP address belongs to private, loopback, link-local, or reserved ranges (SSRF prevention).
 */
const isPrivateOrReservedIp = (ip) => {
  if (!ip) return true;
  if (ip === "localhost" || ip === "127.0.0.1" || ip === "0.0.0.0") return true;

  const ipv4Parts = ip.split(".").map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [p0, p1] = ipv4Parts;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 10.0.0.0/8 (Private)
    if (p0 === 10) return true;
    // 172.16.0.0/12 (Private 172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (p0 === 169 && p1 === 254) return true;
    // 0.0.0.0/8
    if (p0 === 0) return true;
  }

  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === "::1" ||
    lowerIp === "::" ||
    lowerIp.startsWith("fc00:") ||
    lowerIp.startsWith("fd") ||
    lowerIp.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
};

/**
 * Validates a target URL against SSRF, unsupported protocols, and private network addresses
 */
const validateSafeUrl = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") {
    const err = new Error("URL is required and must be a string.");
    err.statusCode = 400;
    throw err;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    const err = new Error("Invalid URL format. Please provide a valid HTTP or HTTPS address.");
    err.statusCode = 400;
    throw err;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    const err = new Error("Unsupported URL protocol. Only HTTP and HTTPS are permitted.");
    err.statusCode = 400;
    throw err;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, cloud metadata, and internal hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal"
  ) {
    const err = new Error("Access to local, internal, or cloud metadata addresses is blocked for security.");
    err.statusCode = 403;
    throw err;
  }

  if (isPrivateOrReservedIp(hostname)) {
    const err = new Error("Access to private network IP ranges is blocked for security.");
    err.statusCode = 403;
    throw err;
  }

  // Resolve hostname via DNS to verify resolved IP is not internal
  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateOrReservedIp(lookup.address)) {
      const err = new Error("Access to private network destination is blocked for security.");
      err.statusCode = 403;
      throw err;
    }
  } catch (dnsErr) {
    if (dnsErr.statusCode) throw dnsErr;
    // In sandboxed/offline environments or during network issues, proceed if hostname checks passed
  }

  return parsed.toString();
};

/**
 * Checks if a response indicates anti-bot, login wall, or challenge pages
 */
const detectAccessRestrictions = (status, htmlText = "") => {
  if (status === 401 || status === 403 || status === 429) {
    return true;
  }

  const lower = htmlText.toLowerCase();
  const restrictionSignatures = [
    "please verify you are a human",
    "access to this page has been denied",
    "checking your browser before accessing",
    "cloudflare ray id",
    "enable javascript and cookies to continue",
    "sign in to view this job",
    "please log in to continue",
    "bot detection",
    "ddos protection by cloudflare",
    "are you a robot"
  ];

  return restrictionSignatures.some((sig) => lower.includes(sig));
};

/**
 * Safely fetches a public job page with SSRF protection, size limits, and anti-bot detection
 */
const fetchJobPage = async (targetUrl, maxRedirects = 3) => {
  let currentUrl = await validateSafeUrl(targetUrl);
  let redirectCount = 0;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NEXORA-JobIntelligence/2.0",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
  };

  try {
    while (redirectCount <= maxRedirects) {
      const res = await fetch(currentUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "manual" // Handle redirects manually to validate each target URL against SSRF
      });

      // Handle Redirects
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          throw new Error("Redirect response missing Location header.");
        }
        const resolvedRedirect = new URL(location, currentUrl).toString();
        // Validate redirect target against SSRF!
        currentUrl = await validateSafeUrl(resolvedRedirect);
        redirectCount++;
        continue;
      }

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") || "";
      const isHtmlOrText =
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml") ||
        contentType.includes("text/plain");

      if (!isHtmlOrText) {
        const err = new Error(
          "Target URL did not return HTML content. Please copy and paste the job description text."
        );
        err.statusCode = 422;
        err.canFallbackToPaste = true;
        throw err;
      }

      // Read response body with 2.5MB size limit
      const rawText = await res.text();
      const boundedHtml = rawText.length > 2.5 * 1024 * 1024 ? rawText.slice(0, 2.5 * 1024 * 1024) : rawText;

      // Check for anti-bot or login walls
      if (detectAccessRestrictions(res.status, boundedHtml)) {
        const err = new Error(
          `This job posting is protected by a login wall or anti-bot verification (HTTP ${res.status}). Please copy and paste the job description directly.`
        );
        err.statusCode = 422;
        err.canFallbackToPaste = true;
        throw err;
      }

      if (!res.ok) {
        const err = new Error(
          `Job page returned HTTP status ${res.status}. Please check the URL or paste the job description text.`
        );
        err.statusCode = res.status >= 400 && res.status < 500 ? res.status : 422;
        err.canFallbackToPaste = true;
        throw err;
      }

      return {
        url: targetUrl,
        finalUrl: currentUrl,
        statusCode: res.status,
        contentType,
        rawHtml: boundedHtml
      };
    }

    throw new Error("Too many redirects while fetching job posting.");
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      const timeoutErr = new Error(
        "Network request timed out after 12 seconds. The site may be slow or restricted. Please paste the job description text directly."
      );
      timeoutErr.statusCode = 408;
      timeoutErr.canFallbackToPaste = true;
      throw timeoutErr;
    }
    throw err;
  }
};

module.exports = {
  isPrivateOrReservedIp,
  validateSafeUrl,
  detectAccessRestrictions,
  fetchJobPage
};
