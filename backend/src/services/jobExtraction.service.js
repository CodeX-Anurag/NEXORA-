/**
 * NEXORA Job Intelligence — Job Extraction Service
 * Extracts structured JobPosting JSON-LD, OpenGraph/Meta tags, and semantic HTML text.
 */

/**
 * Safely decodes common HTML entities
 */
const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ");
};

/**
 * Strips HTML tags and normalizes whitespace while preserving line structure
 */
const stripHtmlToPlainText = (html) => {
  if (!html || typeof html !== "string") return "";

  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ")
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ");

  // Convert block boundaries and lists to newlines
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/h[1-6]>/gi, "\n\n");

  // Strip all remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Decode entities
  cleaned = decodeHtmlEntities(cleaned);

  // Normalize whitespace
  return cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
};

/**
 * Searches for and extracts schema.org "JobPosting" objects from JSON-LD script blocks
 */
const extractJsonLdJobPosting = (html) => {
  if (!html) return null;

  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonString = match[1]?.trim();
    if (!jsonString) continue;

    try {
      const parsed = JSON.parse(jsonString);

      // Helper to find JobPosting node in single object, array, or @graph
      const findJobPosting = (item) => {
        if (!item || typeof item !== "object") return null;

        const type = item["@type"];
        const isJobPosting =
          type === "JobPosting" ||
          (Array.isArray(type) && type.includes("JobPosting")) ||
          (typeof type === "string" && type.toLowerCase().endsWith("jobposting"));

        if (isJobPosting) return item;

        if (Array.isArray(item["@graph"])) {
          for (const subItem of item["@graph"]) {
            const found = findJobPosting(subItem);
            if (found) return found;
          }
        }

        if (Array.isArray(item)) {
          for (const subItem of item) {
            const found = findJobPosting(subItem);
            if (found) return found;
          }
        }

        return null;
      };

      const jobPosting = findJobPosting(parsed);
      if (jobPosting) {
        return jobPosting;
      }
    } catch {
      // Ignore JSON parse errors in individual blocks and continue scanning
    }
  }

  return null;
};

/**
 * Formats location from JobPosting location object
 */
const formatLocation = (jobLocation, jobLocationType) => {
  if (jobLocationType === "TELECOMMUTE" || String(jobLocationType).toLowerCase().includes("remote")) {
    return "Remote";
  }

  if (!jobLocation) return "Unspecified / Remote";
  if (typeof jobLocation === "string") return jobLocation.trim();

  const address = jobLocation.address || jobLocation;
  if (typeof address === "string") return address.trim();

  const parts = [
    address.addressLocality,
    address.addressRegion,
    address.addressCountry?.name || address.addressCountry
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return jobLocation.name || "Unspecified / Remote";
};

/**
 * Formats employment type / job type into friendly readable label
 */
const formatJobType = (empType) => {
  if (!empType) return "Full-time";
  const str = Array.isArray(empType) ? empType.join(", ") : String(empType);
  const upper = str.toUpperCase();

  if (upper.includes("FULL_TIME") || upper.includes("FULL TIME")) return "Full-time";
  if (upper.includes("PART_TIME") || upper.includes("PART TIME")) return "Part-time";
  if (upper.includes("INTERN")) return "Internship";
  if (upper.includes("CONTRACT")) return "Contract";
  if (upper.includes("TEMPORARY")) return "Temporary";

  return str;
};

/**
 * Extracts OpenGraph and HTML meta tags
 */
const extractMetaTags = (html) => {
  const meta = {};
  if (!html) return meta;

  const tagRegex = /<meta\b[^>]*>/gi;
  let tagMatch;

  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];
    const nameMatch = tag.match(/(?:name|property)=["']([^"']+)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);

    if (nameMatch && contentMatch) {
      const key = nameMatch[1].toLowerCase();
      meta[key] = decodeHtmlEntities(contentMatch[1].trim());
    }
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    meta.title = decodeHtmlEntities(titleMatch[1].trim());
  }

  const canonicalMatch = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    meta.canonical = canonicalMatch[1].trim();
  }

  return meta;
};

/**
 * Extracts sections (skills, responsibilities, qualifications) from unstructured plain text using regex headings
 */
