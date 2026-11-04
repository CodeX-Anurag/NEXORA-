/**
 * Document Context Service
 * Extracts text from student uploads (PDF, DOCX, TXT, Images)
 * and generates bounded, sanitized context excerpts for LLM prompts.
 */
class DocumentContextService {
  /**
   * Extracts text from uploaded file buffer based on MIME type / filename
   */
  static async extractText({ buffer, originalname = "", mimetype = "" }) {
    if (!buffer || buffer.length === 0) {
      throw new Error("Uploaded file is empty.");
    }

    const ext = (originalname.split(".").pop() || "").toLowerCase();
    let text = "";

    // 1. PDF Documents (lazy-load pdf-parse to avoid canvas open handles)
    if (mimetype === "application/pdf" || ext === "pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        text = data.text || "";
      } catch (err) {
        throw new Error(`Failed to extract text from PDF: ${err.message}`);
      }
    }
    // 2. Word Documents (.docx)
    else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      try {
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || "";
      } catch (err) {
        throw new Error(`Failed to extract text from DOCX: ${err.message}`);
      }
    }
    // 3. Plain Text / Markdown / Code
    else if (
      mimetype.startsWith("text/") ||
      ext === "txt" ||
      ext === "md" ||
      ext === "csv" ||
      ext === "json"
    ) {
      text = buffer.toString("utf-8");
    }
    // 4. Image uploads
    else if (mimetype.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext)) {
      text = `[Image Document Attached: ${originalname} (${Math.round(buffer.length / 1024)} KB). Image context ready for analysis.]`;
    } else {
      throw new Error(`Unsupported file type: ${mimetype || ext}. Please upload PDF, DOCX, TXT, or Image files.`);
    }

    // Clean whitespace & sanitize
    const sanitized = text.replace(/\r\n/g, "\n").replace(/[^\x20-\x7E\n\t]/g, " ").trim();

    // Bounded excerpt: Max 6,000 characters to fit within context window safely
    const truncated = sanitized.length > 6000 ? `${sanitized.slice(0, 6000)}\n\n[...Document truncated for optimal AI Coach context...]` : sanitized;

    return {
      fileName: originalname,
      fileSize: buffer.length,
      mimeType: mimetype,
      textLength: sanitized.length,
      extractedContent: truncated
    };
  }
}

module.exports = DocumentContextService;