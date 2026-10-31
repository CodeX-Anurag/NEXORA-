const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle
} = require("docx");
const PDFDocument = require("pdfkit");

/**
 * Builds a styled, native DOCX document from structured resume data
 */
const generateResumeDocx = async (resumeData, template = "modern") => {
  const pInfo = resumeData.personalInfo || {};
  const isClassic = template === "classic";
  const isTechnical = template === "technical";

  const fontName = isClassic ? "Times New Roman" : isTechnical ? "Consolas" : "Calibri";
  const primaryColor = isClassic ? "1F2937" : isTechnical ? "047857" : "E0693B";

  const docChildren = [];

  // 1. Header: Name & Contact
  docChildren.push(
    new Paragraph({
      alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (pInfo.fullName || pInfo.name || "CANDIDATE").toUpperCase(),
          bold: true,
          size: 36, // 18pt
          font: fontName,
          color: "111827"
        })
      ]
    })
  );

  // Target Role & Contact Line
  const contactParts = [
    resumeData.targetRole ? `Role: ${resumeData.targetRole}` : null,
    pInfo.email,
    pInfo.phone,
    pInfo.location,
    pInfo.linkedin,
    pInfo.github,
    pInfo.portfolio
  ].filter(Boolean);

  docChildren.push(
    new Paragraph({
      alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: contactParts.join("  |  "),
          size: 18, // 9pt
          font: fontName,
          color: "4B5563"
        })
      ]
    })
  );

  // Helper to add section heading
  const addSectionHeading = (title) => {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        border: {
          bottom: {
            color: isClassic ? "4B5563" : primaryColor,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6
          }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            font: fontName,
            color: isClassic ? "1F2937" : primaryColor
          })
        ]
      })
    );
  };

  // 2. Professional Summary
  if (resumeData.professionalSummary || resumeData.summary) {
    addSectionHeading("Professional Summary");
    docChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: resumeData.professionalSummary || resumeData.summary,
            size: 20, // 10pt
            font: fontName,
            color: "374151"
          })
        ]
      })
    );
  }

  // 3. Technical Skills
  const skills = resumeData.skills;
  const hasSkills =
    Array.isArray(skills) ? skills.length > 0 : skills?.expert?.length || skills?.proficient?.length;

  if (hasSkills) {
    addSectionHeading("Technical Skills");

    if (Array.isArray(skills)) {
      // Group skills by category if available
      const categories = {};
      skills.forEach((s) => {
        const cat = s.category || "Languages & Technologies";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(typeof s === "string" ? s : s.name);
      });

      Object.entries(categories).forEach(([category, skillList]) => {
        docChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `${category.charAt(0).toUpperCase() + category.slice(1)}: `,
                bold: true,
                size: 20,
                font: fontName,
                color: "1F2937"
              }),
              new TextRun({
                text: skillList.join(", "),
                size: 20,
                font: fontName,
                color: "4B5563"
              })
            ]
          })
        );
      });
    } else {
      const skillsLine = [
        skills.expert?.length ? `Expert: ${skills.expert.join(", ")}` : null,
        skills.proficient?.length ? `Proficient: ${skills.proficient.join(", ")}` : null,
        skills.developing?.length ? `Developing: ${skills.developing.join(", ")}` : null
      ]
        .filter(Boolean)
        .join("\n");

      docChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: skillsLine,
              size: 20,
              font: fontName,
              color: "374151"
            })
          ]
        })
      );
    }
  }

  // 4. Work Experience & Internships
  if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
    addSectionHeading("Professional Experience");

    resumeData.experience.forEach((exp) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.title || "Role",
              bold: true,
              size: 20,
              font: fontName,
              color: "111827"
            }),
            new TextRun({
              text: ` — ${exp.company || ""}${exp.location ? ` (${exp.location})` : ""}`,
              size: 20,
              font: fontName,
              color: "4B5563"
            }),
            new TextRun({
              text: `\t${exp.startDate || ""}${exp.endDate ? ` – ${exp.endDate}` : ""}`,
              bold: true,
              size: 18,
              font: fontName,
              color: "6B7280"
            })
          ]
        })
      );

      if (exp.description) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: exp.description,
                size: 19,
                font: fontName,
                color: "4B5563"
              })
            ]
          })
        );
      }

      const bullets = Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [];
      bullets.forEach((b) => {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: b,
                size: 19,
                font: fontName,
                color: "374151"
              })
            ]
          })
        );
      });
    });
  }

  // 5. Portfolio Projects
  if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
    addSectionHeading("Portfolio Projects");

    resumeData.projects.forEach((proj) => {
      const tech = Array.isArray(proj.techStack) ? proj.techStack.join(", ") : "";

      docChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: proj.title || "Project",
              bold: true,
              size: 20,
              font: fontName,
              color: "111827"
            }),
            tech
              ? new TextRun({
                  text: ` [${tech}]`,
                  italics: true,
                  size: 18,
                  font: fontName,
                  color: primaryColor
                })
              : new TextRun({ text: "" }),
            proj.githubUrl || proj.demoUrl
              ? new TextRun({
                  text: `\t${[proj.githubUrl, proj.demoUrl].filter(Boolean).join(" | ")}`,
                  size: 16,
                  font: fontName,
                  color: "6B7280"
                })
              : new TextRun({ text: "" })
          ]
        })
      );

      if (proj.description) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: proj.description,
                size: 19,
                font: fontName,
                color: "4B5563"
              })
            ]
          })
        );
      }

      const bullets = Array.isArray(proj.bulletPoints) ? proj.bulletPoints : [];
      bullets.forEach((b) => {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: b,
                size: 19,
                font: fontName,
                color: "374151"
              })
            ]
          })
        );
      });
    });
  }

  // 6. Education
  if (Array.isArray(resumeData.education) && resumeData.education.length > 0) {
    addSectionHeading("Education");

    resumeData.education.forEach((edu) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: `${edu.degree || "Degree"}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}`,
              bold: true,
              size: 20,
              font: fontName,
              color: "111827"
            }),
            new TextRun({
              text: ` — ${edu.institution || ""}${edu.location ? ` (${edu.location})` : ""}`,
              size: 20,
              font: fontName,
              color: "4B5563"
            }),
            new TextRun({
              text: `\t${edu.startDate || ""}${edu.endDate ? ` – ${edu.endDate}` : ""}`,
              bold: true,
              size: 18,
              font: fontName,
              color: "6B7280"
            })
          ]
        })
      );

      if (edu.gpa) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `GPA: ${edu.gpa}`,
                italics: true,
                size: 18,
                font: fontName,
                color: "4B5563"
              })
            ]
          })
        );
      }

      if (Array.isArray(edu.coursework) && edu.coursework.length > 0) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `Relevant Coursework: ${edu.coursework.join(", ")}`,
                size: 18,
                font: fontName,
                color: "6B7280"
              })
            ]
          })
        );
      }
    });
  }

  // 7. Certifications & Achievements
  if (Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) {
    addSectionHeading("Certifications");
    resumeData.certifications.forEach((c) => {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: c.name || "Certification",
              bold: true,
              size: 19,
              font: fontName,
              color: "1F2937"
            }),
            new TextRun({
              text: ` (${c.issuer || ""}${c.issueDate ? `, ${c.issueDate}` : ""})`,
              size: 18,
              font: fontName,
              color: "4B5563"
            })
          ]
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        children: docChildren
      }
    ]
  });

  return await Packer.toBuffer(doc);
};

