const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { LLM_API_KEY } = require("../../config/env");

const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads/generated");

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Image Generation Provider
 * Supports Google Imagen 3 (via Gemini API) with intelligent vector diagram fallbacks.
 */
class ImageGenerationProvider {
  constructor(config = {}) {
    this.name = "gemini-imagen";
    const rawKey = config.apiKey || LLM_API_KEY || "";
    this.apiKey = rawKey.replace(/^["']|["']$/g, "").trim();
    this.model = config.model || "imagen-3.0-generate-002";
  }

  /**
   * Generates a diagram or illustrative image from a prompt.
   */
  async generateImage({ prompt, userId: _userId }) {
    if (!prompt || !prompt.trim()) {
      throw new Error("Prompt is required for image generation.");
    }

    const trimmedPrompt = prompt.trim();
    const isMockOrMissingKey = !this.apiKey || this.apiKey.startsWith("mock") || this.apiKey === "your-gemini-api-key-here";

    if (!isMockOrMissingKey && process.env.NODE_ENV === "production") {
      try {
        const result = await this._callImagenApi(trimmedPrompt);
        if (result) return result;
      } catch (err) {
        console.warn(`[ImageProvider] Imagen API call failed (${err.message}). Falling back to vector diagram engine.`);
      }
    }

    // High-fidelity educational vector SVG generation
    return this._generateEducationalVector(trimmedPrompt);
  }

  /**
   * Calls Google Imagen 3 predict endpoint
   */
  async _callImagenApi(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:predict?key=${this.apiKey}`;
    const payload = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png"
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Imagen API responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const base64Data = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Data) {
      throw new Error("No image data returned from Imagen model.");
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.png`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return {
      id: fileId,
      url: `/uploads/generated/${fileName}`,
      prompt,
      format: "png",
      source: "gemini_imagen",
      createdAt: new Date()
    };
  }

  /**
   * Generates a high-resolution, thematic SVG illustration for computer science & productivity concepts
   */
  _generateEducationalVector(prompt) {
    const lower = prompt.toLowerCase();
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.svg`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    let svgContent = "";

    if (lower.includes("cpu") || lower.includes("processor") || lower.includes("architecture")) {
      svgContent = this._renderCpuSvg(prompt);
    } else if (lower.includes("tree") || lower.includes("binary") || lower.includes("bst") || lower.includes("dsa")) {
      svgContent = this._renderBinaryTreeSvg(prompt);
    } else if (lower.includes("osi") || lower.includes("layer") || lower.includes("network")) {
      svgContent = this._renderOsiModelSvg(prompt);
    } else if (lower.includes("http") || lower.includes("lifecycle") || lower.includes("request") || lower.includes("api")) {
      svgContent = this._renderHttpLifecycleSvg(prompt);
    } else {
      svgContent = this._renderGeneralArchitectureSvg(prompt);
    }

    fs.writeFileSync(filePath, svgContent, "utf-8");

    return {
      id: fileId,
      url: `/uploads/generated/${fileName}`,
      prompt,
      format: "svg",
      source: "nexora_vector_engine",
      createdAt: new Date()
    };
  }

  _renderCpuSvg(prompt) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="100%" stop-color="#161F30"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="blueAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F7CFF"/>
      <stop offset="100%" stop-color="#7C6CFA"/>
    </linearGradient>
    <linearGradient id="emeraldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="800" height="600" fill="url(#bg)" rx="24"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1E293B" stroke-width="2" rx="20"/>

  <!-- Title Badge -->
  <rect x="50" y="45" width="260" height="34" rx="8" fill="#1E293B" stroke="#334155"/>
  <text x="65" y="67" fill="#60A5FA" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" letter-spacing="1">CENTRAL PROCESSING UNIT</text>
  <text x="50" y="110" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">Von Neumann CPU Architecture</text>
  <text x="50" y="132" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">${this._escapeXml(prompt)}</text>

  <!-- Control Unit -->
  <rect x="50" y="160" width="320" height="150" rx="16" fill="url(#cardGrad)" stroke="#4F7CFF" stroke-width="2" filter="url(#glow)"/>
  <rect x="50" y="160" width="320" height="6" fill="url(#blueAccent)"/>
  <text x="75" y="195" fill="#60A5FA" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">CONTROL UNIT (CU)</text>
  <text x="75" y="220" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Instruction Register (IR)</text>
  <text x="75" y="242" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Program Counter (PC)</text>
  <text x="75" y="264" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Instruction Decoder &amp; Sequencer</text>
  <text x="75" y="286" fill="#10B981" font-family="monospace" font-size="11">Clock Sync: 3.80 GHz</text>

  <!-- ALU -->
  <rect x="430" y="160" width="320" height="150" rx="16" fill="url(#cardGrad)" stroke="#10B981" stroke-width="2"/>
  <rect x="430" y="160" width="320" height="6" fill="url(#emeraldAccent)"/>
  <text x="455" y="195" fill="#34D399" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">ARITHMETIC LOGIC UNIT (ALU)</text>
  <text x="455" y="220" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Accumulator (ACC)</text>
  <text x="455" y="242" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Arithmetic Operations (+, -, *, /)</text>
  <text x="455" y="264" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">• Logical Operations (AND, OR, NOT, XOR)</text>
  <text x="455" y="286" fill="#F59E0B" font-family="monospace" font-size="11">Status Flags: Zero, Carry, Overflow</text>

  <!-- Internal Bus -->
  <line x1="370" y1="235" x2="430" y2="235" stroke="#F59E0B" stroke-width="4" stroke-dasharray="6,4"/>
  <text x="382" y="225" fill="#FBBF24" font-family="monospace" font-size="10" font-weight="bold">INTERNAL BUS</text>

  <!-- Registers Grid -->
  <rect x="50" y="340" width="700" height="100" rx="16" fill="#1E293B" stroke="#334155"/>
  <text x="75" y="370" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">REGISTER FILE &amp; ON-DIE L1/L2 CACHE</text>
  <rect x="75" y="385" width="130" height="40" rx="8" fill="#0F172A" stroke="#475569"/>
  <text x="95" y="410" fill="#93C5FD" font-family="monospace" font-size="12">MAR (Address)</text>
  <rect x="225" y="385" width="130" height="40" rx="8" fill="#0F172A" stroke="#475569"/>
  <text x="250" y="410" fill="#93C5FD" font-family="monospace" font-size="12">MDR (Data)</text>
  <rect x="375" y="385" width="150" height="40" rx="8" fill="#0F172A" stroke="#475569"/>
  <text x="395" y="410" fill="#93C5FD" font-family="monospace" font-size="12">General Regs (R0-R7)</text>
  <rect x="545" y="385" width="180" height="40" rx="8" fill="#0F172A" stroke="#475569"/>
  <text x="565" y="410" fill="#34D399" font-family="monospace" font-size="12">L1 Cache (32KB/32KB)</text>

  <!-- External System Bus & Main Memory -->
  <rect x="50" y="470" width="700" height="75" rx="16" fill="url(#cardGrad)" stroke="#7C6CFA" stroke-width="1.5"/>
  <text x="75" y="500" fill="#A78BFA" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">SYSTEM INTERCONNECT (CONTROL, ADDRESS &amp; DATA BUSES)</text>
  <text x="75" y="525" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">Communicating with RAM (Main Memory), Secondary Storage (NVMe), and I/O Peripherals</text>
</svg>`;
  }

  _renderBinaryTreeSvg(prompt) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="100%" stop-color="#161F30"/>
    </linearGradient>
    <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </radialGradient>
    <radialGradient id="rootGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </radialGradient>
  </defs>

  <rect width="800" height="500" fill="url(#bg2)" rx="24"/>

  <!-- Title -->
  <text x="40" y="50" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">Binary Search Tree (BST)</text>
  <text x="40" y="75" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">Left Subtree &lt; Node &lt; Right Subtree | ${this._escapeXml(prompt)}</text>

  <!-- Edges -->
  <line x1="400" y1="120" x2="250" y2="200" stroke="#475569" stroke-width="3"/>
  <line x1="400" y1="120" x2="550" y2="200" stroke="#475569" stroke-width="3"/>
  <line x1="250" y1="200" x2="170" y2="300" stroke="#475569" stroke-width="3"/>
  <line x1="250" y1="200" x2="330" y2="300" stroke="#475569" stroke-width="3"/>
  <line x1="550" y1="200" x2="470" y2="300" stroke="#475569" stroke-width="3"/>
  <line x1="550" y1="200" x2="630" y2="300" stroke="#475569" stroke-width="3"/>

  <!-- Root Node (50) -->
  <circle cx="400" cy="120" r="30" fill="url(#rootGrad)" stroke="#C4B5FD" stroke-width="2"/>
  <text x="400" y="126" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">50</text>
  <text x="400" y="80" fill="#A78BFA" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Root</text>

  <!-- Level 1 Nodes (30, 70) -->
  <circle cx="250" cy="200" r="26" fill="url(#nodeGrad)" stroke="#93C5FD" stroke-width="2"/>
  <text x="250" y="206" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">30</text>

  <circle cx="550" cy="200" r="26" fill="url(#nodeGrad)" stroke="#93C5FD" stroke-width="2"/>
  <text x="550" y="206" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">70</text>

  <!-- Level 2 Nodes (20, 40, 60, 80) -->
  <circle cx="170" cy="300" r="22" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
  <text x="170" y="306" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">20</text>

  <circle cx="330" cy="300" r="22" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
  <text x="330" y="306" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">40</text>

  <circle cx="470" cy="300" r="22" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
  <text x="470" y="306" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">60</text>

  <circle cx="630" cy="300" r="22" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
  <text x="630" y="306" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">80</text>

  <!-- Complexity Card -->
  <rect x="40" y="380" width="720" height="80" rx="12" fill="#1E293B" stroke="#334155"/>
  <text x="60" y="410" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">TIME COMPLEXITIES</text>
  <text x="60" y="435" fill="#34D399" font-family="monospace" font-size="12">Search / Insert / Delete: O(log N) Average | O(N) Worst Case (skewed)</text>
</svg>`;
  }

  _renderOsiModelSvg(prompt) {
    const layers = [
      { num: 7, name: "Application Layer", protocols: "HTTP, HTTPS, DNS, SSH, FTP", color: "#EC4899" },
      { num: 6, name: "Presentation Layer", protocols: "SSL/TLS, JPEG, ASCII, Encryption", color: "#8B5CF6" },
      { num: 5, name: "Session Layer", protocols: "Sockets, RPC, NetBIOS, PPTP", color: "#6366F1" },
      { num: 4, name: "Transport Layer", protocols: "TCP (Reliable), UDP (Fast Datagrams), Ports", color: "#3B82F6" },
      { num: 3, name: "Network Layer", protocols: "IP (IPv4/IPv6), Routers, ICMP, Routing", color: "#06B6D4" },
      { num: 2, name: "Data Link Layer", protocols: "Ethernet, MAC Addresses, Switches, PPP", color: "#10B981" },
      { num: 1, name: "Physical Layer", protocols: "Cables, Fiber, Radio Frequencies, Bits (0/1)", color: "#F59E0B" }
    ];

    const layerBars = layers.map((l, i) => {
      const y = 100 + i * 50;
      return `
    <rect x="50" y="${y}" width="700" height="42" rx="10" fill="#1E293B" stroke="${l.color}" stroke-width="1.5"/>
    <rect x="50" y="${y}" width="38" height="42" rx="10" fill="${l.color}"/>
    <text x="69" y="${y + 26}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${l.num}</text>
    <text x="105" y="${y + 26}" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">${l.name}</text>
    <text x="420" y="${y + 26}" fill="#94A3B8" font-family="monospace" font-size="12">${l.protocols}</text>
  `;
    }).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#0B0F19" rx="24"/>
  <text x="50" y="50" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">OSI 7-Layer Reference Model</text>
  <text x="50" y="75" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">${this._escapeXml(prompt)}</text>
  ${layerBars}
</svg>`;
  }

  _renderHttpLifecycleSvg(prompt) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <rect width="800" height="480" fill="#0B0F19" rx="24"/>
  <text x="50" y="45" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">HTTP Request-Response Lifecycle</text>
  <text x="50" y="68" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">${this._escapeXml(prompt)}</text>

  <!-- Step 1: Client -->
  <rect x="50" y="120" width="180" height="120" rx="16" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
  <text x="140" y="160" fill="#60A5FA" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">CLIENT / BROWSER</text>
  <text x="140" y="185" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">DNS Lookup</text>
  <text x="140" y="205" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">TCP 3-Way Handshake</text>

  <!-- Arrow -->
  <line x1="230" y1="160" x2="310" y2="160" stroke="#38BDF8" stroke-width="3" stroke-dasharray="4,4"/>
  <text x="270" y="150" fill="#38BDF8" font-family="monospace" font-size="10" text-anchor="middle">GET /api</text>

  <!-- Step 2: Gateway / Proxy -->
  <rect x="310" y="120" width="180" height="120" rx="16" fill="#1E293B" stroke="#8B5CF6" stroke-width="2"/>
  <text x="400" y="160" fill="#A78BFA" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">GATEWAY / NGINX</text>
  <text x="400" y="185" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">TLS Termination</text>
  <text x="400" y="205" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Rate Limiting &amp; Routing</text>

  <!-- Arrow -->
  <line x1="490" y1="160" x2="570" y2="160" stroke="#A78BFA" stroke-width="3" stroke-dasharray="4,4"/>
  <text x="530" y="150" fill="#A78BFA" font-family="monospace" font-size="10" text-anchor="middle">Proxy Pass</text>

  <!-- Step 3: Backend Node.js -->
  <rect x="570" y="120" width="180" height="120" rx="16" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
  <text x="660" y="160" fill="#34D399" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">NODE.js SERVICE</text>
  <text x="660" y="185" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Auth &amp; Business Logic</text>
  <text x="660" y="205" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Query Database</text>

  <!-- Database Card Below -->
  <rect x="310" y="300" width="180" height="100" rx="16" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
  <text x="400" y="340" fill="#FBBF24" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">MONGODB STORE</text>
  <text x="400" y="365" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Mongoose Collections</text>

  <!-- Lines to Database -->
  <line x1="660" y1="240" x2="660" y2="350" stroke="#F59E0B" stroke-width="2"/>
  <line x1="660" y1="350" x2="490" y2="350" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4,4"/>
</svg>`;
  }

  _renderGeneralArchitectureSvg(prompt) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <rect width="800" height="480" fill="#0B0F19" rx="24"/>
  <rect x="40" y="40" width="720" height="400" fill="#161F30" stroke="#1E293B" rx="16"/>
  <text x="70" y="85" fill="#60A5FA" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">System Architecture &amp; Component Map</text>
  <text x="70" y="110" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12">${this._escapeXml(prompt)}</text>

  <rect x="70" y="150" width="190" height="140" rx="12" fill="#1E293B" stroke="#4F7CFF" stroke-width="2"/>
  <text x="165" y="195" fill="#93C5FD" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">PRESENTATION</text>
  <text x="165" y="225" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">React 19 SPA</text>
  <text x="165" y="245" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">TailwindCSS &amp; Recharts</text>

  <line x1="260" y1="220" x2="330" y2="220" stroke="#60A5FA" stroke-width="3" stroke-dasharray="4,4"/>

  <rect x="330" y="150" width="190" height="140" rx="12" fill="#1E293B" stroke="#7C6CFA" stroke-width="2"/>
  <text x="425" y="195" fill="#C4B5FD" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">APPLICATION TIER</text>
  <text x="425" y="225" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Node.js Express API</text>
  <text x="425" y="245" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">SSE Token Streaming</text>

  <line x1="520" y1="220" x2="590" y2="220" stroke="#7C6CFA" stroke-width="3" stroke-dasharray="4,4"/>

  <rect x="590" y="150" width="150" height="140" rx="12" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
  <text x="665" y="195" fill="#6EE7B7" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">INTELLIGENCE</text>
  <text x="665" y="225" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Google Gemini API</text>
  <text x="665" y="245" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Context Ingestion</text>

  <rect x="70" y="320" width="670" height="80" rx="12" fill="#0F172A" stroke="#334155"/>
  <text x="95" y="355" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">PERSISTENCE &amp; MEMORY RETRIEVAL</text>
  <text x="95" y="380" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">MongoDB Atlas with semantic vector embeddings for user privacy-managed study memory</text>
</svg>`;
  }

  _escapeXml(str = "") {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

module.exports = ImageGenerationProvider;