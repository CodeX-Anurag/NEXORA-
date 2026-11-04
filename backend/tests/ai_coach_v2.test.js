const DocumentContextService = require("../src/services/documentContext.service");
const ImageGenerationProvider = require("../src/ai/providers/image.provider");
const PromptManager = require("../src/ai/promptManager");
const fs = require("fs");
const path = require("path");

describe("NEXORA AI Coach 2.0 — Multimodal Unit Tests", () => {
  describe("1. Document Context Service", () => {
    test("extracts and sanitizes plain text content", async () => {
      const buffer = Buffer.from("Hello world! This is a test document.\r\nLine 2 with numbers 123.", "utf-8");
      const result = await DocumentContextService.extractText({
        buffer,
        originalname: "test.txt",
        mimetype: "text/plain"
      });

      expect(result).toBeDefined();
      expect(result.extractedContent).toContain("Hello world! This is a test document.");
      expect(result.extractedContent).toContain("Line 2 with numbers 123.");
      expect(result.fileName).toBe("test.txt");
    });

    test("handles code / markdown documents cleanly", async () => {
      const buffer = Buffer.from("# QuickSort Algorithm\n```js\nconst qsort = (arr) => arr;\n```", "utf-8");
      const result = await DocumentContextService.extractText({
        buffer,
        originalname: "algorithm.md",
        mimetype: "text/markdown"
      });

      expect(result.extractedContent).toContain("# QuickSort Algorithm");
      expect(result.extractedContent).toContain("const qsort = (arr) => arr;");
    });

    test("rejects empty file buffers with clear error", async () => {
      await expect(
        DocumentContextService.extractText({
          buffer: Buffer.from(""),
          originalname: "empty.txt",
          mimetype: "text/plain"
        })
      ).rejects.toThrow("Uploaded file is empty.");
    });

    test("rejects unsupported binary formats with descriptive message", async () => {
      await expect(
        DocumentContextService.extractText({
          buffer: Buffer.from([0x00, 0x01, 0x02]),
          originalname: "binary.exe",
          mimetype: "application/x-msdownload"
        })
      ).rejects.toThrow(/Unsupported file type/);
    });

    test("truncates long document context to safe token limit (6000 chars)", async () => {
      const hugeText = "A".repeat(10000);
      const buffer = Buffer.from(hugeText, "utf-8");
      const result = await DocumentContextService.extractText({
        buffer,
        originalname: "huge.txt",
        mimetype: "text/plain"
      });

      expect(result.extractedContent.length).toBeLessThanOrEqual(6100);
      expect(result.extractedContent).toContain("[...Document truncated for optimal AI Coach context...]");
    });
  });

  describe("2. Image & Educational Diagram Generation Provider", () => {
    const imageProvider = new ImageGenerationProvider();

    test("generates and persists valid vector SVG for CPU architecture", async () => {
      const res = await imageProvider.generateImage({
        prompt: "Von Neumann CPU architecture diagram"
      });

      expect(res).toBeDefined();
      expect(res.url).toMatch(/^\/uploads\/generated\//);
      expect(res.format).toBe("svg");
      expect(res.source).toBe("nexora_vector_engine");

      const filePath = path.join(__dirname, "../", res.url);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
      expect(content).toContain("CPU");

      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore cleanup error
      }
    });

    test("generates and persists valid vector SVG for Binary Search Tree", async () => {
      const res = await imageProvider.generateImage({
        prompt: "Binary Search Tree with balanced nodes"
      });

      expect(res.url).toMatch(/^\/uploads\/generated\//);
      const filePath = path.join(__dirname, "../", res.url);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("Binary Search Tree");

      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    });

    test("generates and persists valid vector SVG for OSI Reference Model", async () => {
      const res = await imageProvider.generateImage({
        prompt: "OSI 7 layer network reference model"
      });

      expect(res.url).toMatch(/^\/uploads\/generated\//);
      const filePath = path.join(__dirname, "../", res.url);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("OSI 7-Layer Reference Model");

      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    });

    test("generates and persists valid vector SVG for general microservices architecture", async () => {
      const res = await imageProvider.generateImage({
        prompt: "System Architecture of a Microservices App"
      });

      expect(res).toBeDefined();
      expect(res.url).toMatch(/^\/uploads\/generated\//);

      const filePath = path.join(__dirname, "../", res.url);
      expect(fs.existsSync(filePath)).toBe(true);

      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    });
  });

  describe("3. System Prompt Manager & Adaptive Styles", () => {
    test("includes interactive rich contracts in base prompt", () => {
      const prompt = PromptManager.getSystemPrompt();
      expect(prompt).toContain("```chart");
      expect(prompt).toContain("`mermaid`");
      expect(prompt).toContain("$E = mc^2$");
    });

    test("adapts system instructions for 'quick' response mode", () => {
      const prompt = PromptManager.getSystemPrompt({ responseMode: "quick" });
      expect(prompt).toContain("STYLE: Quick Answer");
      expect(prompt).toContain("2-3 short paragraphs");
    });

    test("adapts system instructions for 'viva' practice mode", () => {
      const prompt = PromptManager.getSystemPrompt({ responseMode: "viva" });
      expect(prompt).toContain("STYLE: Viva & Oral Defense Preparation");
      expect(prompt).toContain("counter-questions");
    });

    test("adapts system instructions for 'exam' preparation mode", () => {
      const prompt = PromptManager.getSystemPrompt({ responseMode: "exam" });
      expect(prompt).toContain("STYLE: Exam Preparation");
      expect(prompt).toContain("high-yield summary points");
    });

    test("activates Hinglish instructions when language is 'hi-en'", () => {
      const prompt = PromptManager.getSystemPrompt({ language: "hi-en" });
      expect(prompt).toContain("LANGUAGE: Respond in clear, natural Hinglish");
      expect(prompt).toContain("Chaliye is concept ko step-by-step samajhte hain");
    });

    test("injects document attachment guidelines when hasDocuments is true", () => {
      const prompt = PromptManager.getSystemPrompt({ hasDocuments: true });
      expect(prompt).toContain("10. DOCUMENT GROUNDING");
      expect(prompt).toContain("Reference the attached document excerpts accurately");
    });
  });
});