/**
 * Builds a clean, selectable-text vector PDF buffer using pdfkit
 */
const generateResumePdf = (resumeData, template = "modern") => {
  return new Promise((resolve, reject) => {
    try {
      const isClassic = template === "classic";
      const isTechnical = template === "technical";

      const primaryColorHex = isClassic ? "#1E293B" : isTechnical ? "#047857" : "#E0693B";
      const bodyColorHex = "#334155";
      const headerFont = isClassic ? "Times-Bold" : isTechnical ? "Courier-Bold" : "Helvetica-Bold";
      const bodyFont = isClassic ? "Times-Roman" : isTechnical ? "Courier" : "Helvetica";

      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        info: {
          Title: `${resumeData?.personalInfo?.fullName || "Resume"} - NEXORA Resume Intelligence`,
          Author: resumeData?.personalInfo?.fullName || "Student",
          Subject: "Professional Resume",
          Creator: "NEXORA Resume Engine"
        }
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const pInfo = resumeData.personalInfo || {};

      // 1. Header: Name
      doc
        .font(headerFont)
        .fontSize(22)
        .fillColor(isClassic ? "#0F172A" : primaryColorHex)
        .text((pInfo.fullName || pInfo.name || "Candidate Name").toUpperCase(), {
          align: isClassic ? "center" : "left"
        });

      // Target Role
      if (resumeData.targetRole) {
        doc
          .font(bodyFont)
          .fontSize(11)
          .fillColor("#475569")
          .text(resumeData.targetRole, { align: isClassic ? "center" : "left" });
      }

      // Contact bar
      const contactParts = [
        pInfo.email,
        pInfo.phone,
        pInfo.location,
        pInfo.linkedin,
        pInfo.github,
        pInfo.portfolio
      ].filter(Boolean);

      doc
        .font(bodyFont)
        .fontSize(8.5)
        .fillColor("#64748B")
        .text(contactParts.join("   •   "), { align: isClassic ? "center" : "left" });

      doc.moveDown(0.6);

      // Section Header Helper
      const renderSectionHeading = (title) => {
        doc.moveDown(0.5);
        doc
          .font(headerFont)
          .fontSize(11)
          .fillColor(isClassic ? "#0F172A" : primaryColorHex)
          .text(title.toUpperCase());

        const y = doc.y;
        doc
          .strokeColor(isClassic ? "#94A3B8" : primaryColorHex)
          .lineWidth(0.8)
          .moveTo(40, y)
          .lineTo(572, y)
          .stroke();

        doc.moveDown(0.3);
      };

      // 2. Summary
      if (resumeData.professionalSummary || resumeData.summary) {
        renderSectionHeading("Professional Summary");
        doc
          .font(bodyFont)
          .fontSize(9.5)
          .fillColor(bodyColorHex)
          .text(resumeData.professionalSummary || resumeData.summary, {
            lineGap: 2,
            align: "justify"
          });
      }

      // 3. Technical Skills
      const skills = resumeData.skills;
      if (Array.isArray(skills) && skills.length > 0) {
        renderSectionHeading("Technical Skills");
        const categories = {};
        skills.forEach((s) => {
          const cat = s.category || "General";
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(typeof s === "string" ? s : s.name);
        });

        Object.entries(categories).forEach(([category, skillList]) => {
          doc
            .font(headerFont)
            .fontSize(9)
            .fillColor("#1E293B")
            .text(`${category.charAt(0).toUpperCase() + category.slice(1)}: `, { continued: true })
            .font(bodyFont)
            .fillColor(bodyColorHex)
            .text(skillList.join(", "));
        });
      }

      // 4. Experience
      if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
        renderSectionHeading("Professional Experience");
        resumeData.experience.forEach((exp) => {
          doc.moveDown(0.3);
          doc
            .font(headerFont)
            .fontSize(10)
            .fillColor("#0F172A")
            .text(exp.title || "Role", { continued: true })
            .font(bodyFont)
            .fillColor("#475569")
            .text(`  |  ${exp.company || ""}${exp.location ? `, ${exp.location}` : ""}`, {
              continued: true
            })
            .font(bodyFont)
            .fontSize(8.5)
            .fillColor("#64748B")
            .text(`  (${exp.startDate || ""}${exp.endDate ? ` – ${exp.endDate}` : ""})`, {
              align: "right"
            });

          if (exp.description) {
            doc
              .font(bodyFont)
              .fontSize(9)
              .fillColor(bodyColorHex)
              .text(exp.description, { lineGap: 1.5 });
          }

          const bullets = Array.isArray(exp.bulletPoints) ? exp.bulletPoints : [];
          bullets.forEach((b) => {
            doc
              .font(bodyFont)
              .fontSize(9)
              .fillColor(bodyColorHex)
              .text(`•   ${b}`, { indent: 10, lineGap: 1.5 });
          });
        });
      }

      // 5. Projects
      if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
        renderSectionHeading("Portfolio Projects");
        resumeData.projects.forEach((proj) => {
          doc.moveDown(0.3);
          const tech = Array.isArray(proj.techStack) ? proj.techStack.join(", ") : "";

          doc
            .font(headerFont)
            .fontSize(10)
            .fillColor("#0F172A")
            .text(proj.title || "Project", { continued: true });

          if (tech) {
            doc
              .font(bodyFont)
              .fontSize(8.5)
              .fillColor(primaryColorHex)
              .text(`  [${tech}]`, { continued: true });
          }

          if (proj.githubUrl || proj.demoUrl) {
            doc
              .font(bodyFont)
              .fontSize(8)
              .fillColor("#64748B")
              .text(`  ${[proj.githubUrl, proj.demoUrl].filter(Boolean).join(" | ")}`, {
                align: "right"
              });
          } else {
            doc.text("");
          }

          if (proj.description) {
            doc
              .font(bodyFont)
              .fontSize(9)
              .fillColor(bodyColorHex)
              .text(proj.description, { lineGap: 1.5 });
          }

          const bullets = Array.isArray(proj.bulletPoints) ? proj.bulletPoints : [];
          bullets.forEach((b) => {
            doc
              .font(bodyFont)
              .fontSize(9)
              .fillColor(bodyColorHex)
              .text(`•   ${b}`, { indent: 10, lineGap: 1.5 });
          });
        });
      }

      // 6. Education
      if (Array.isArray(resumeData.education) && resumeData.education.length > 0) {
        renderSectionHeading("Education");
        resumeData.education.forEach((edu) => {
          doc.moveDown(0.2);
          doc
            .font(headerFont)
            .fontSize(9.5)
            .fillColor("#0F172A")
            .text(`${edu.degree || "Degree"}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}`, {
              continued: true
            })
            .font(bodyFont)
            .fillColor("#475569")
            .text(`  —  ${edu.institution || ""}${edu.location ? ` (${edu.location})` : ""}`, {
              continued: true
            })
            .font(bodyFont)
            .fontSize(8.5)
            .fillColor("#64748B")
            .text(`  ${edu.startDate || ""}${edu.endDate ? ` – ${edu.endDate}` : ""}`, {
              align: "right"
            });

          if (edu.gpa) {
            doc
              .font(bodyFont)
              .fontSize(8.5)
              .fillColor("#475569")
              .text(`Cumulative GPA: ${edu.gpa}`);
          }

          if (Array.isArray(edu.coursework) && edu.coursework.length > 0) {
            doc
              .font(bodyFont)
              .fontSize(8.5)
              .fillColor("#64748B")
              .text(`Coursework: ${edu.coursework.join(", ")}`);
          }
        });
      }

      // 7. Certifications
      if (Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) {
        renderSectionHeading("Certifications");
        resumeData.certifications.forEach((c) => {
          doc
            .font(bodyFont)
            .fontSize(9)
            .fillColor(bodyColorHex)
            .text(`•   ${c.name || "Certification"} — ${c.issuer || ""}${c.issueDate ? ` (${c.issueDate})` : ""}`);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateResumeDocx,
  generateResumePdf
};