const extractSectionsFromText = (plainText) => {
  const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);

  const sections = {
    responsibilities: [],
    qualifications: [],
    requiredSkills: [],
    preferredSkills: []
  };

  let currentSection = null;

  const sectionPatterns = [
    { key: "responsibilities", regex: /(responsibilit|what you('ll| will) do|duties|role overview|scope)/i },
    { key: "qualifications", regex: /(qualification|requirement|what we('re| are) looking for|eligibility|prerequisites)/i },
    { key: "requiredSkills", regex: /(required skills|must have|technical requirements|technologies|tech stack)/i },
    { key: "preferredSkills", regex: /(preferred|nice to have|bonus|good to have|desired skills)/i }
  ];

  for (const line of lines) {
    // Check if line is a section heading
    const matchedPattern = sectionPatterns.find((p) => p.regex.test(line) && line.length < 60);
    if (matchedPattern) {
      currentSection = matchedPattern.key;
      continue;
    }

    if (currentSection && (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.match(/^\d+[.)]/))) {
      const cleanBullet = line.replace(/^[•\-*\d.)\s]+/, "").trim();
      if (cleanBullet.length > 3 && cleanBullet.length < 300) {
        sections[currentSection].push(cleanBullet);
      }
    }
  }

  return sections;
};

/**
 * Main job extraction function
 * Inspects raw HTML or text, prioritizing JSON-LD JobPosting schema, falling back to OpenGraph and semantic HTML text.
 */
const extractJobData = (rawHtmlOrText, sourceUrl = "") => {
  if (!rawHtmlOrText || typeof rawHtmlOrText !== "string") {
    return {
      jobTitle: "Target Role",
      company: "Target Company",
      location: "Unspecified / Remote",
      jobType: "Full-time",
      experienceRequirements: "Not specified",
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      qualifications: [],
      jobDescription: "",
      applicationUrl: sourceUrl || "",
      extractionMethod: "empty",
      isStructured: false
    };
  }

  // 1. Attempt JSON-LD JobPosting extraction
  const jsonLd = extractJsonLdJobPosting(rawHtmlOrText);

  if (jsonLd) {
    const rawDesc = jsonLd.description ? stripHtmlToPlainText(jsonLd.description) : "";
    const parsedTextSections = extractSectionsFromText(rawDesc);

    // Extract skills from JSON-LD
    let rawSkills = [];
    if (Array.isArray(jsonLd.skills)) {
      rawSkills = jsonLd.skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof jsonLd.skills === "string") {
      rawSkills = jsonLd.skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    }

    // Merge skills with parsed text skills if available
    const requiredSkills = Array.from(new Set([...rawSkills, ...parsedTextSections.requiredSkills])).slice(0, 15);
    const preferredSkills = parsedTextSections.preferredSkills.slice(0, 10);

    // Responsibilities from JSON-LD or text
    let responsibilities = [];
    if (Array.isArray(jsonLd.responsibilities)) {
      responsibilities = jsonLd.responsibilities.map(stripHtmlToPlainText).filter(Boolean);
    } else if (typeof jsonLd.responsibilities === "string") {
      responsibilities = jsonLd.responsibilities.split("\n").map(stripHtmlToPlainText).filter(Boolean);
    }
    if (responsibilities.length === 0) {
      responsibilities = parsedTextSections.responsibilities;
    }

    // Qualifications from JSON-LD or text
    let qualifications = [];
    if (Array.isArray(jsonLd.qualifications)) {
      qualifications = jsonLd.qualifications.map(stripHtmlToPlainText).filter(Boolean);
    } else if (typeof jsonLd.qualifications === "string") {
      qualifications = jsonLd.qualifications.split("\n").map(stripHtmlToPlainText).filter(Boolean);
    }
    if (qualifications.length === 0) {
      qualifications = parsedTextSections.qualifications;
    }

    const experienceRequirements =
      typeof jsonLd.experienceRequirements === "string"
        ? jsonLd.experienceRequirements.trim()
        : jsonLd.experienceRequirements?.occupationalCategory || "Not specified";

    return {
      jobTitle: jsonLd.title || jsonLd.jobTitle || "Target Role",
      company:
        typeof jsonLd.hiringOrganization === "object"
          ? jsonLd.hiringOrganization.name || "Target Company"
          : jsonLd.hiringOrganization || "Target Company",
      location: formatLocation(jsonLd.jobLocation, jsonLd.jobLocationType),
      jobType: formatJobType(jsonLd.employmentType),
      experienceRequirements,
      requiredSkills,
      preferredSkills,
      responsibilities: responsibilities.slice(0, 8),
      qualifications: qualifications.slice(0, 8),
      jobDescription: rawDesc.slice(0, 4000),
      applicationUrl: jsonLd.url || jsonLd.directApply || sourceUrl || "",
      extractionMethod: "json_ld",
      isStructured: true
    };
  }

  // 2. Fallback to OpenGraph / Meta tags and semantic text
  const meta = extractMetaTags(rawHtmlOrText);
  const plainText = stripHtmlToPlainText(rawHtmlOrText);
  const textSections = extractSectionsFromText(plainText);

  // Infer title and company from meta or text
  let inferredTitle = meta["og:title"] || meta["twitter:title"] || meta.title || "";
  let inferredCompany = meta["og:site_name"] || meta["author"] || "";

  // Common pattern in titles: "Software Engineer at Google" or "Google - Software Engineer"
  if (inferredTitle.includes(" at ")) {
    const [t, c] = inferredTitle.split(" at ");
    inferredTitle = t.trim();
    if (!inferredCompany) inferredCompany = c.trim();
  } else if (inferredTitle.includes(" - ")) {
    const parts = inferredTitle.split(" - ");
    if (parts.length >= 2) {
      inferredTitle = parts[0].trim();
      if (!inferredCompany) inferredCompany = parts[1].trim();
    }
  }

  if (!inferredTitle) {
    const firstNonEmpty = plainText.split("\n").map((l) => l.trim()).filter(Boolean)[0] || "Target Role";
    inferredTitle = firstNonEmpty.slice(0, 80);
  }

  return {
    jobTitle: inferredTitle || "Target Role",
    company: inferredCompany || "Target Company",
    location: "Unspecified / Remote",
    jobType: "Full-time",
    experienceRequirements: "Not specified",
    requiredSkills: textSections.requiredSkills.slice(0, 15),
    preferredSkills: textSections.preferredSkills.slice(0, 10),
    responsibilities: textSections.responsibilities.slice(0, 8),
    qualifications: textSections.qualifications.slice(0, 8),
    jobDescription: (meta["og:description"] || meta["description"] || plainText).slice(0, 4000),
    applicationUrl: meta.canonical || sourceUrl || "",
    extractionMethod: "semantic_html",
    isStructured: false,
    rawText: plainText
  };
};

module.exports = {
  decodeHtmlEntities,
  stripHtmlToPlainText,
  extractJsonLdJobPosting,
  extractMetaTags,
  extractSectionsFromText,
  extractJobData
};
