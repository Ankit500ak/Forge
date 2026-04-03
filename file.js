const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
    UnderlineType, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// Color palette
const COLORS = {
    primary: "1A1A2E",       // Deep navy
    accent: "E94560",        // Vivid red-orange
    accent2: "0F3460",       // Mid blue
    accent3: "16213E",       // Dark blue
    lightBg: "F4F6FB",       // Very light blue-grey
    tableBg: "EAF0FA",       // Light blue for table headers
    white: "FFFFFF",
    darkGray: "2D2D2D",
    medGray: "555555",
    lightGray: "888888",
    borderGray: "CCCCCC",
    accentLight: "FFF0F3",   // Light pink accent bg
    green: "1A7A4A",
    greenLight: "E8F5EE",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.borderGray };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
};

function sp(before = 0, after = 0) {
    return { spacing: { before, after } };
}

function heading1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: COLORS.primary })],
        spacing: { before: 360, after: 120 },
        border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.accent, space: 4 }
        }
    });
}

function heading2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: COLORS.accent2 })],
        spacing: { before: 280, after: 100 }
    });
}

function heading3(text) {
    return new Paragraph({
        children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: COLORS.accent })],
        spacing: { before: 200, after: 80 }
    });
}

function body(text, options = {}) {
    return new Paragraph({
        children: [new TextRun({ text, font: "Arial", size: 22, color: COLORS.darkGray, ...options })],
        spacing: { before: 60, after: 80 },
        alignment: AlignmentType.JUSTIFIED
    });
}

function bullet(text, bold_prefix = "") {
    return new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [
            bold_prefix ? new TextRun({ text: bold_prefix + " ", font: "Arial", size: 22, bold: true, color: COLORS.accent2 }) : null,
            new TextRun({ text, font: "Arial", size: 22, color: COLORS.darkGray })
        ].filter(Boolean),
        spacing: { before: 40, after: 40 }
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function divider() {
    return new Paragraph({
        children: [new TextRun({ text: "", font: "Arial", size: 4 })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.accent, space: 1 } },
        spacing: { before: 160, after: 160 }
    });
}

function thinDivider() {
    return new Paragraph({
        children: [new TextRun({ text: "", font: "Arial", size: 2 })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray, space: 1 } },
        spacing: { before: 80, after: 80 }
    });
}

function spacer(sz = 120) {
    return new Paragraph({ children: [new TextRun({ text: "", size: sz })], spacing: { before: 0, after: 0 } });
}

// Shaded info box
function infoBox(label, value, bgColor = COLORS.lightBg) {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 7160],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders,
                        width: { size: 2200, type: WidthType.DXA },
                        shading: { fill: COLORS.accent2, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 180, right: 120 },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: COLORS.white })] })]
                    }),
                    new TableCell({
                        borders: noBorders,
                        width: { size: 7160, type: WidthType.DXA },
                        shading: { fill: bgColor, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 180, right: 120 },
                        children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 22, color: COLORS.darkGray })] })]
                    })
                ]
            })
        ]
    });
}

// ─────────────────────────────────────────────────────────
// COVER PAGE
// ─────────────────────────────────────────────────────────
function makeCoverPage() {
    return [
        // Top accent bar simulation via shaded table
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 3120, 3120],
            rows: [new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders, width: { size: 3120, type: WidthType.DXA },
                        shading: { fill: COLORS.accent, type: ShadingType.CLEAR },
                        children: [new Paragraph({ children: [new TextRun({ text: "", size: 8 })] })]
                    }),
                    new TableCell({
                        borders: noBorders, width: { size: 3120, type: WidthType.DXA },
                        shading: { fill: COLORS.accent2, type: ShadingType.CLEAR },
                        children: [new Paragraph({ children: [new TextRun({ text: "", size: 8 })] })]
                    }),
                    new TableCell({
                        borders: noBorders, width: { size: 3120, type: WidthType.DXA },
                        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                        children: [new Paragraph({ children: [new TextRun({ text: "", size: 8 })] })]
                    }),
                ]
            })]
        }),

        spacer(400),

        new Paragraph({
            children: [new TextRun({ text: "PROJECT SYNOPSIS", font: "Arial", size: 20, bold: true, color: COLORS.accent, characterSpacing: 200 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 }
        }),

        spacer(60),

        new Paragraph({
            children: [new TextRun({ text: "FORGE", font: "Arial", size: 96, bold: true, color: COLORS.primary, characterSpacing: 400 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 }
        }),

        new Paragraph({
            children: [new TextRun({ text: "FITNESS PLATFORM", font: "Arial", size: 40, bold: false, color: COLORS.accent2, characterSpacing: 300 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 0 }
        }),

        spacer(60),

        new Paragraph({
            children: [new TextRun({ text: "Gamified Digital Health & AI-Powered Nutrition Intelligence", font: "Arial", size: 24, color: COLORS.medGray, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 0 }
        }),

        spacer(240),

        // Cover info table
        new Table({
            width: { size: 7200, type: WidthType.DXA },
            columnWidths: [3600, 3600],
            rows: [
                makeInfoRow("Document Type", "Professional Synopsis"),
                makeInfoRow("Prepared On", "10 March 2026"),
                makeInfoRow("Platform Type", "Full-Stack Web + ML Platform"),
                makeInfoRow("Domain", "Health Informatics / Fitness Technology"),
                makeInfoRow("Technology Stack", "Next.js · Node.js · PostgreSQL · TensorFlow"),
                makeInfoRow("Model Architecture", "MobileNetV2 Transfer Learning"),
            ]
        }),

        spacer(300),

        new Paragraph({
            children: [
                new TextRun({ text: "Keywords: ", font: "Arial", size: 18, bold: true, color: COLORS.accent2 }),
                new TextRun({ text: "Gamified Fitness  ·  Machine Learning  ·  Behavior Reinforcement  ·  Nutrition Intelligence  ·  Full-Stack Web  ·  MobileNetV2", font: "Arial", size: 18, color: COLORS.lightGray })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 }
        }),

        spacer(200),

        // Bottom bar
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [new TableRow({
                children: [new TableCell({
                    borders: noBorders, width: { size: 9360, type: WidthType.DXA },
                    shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                    margins: { top: 140, bottom: 140, left: 300, right: 300 },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "CONFIDENTIAL — ACADEMIC / PRE-PRODUCTION DOCUMENT", font: "Arial", size: 18, bold: true, color: COLORS.white, characterSpacing: 120 })],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                })]
            })]
        }),

        pageBreak()
    ];
}

function makeInfoRow(label, value) {
    return new TableRow({
        children: [
            new TableCell({
                borders,
                width: { size: 3600, type: WidthType.DXA },
                shading: { fill: COLORS.tableBg, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 160, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })]
            }),
            new TableCell({
                borders,
                width: { size: 3600, type: WidthType.DXA },
                shading: { fill: COLORS.white, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 160, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 20, color: COLORS.darkGray })] })]
            })
        ]
    });
}

// ─────────────────────────────────────────────────────────
// ABSTRACT
// ─────────────────────────────────────────────────────────
function makeAbstract() {
    return [
        heading1("Abstract"),
        spacer(60),
        // Shaded abstract box
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [new TableRow({
                children: [new TableCell({
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.accent },
                        bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray },
                        left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.accent },
                        right: { style: BorderStyle.NONE }
                    },
                    width: { size: 9360, type: WidthType.DXA },
                    shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
                    margins: { top: 180, bottom: 180, left: 280, right: 280 },
                    children: [
                        new Paragraph({
                            children: [new TextRun({
                                text: "FORGE is a gamified digital fitness platform engineered to improve long-term adherence to healthy behavior through progression-based feedback loops, intelligent nutrition support, and immersive user experiences. The system tightly integrates workout progression mechanics, ranking systems, and AI-driven food detection workflows to deliver a complete, user-centric health tracking environment.",
                                font: "Arial", size: 22, color: COLORS.darkGray, italics: true
                            })],
                            alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 120 }
                        }),
                        new Paragraph({
                            children: [new TextRun({
                                text: "By combining a modern full-stack web architecture with machine learning-assisted food recognition (MobileNetV2 transfer learning), FORGE simultaneously addresses two core barriers in conventional fitness applications: user motivation and the friction of daily health data entry. The result is a cohesive platform where gamified reward loops and AI-assisted intelligence converge to sustain engagement, drive better behavioral habits, and produce richer, more actionable nutrition data.",
                                font: "Arial", size: 22, color: COLORS.darkGray, italics: true
                            })],
                            alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 0 }
                        }),
                    ]
                })]
            })]
        }),
        spacer(120)
    ];
}

// ─────────────────────────────────────────────────────────
// PROJECT OVERVIEW TABLE
// ─────────────────────────────────────────────────────────
function makeOverviewTable() {
    const rows = [
        ["Platform Name", "FORGE Fitness Platform", "Category", "Health & Fitness Technology"],
        ["Development Model", "Modular Full-Stack Architecture", "Frontend Framework", "Next.js + React + TypeScript"],
        ["Backend Runtime", "Node.js + Express", "Database", "PostgreSQL"],
        ["ML Framework", "TensorFlow / Keras (Python)", "ML Model", "MobileNetV2 (Transfer Learning)"],
        ["Mobile Path", "Capacitor (Android & iOS)", "Auth Mechanism", "JWT Token-Based Authentication"],
        ["Styling System", "Tailwind CSS", "AI Input Resolution", "224 × 224 px (standardised)"],
    ];

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 2880, 1800, 2880],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        columnSpan: 4,
                        borders,
                        width: { size: 9360, type: WidthType.DXA },
                        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [new Paragraph({
                            children: [new TextRun({ text: "PLATFORM QUICK REFERENCE", font: "Arial", size: 22, bold: true, color: COLORS.white, characterSpacing: 120 })],
                            alignment: AlignmentType.CENTER
                        })]
                    })
                ]
            }),
            ...rows.map((r, i) => new TableRow({
                children: [
                    new TableCell({
                        borders, width: { size: 1800, type: WidthType.DXA },
                        shading: { fill: i % 2 === 0 ? COLORS.tableBg : COLORS.lightBg, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 140, right: 80 },
                        children: [new Paragraph({ children: [new TextRun({ text: r[0], font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })]
                    }),
                    new TableCell({
                        borders, width: { size: 2880, type: WidthType.DXA },
                        shading: { fill: COLORS.white, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 140, right: 80 },
                        children: [new Paragraph({ children: [new TextRun({ text: r[1], font: "Arial", size: 20, color: COLORS.darkGray })] })]
                    }),
                    new TableCell({
                        borders, width: { size: 1800, type: WidthType.DXA },
                        shading: { fill: i % 2 === 0 ? COLORS.tableBg : COLORS.lightBg, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 140, right: 80 },
                        children: [new Paragraph({ children: [new TextRun({ text: r[2], font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })]
                    }),
                    new TableCell({
                        borders, width: { size: 2880, type: WidthType.DXA },
                        shading: { fill: COLORS.white, type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 140, right: 80 },
                        children: [new Paragraph({ children: [new TextRun({ text: r[3], font: "Arial", size: 20, color: COLORS.darkGray })] })]
                    }),
                ]
            }))
        ]
    });
}

// ─────────────────────────────────────────────────────────
// ARCHITECTURE DIAGRAM (text-based, styled table)
// ─────────────────────────────────────────────────────────
function makeArchitectureDiagram() {
    function archCell(text, bg, textColor = COLORS.white, bold = true, size = 20) {
        return new TableCell({
            borders: noBorders,
            shading: { fill: bg, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
                children: [new TextRun({ text, font: "Arial", size, bold, color: textColor })],
                alignment: AlignmentType.CENTER
            })]
        });
    }

    function arrowRow(label = "▼") {
        return new TableRow({
            children: [
                new TableCell({
                    borders: noBorders, width: { size: 9360, type: WidthType.DXA }, columnSpan: 5,
                    margins: { top: 20, bottom: 20, left: 0, right: 0 },
                    children: [new Paragraph({
                        children: [new TextRun({ text: label, font: "Arial", size: 22, color: COLORS.accent, bold: true })],
                        alignment: AlignmentType.CENTER
                    })]
                })
            ]
        });
    }

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
            // Title
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders,
                        shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                        margins: { top: 160, bottom: 160, left: 200, right: 200 },
                        children: [new Paragraph({
                            children: [new TextRun({ text: "FORGE SYSTEM ARCHITECTURE", font: "Arial", size: 26, bold: true, color: COLORS.white, characterSpacing: 200 })],
                            alignment: AlignmentType.CENTER
                        })]
                    })
                ]
            }),

            // Layer 1: Client
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders,
                        shading: { fill: COLORS.accentLight, type: ShadingType.CLEAR },
                        margins: { top: 120, bottom: 120, left: 200, right: 200 },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "CLIENT / PRESENTATION LAYER", font: "Arial", size: 20, bold: true, color: COLORS.accent, characterSpacing: 120 })], alignment: AlignmentType.CENTER }),
                            spacer(40),
                            new Table({
                                width: { size: 8800, type: WidthType.DXA },
                                columnWidths: [2933, 2933, 2934],
                                rows: [new TableRow({
                                    children: [
                                        new TableCell({
                                            borders, width: { size: 2933, type: WidthType.DXA }, shading: { fill: COLORS.accent, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Next.js 14 / React", font: "Arial", size: 20, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 2933, type: WidthType.DXA }, shading: { fill: COLORS.accent, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "TypeScript + Tailwind CSS", font: "Arial", size: 20, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 2934, type: WidthType.DXA }, shading: { fill: COLORS.accent, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Capacitor (iOS / Android)", font: "Arial", size: 20, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                    ]
                                })]
                            })
                        ]
                    })
                ]
            }),

            arrowRow("▼  REST API / HTTP  ▼"),

            // Layer 2: API Gateway
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders,
                        shading: { fill: "E8EEF8", type: ShadingType.CLEAR },
                        margins: { top: 120, bottom: 120, left: 200, right: 200 },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "API GATEWAY & BUSINESS LOGIC LAYER", font: "Arial", size: 20, bold: true, color: COLORS.accent2, characterSpacing: 120 })], alignment: AlignmentType.CENTER }),
                            spacer(40),
                            new Table({
                                width: { size: 8800, type: WidthType.DXA },
                                columnWidths: [2200, 2200, 2200, 2200],
                                rows: [new TableRow({
                                    children: [
                                        new TableCell({
                                            borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: COLORS.accent2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Auth Service\n(JWT)", font: "Arial", size: 19, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: COLORS.accent2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Fitness API\n(XP / Rank)", font: "Arial", size: 19, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: COLORS.accent2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Nutrition API\n(Food & Macros)", font: "Arial", size: 19, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 2200, type: WidthType.DXA }, shading: { fill: COLORS.accent2, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 },
                                            children: [new Paragraph({ children: [new TextRun({ text: "Monitor API\n(Health / Scheduler)", font: "Arial", size: 19, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER })]
                                        }),
                                    ]
                                })]
                            }),
                            spacer(40),
                            new Paragraph({ children: [new TextRun({ text: "Node.js + Express  |  Modular Route Handlers  |  Middleware Pipeline  |  Error Boundary", font: "Arial", size: 18, color: COLORS.medGray })], alignment: AlignmentType.CENTER })
                        ]
                    })
                ]
            }),

            arrowRow("▼  SQL Queries  ▼                    ▼  HTTP / Python RPC  ▼"),

            // Layer 3: Data + ML
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorders,
                        shading: { fill: "E8F5EE", type: ShadingType.CLEAR },
                        margins: { top: 120, bottom: 120, left: 200, right: 200 },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "DATA & INTELLIGENCE LAYER", font: "Arial", size: 20, bold: true, color: COLORS.green, characterSpacing: 120 })], alignment: AlignmentType.CENTER }),
                            spacer(40),
                            new Table({
                                width: { size: 8800, type: WidthType.DXA },
                                columnWidths: [4400, 4400],
                                rows: [new TableRow({
                                    children: [
                                        new TableCell({
                                            borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: COLORS.green, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                                            children: [
                                                new Paragraph({ children: [new TextRun({ text: "PostgreSQL Database", font: "Arial", size: 20, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER }),
                                                new Paragraph({ children: [new TextRun({ text: "Users · Profiles · Fitness Records · Nutrition Logs · XP History · Rankings", font: "Arial", size: 18, color: "CCFFDD" })], alignment: AlignmentType.CENTER })
                                            ]
                                        }),
                                        new TableCell({
                                            borders, width: { size: 4400, type: WidthType.DXA }, shading: { fill: "0A6644", type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
                                            children: [
                                                new Paragraph({ children: [new TextRun({ text: "ML Inference Service (Python)", font: "Arial", size: 20, bold: true, color: COLORS.white })], alignment: AlignmentType.CENTER }),
                                                new Paragraph({ children: [new TextRun({ text: "MobileNetV2 · TensorFlow/Keras · 224×224 Input · Class Probability Output", font: "Arial", size: 18, color: "CCFFDD" })], alignment: AlignmentType.CENTER })
                                            ]
                                        }),
                                    ]
                                })]
                            })
                        ]
                    })
                ]
            }),

            // Legend
            new TableRow({
                children: [
                    new TableCell({
                        borders: { top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.borderGray }, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right },
                        shading: { fill: "F8F8F8", type: ShadingType.CLEAR },
                        margins: { top: 80, bottom: 80, left: 200, right: 200 },
                        children: [new Paragraph({
                            children: [new TextRun({ text: "■ Presentation  ", font: "Arial", size: 18, color: COLORS.accent }),
                            new TextRun({ text: "■ API / Logic  ", font: "Arial", size: 18, color: COLORS.accent2 }),
                            new TextRun({ text: "■ Data / ML Layer  ", font: "Arial", size: 18, color: COLORS.green }),
                            new TextRun({ text: "— REST JSON over HTTP — ", font: "Arial", size: 18, color: COLORS.lightGray })],
                            alignment: AlignmentType.CENTER
                        })]
                    })
                ]
            }),
        ]
    });
}

// ─────────────────────────────────────────────────────────
// MODULE TABLE
// ─────────────────────────────────────────────────────────
function makeModuleTable() {
    const modules = [
        { name: "Authentication & Profile", icon: "🔐", desc: "Secure JWT-based login, registration, password hashing, and user profile CRUD operations. Session management with token refresh and middleware-guarded routes.", tech: "Node.js · bcrypt · JWT · PostgreSQL" },
        { name: "Fitness Progression", icon: "⚡", desc: "Task creation, completion tracking, XP accumulation, and rank-tier advancement engine. Implements game-inspired motivation loops with milestone rewards and streak detection.", tech: "Express · PostgreSQL · Scheduler" },
        { name: "Food Intelligence", icon: "🧠", desc: "ML-powered food category detection from user images, automated nutrition metadata enrichment, macro/calorie computation, and meal recommendation generation.", tech: "TensorFlow · MobileNetV2 · Python RPC" },
        { name: "Camera Capture", icon: "📷", desc: "Camera access, image capture, pre-processing pipeline for ML inference, detection history, and configurable capture settings for both web and mobile targets.", tech: "MediaStream API · Capacitor Camera" },
        { name: "Dashboard & Analytics", icon: "📊", desc: "Responsive performance dashboards with charting components displaying XP trends, rank history, calorie balance, macro breakdowns, and nutrition patterns over time.", tech: "React · Charting Libraries · Next.js" },
        { name: "Monitoring & Operations", icon: "🔧", desc: "Health check endpoints, scheduled job orchestration (reminder notifications, data aggregation), subsystem status visibility, and operational logging infrastructure.", tech: "Express · node-cron · Health Probes" },
    ];

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1000, 3680, 4680],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        columnSpan: 3, borders, shading: { fill: COLORS.accent2, type: ShadingType.CLEAR }, width: { size: 9360, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [new Paragraph({ children: [new TextRun({ text: "FUNCTIONAL MODULE BREAKDOWN", font: "Arial", size: 22, bold: true, color: COLORS.white, characterSpacing: 120 })], alignment: AlignmentType.CENTER })]
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({ borders, shading: { fill: COLORS.tableBg, type: ShadingType.CLEAR }, width: { size: 1000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "#", font: "Arial", size: 20, bold: true, color: COLORS.accent2 })], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ borders, shading: { fill: COLORS.tableBg, type: ShadingType.CLEAR }, width: { size: 3680, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Module Description", font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })] }),
                    new TableCell({ borders, shading: { fill: COLORS.tableBg, type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Technology Stack", font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })] }),
                ]
            }),
            ...modules.map((m, i) => new TableRow({
                children: [
                    new TableCell({
                        borders, width: { size: 1000, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBg, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 100, right: 80 }, verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ children: [new TextRun({ text: m.icon, font: "Arial", size: 24 })], alignment: AlignmentType.CENTER })]
                    }),
                    new TableCell({
                        borders, width: { size: 3680, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBg, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 100 },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: m.name, font: "Arial", size: 21, bold: true, color: COLORS.accent2 })], spacing: { before: 0, after: 40 } }),
                            new Paragraph({ children: [new TextRun({ text: m.desc, font: "Arial", size: 19, color: COLORS.medGray })], alignment: AlignmentType.JUSTIFIED })
                        ]
                    }),
                    new TableCell({
                        borders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBg, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 100 }, verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ children: [new TextRun({ text: m.tech, font: "Arial", size: 19, color: COLORS.green, bold: true })] })]
                    }),
                ]
            }))
        ]
    });
}

// ─────────────────────────────────────────────────────────
// ML SECTION TABLE
// ─────────────────────────────────────────────────────────
function makeMLTable() {
    const rows = [
        ["Base Architecture", "MobileNetV2 — lightweight depthwise separable convolutions optimised for edge/server inference"],
        ["Training Paradigm", "Transfer Learning — ImageNet pre-trained weights fine-tuned on food category dataset"],
        ["Runtime Environment", "TensorFlow / Keras (Python service), orchestrated via HTTP RPC from Node.js backend"],
        ["Input Specification", "Standardised 224 × 224 px RGB image with pixel normalisation to [0, 1] range"],
        ["Output Specification", "Class probability vector; top-K confidence-ranked food category predictions returned as JSON"],
        ["Integration Pattern", "Camera module → Image pre-processing → Python inference service → Nutrition metadata lookup → API response"],
        ["Food Detection Purpose", "Identify food category from user-provided image; reduce manual meal logging friction"],
        ["Nutrition Enrichment", "Detected class mapped to macro/calorie metadata database; powers per-meal and daily nutrition summary"],
        ["Practical Impact", "Assistive logging layer sustaining data capture continuity; improves tracking adherence without manual entry"],
    ];

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2600, 6760],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        columnSpan: 2, borders, shading: { fill: COLORS.primary, type: ShadingType.CLEAR }, width: { size: 9360, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [new Paragraph({ children: [new TextRun({ text: "MACHINE LEARNING — MODEL SPECIFICATION", font: "Arial", size: 22, bold: true, color: COLORS.white, characterSpacing: 120 })], alignment: AlignmentType.CENTER })]
                    })
                ]
            }),
            ...rows.map((r, i) => new TableRow({
                children: [
                    new TableCell({
                        borders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLORS.tableBg : COLORS.lightBg, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ children: [new TextRun({ text: r[0], font: "Arial", size: 20, bold: true, color: COLORS.accent2 })] })]
                    }),
                    new TableCell({
                        borders, width: { size: 6760, type: WidthType.DXA }, shading: { fill: COLORS.white, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 },
                        children: [new Paragraph({ children: [new TextRun({ text: r[1], font: "Arial", size: 20, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED })]
                    }),
                ]
            }))
        ]
    });
}

// ─────────────────────────────────────────────────────────
// TECHNOLOGY STACK TABLE
// ─────────────────────────────────────────────────────────
function makeTechTable() {
    const stack = [
        {
            layer: "Frontend", color: COLORS.accent, items: [
                ["Framework", "Next.js 14 (React 18)"],
                ["Language", "TypeScript"],
                ["Styling", "Tailwind CSS"],
                ["Visualisation", "Recharts / Chart.js"],
                ["Mobile", "Capacitor (Android & iOS)"],
            ]
        },
        {
            layer: "Backend", color: COLORS.accent2, items: [
                ["Runtime", "Node.js"],
                ["Framework", "Express.js"],
                ["Authentication", "JSON Web Tokens (JWT)"],
                ["Password Hashing", "bcrypt"],
                ["Scheduling", "node-cron"],
            ]
        },
        {
            layer: "Database", color: COLORS.green, items: [
                ["Engine", "PostgreSQL"],
                ["Driver", "pg (node-postgres)"],
                ["Schema", "Relational / Normalised"],
                ["Migrations", "SQL scripts (versioned)"],
            ]
        },
        {
            layer: "ML / AI", color: "7B3F9E", items: [
                ["Framework", "TensorFlow / Keras"],
                ["Language", "Python 3.x"],
                ["Model Base", "MobileNetV2"],
                ["Training", "Transfer Learning (ImageNet)"],
                ["Serving", "Python HTTP RPC Service"],
            ]
        },
    ];

    const rows = [];
    // Header row
    rows.push(new TableRow({
        children: stack.map(s =>
            new TableCell({
                borders, shading: { fill: s.color, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: s.layer.toUpperCase(), font: "Arial", size: 22, bold: true, color: COLORS.white, characterSpacing: 100 })], alignment: AlignmentType.CENTER })]
            })
        )
    }));

    // Find max items
    const maxItems = Math.max(...stack.map(s => s.items.length));
    for (let i = 0; i < maxItems; i++) {
        rows.push(new TableRow({
            children: stack.map(s => {
                const item = s.items[i];
                return new TableCell({
                    borders, shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: item ? [
                        new Paragraph({ children: [new TextRun({ text: item[0], font: "Arial", size: 18, bold: true, color: COLORS.medGray })] }),
                        new Paragraph({ children: [new TextRun({ text: item[1], font: "Arial", size: 20, color: COLORS.darkGray })] })
                    ] : [new Paragraph({ children: [new TextRun({ text: " ", font: "Arial", size: 20 })] })]
                });
            })
        }));
    }

    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340, 2340, 2340, 2340], rows });
}

// ─────────────────────────────────────────────────────────
// RESULTS / IMPACT CARDS
// ─────────────────────────────────────────────────────────
function makeImpactTable() {
    const cards = [
        { title: "Higher Engagement", body: "Progression loops (XP, rank tiers, streaks) replicate proven game mechanics, sustaining active platform use beyond initial onboarding." },
        { title: "Better Adherence", body: "Consistent feedback and milestone recognition reduce drop-off by reinforcing daily tracking habits through positive, reward-driven interactions." },
        { title: "Informed Nutrition", body: "AI-assisted food detection removes friction from logging; nutrition enrichment transforms raw images into actionable macro and calorie insights." },
        { title: "Scalable Foundation", body: "Modular service separation allows independent evolution of UI, business logic, and ML inference without coupled releases or regression risk." },
    ];

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
            new TableRow({
                children: [cards[0], cards[1]].map(c => new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.accent }, bottom: border, left: border, right: border },
                    shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    children: [
                        new Paragraph({ children: [new TextRun({ text: c.title, font: "Arial", size: 22, bold: true, color: COLORS.accent2 })], spacing: { before: 0, after: 80 } }),
                        new Paragraph({ children: [new TextRun({ text: c.body, font: "Arial", size: 20, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED })
                    ]
                }))
            }),
            spacerRow(),
            new TableRow({
                children: [cards[2], cards[3]].map(c => new TableCell({
                    borders: { top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.accent }, bottom: border, left: border, right: border },
                    shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                    margins: { top: 140, bottom: 140, left: 180, right: 180 },
                    children: [
                        new Paragraph({ children: [new TextRun({ text: c.title, font: "Arial", size: 22, bold: true, color: COLORS.accent2 })], spacing: { before: 0, after: 80 } }),
                        new Paragraph({ children: [new TextRun({ text: c.body, font: "Arial", size: 20, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED })
                    ]
                }))
            }),
        ]
    });
}

function spacerRow() {
    return new TableRow({
        children: [
            new TableCell({
                columnSpan: 2, borders: noBorders, width: { size: 9360, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "", size: 12 })] })]
            })
        ]
    });
}

// ─────────────────────────────────────────────────────────
// LIMITATIONS & FUTURE WORK TABLE
// ─────────────────────────────────────────────────────────
function makeFutureTable() {
    const limitations = [
        "Production observability and CI/CD quality gate coverage can be broadened for more robust release confidence.",
        "Model governance, dataset versioning, and formal ML lifecycle practices require further formalisation.",
        "Advanced ML-assisted workout features (e.g. real-time pose estimation) are scaffolded but not yet production-ready.",
        "Mobile release workflow and app store deployment pipeline require a dedicated hardening phase.",
    ];

    const future = [
        "Real-time pose estimation for exercise form correction and rep counting via on-device ML.",
        "Personalised adaptive recommendation engine tuned to individual user behaviour and goal trajectories.",
        "Enhanced analytics instrumentation — user retention telemetry, cohort analysis, and funnel dashboards.",
        "Production-grade CI/CD pipelines with automated testing gates, blue-green deployments, and rollback strategies.",
        "Community features: leaderboards, challenge rooms, social progress sharing to amplify social motivation loops.",
    ];

    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders, shading: { fill: "FFF3E0", type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [new Paragraph({ children: [new TextRun({ text: "⚠  CURRENT LIMITATIONS", font: "Arial", size: 21, bold: true, color: "B45309" })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } })]
                    }),
                    new TableCell({
                        borders, shading: { fill: COLORS.greenLight, type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: [new Paragraph({ children: [new TextRun({ text: "✦  FUTURE ENHANCEMENTS", font: "Arial", size: 21, bold: true, color: COLORS.green })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } })]
                    }),
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        borders, shading: { fill: "FFFBF5", type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: limitations.map(l => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: l, font: "Arial", size: 20, color: COLORS.darkGray })], spacing: { before: 40, after: 60 }, alignment: AlignmentType.JUSTIFIED }))
                    }),
                    new TableCell({
                        borders, shading: { fill: "F0FBF5", type: ShadingType.CLEAR }, width: { size: 4680, type: WidthType.DXA },
                        margins: { top: 120, bottom: 120, left: 180, right: 180 },
                        children: future.map(f => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: f, font: "Arial", size: 20, color: COLORS.darkGray })], spacing: { before: 40, after: 60 }, alignment: AlignmentType.JUSTIFIED }))
                    }),
                ]
            }),
        ]
    });
}

// ─────────────────────────────────────────────────────────
// ASSEMBLE DOCUMENT
// ─────────────────────────────────────────────────────────
const doc = new Document({
    numbering: {
        config: [
            { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
        ]
    },
    styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, font: "Arial", color: COLORS.primary },
                paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 26, bold: true, font: "Arial", color: COLORS.accent2 },
                paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 }
            },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
            }
        },
        headers: {
            default: new Header({
                children: [
                    new Table({
                        width: { size: 10080, type: WidthType.DXA },
                        columnWidths: [6000, 4080],
                        rows: [new TableRow({
                            children: [
                                new TableCell({
                                    borders: noBorders, width: { size: 6000, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 0 },
                                    children: [new Paragraph({ children: [new TextRun({ text: "FORGE FITNESS PLATFORM  |  Project Synopsis", font: "Arial", size: 18, bold: true, color: COLORS.accent2 })] })]
                                }),
                                new TableCell({
                                    borders: noBorders, width: { size: 4080, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 0 },
                                    children: [new Paragraph({ children: [new TextRun({ text: "Prepared: 10 March 2026", font: "Arial", size: 18, color: COLORS.lightGray })], alignment: AlignmentType.RIGHT })]
                                }),
                            ]
                        })]
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "", size: 2 })],
                        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.accent } },
                        spacing: { before: 40, after: 0 }
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "", size: 2 })],
                        border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.accent2 } },
                        spacing: { before: 0, after: 40 }
                    }),
                    new Table({
                        width: { size: 10080, type: WidthType.DXA },
                        columnWidths: [5040, 5040],
                        rows: [new TableRow({
                            children: [
                                new TableCell({
                                    borders: noBorders, width: { size: 5040, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
                                    children: [new Paragraph({ children: [new TextRun({ text: "CONFIDENTIAL  |  Academic Pre-Production Document", font: "Arial", size: 16, color: COLORS.lightGray })] })]
                                }),
                                new TableCell({
                                    borders: noBorders, width: { size: 5040, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
                                    children: [new Paragraph({
                                        children: [
                                            new TextRun({ text: "Page ", font: "Arial", size: 16, color: COLORS.lightGray }),
                                            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: COLORS.lightGray }),
                                            new TextRun({ text: " of ", font: "Arial", size: 16, color: COLORS.lightGray }),
                                            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: COLORS.lightGray }),
                                        ],
                                        alignment: AlignmentType.RIGHT
                                    })]
                                }),
                            ]
                        })]
                    })
                ]
            })
        },
        children: [
            // ── COVER
            ...makeCoverPage(),

            // ── ABSTRACT
            ...makeAbstract(),
            divider(),

            // ── PROJECT OVERVIEW
            heading1("1. Project Overview"),
            body("FORGE is a full-stack gamified fitness platform purpose-built to solve two persistent challenges in consumer health technology: motivation decay and data capture friction. Unlike conventional fitness applications that rely on passive logging, FORGE employs a game-inspired progression framework — users earn experience points (XP) through completed fitness tasks, advance through rank tiers, and receive continuous positive reinforcement that sustains long-term engagement."),
            spacer(60),
            makeOverviewTable(),
            spacer(120),

            divider(),

            // ── AIMS & OBJECTIVES
            heading1("2. Aims & Objectives"),
            heading2("2.1 Project Aim"),
            body("To design and implement a scalable, modular fitness platform that unifies behavioral reinforcement, performance tracking, and AI-assisted nutrition intelligence into a single, cohesive digital health environment accessible on both web and mobile."),
            spacer(80),
            heading2("2.2 Core Objectives"),
            bullet("Build secure, JWT-based authentication and user profile management services with role-based access control.", "OBJ 1 "),
            bullet("Implement a robust XP accumulation, task management, and rank-tier progression engine.", "OBJ 2 "),
            bullet("Integrate camera-based food detection powered by a MobileNetV2 transfer learning classifier.", "OBJ 3 "),
            bullet("Enrich detected food data with automated macro and calorie metadata for actionable nutrition insight.", "OBJ 4 "),
            bullet("Deliver responsive, chart-rich dashboards for real-time performance and nutrition visibility.", "OBJ 5 "),
            bullet("Maintain strict module separation to enable independent scaling and long-term maintainability.", "OBJ 6 "),
            bullet("Establish a Capacitor-based mobile build path for Android and iOS deployment readiness.", "OBJ 7 "),
            spacer(120),

            divider(),

            // ── SYSTEM ARCHITECTURE
            heading1("3. System Architecture"),
            body("FORGE follows a three-tier modular architecture separating client presentation, API orchestration, and data/intelligence services. This decoupling ensures that each layer can be tested, scaled, and evolved independently — a critical design principle for long-term platform sustainability."),
            spacer(80),
            makeArchitectureDiagram(),
            spacer(120),

            heading2("3.1 Architectural Principles"),
            bullet("Separation of Concerns: Frontend, API logic, and ML inference exist as independently deployable units."),
            bullet("Stateless API Design: JWT-authenticated REST endpoints with no server-side session state, enabling horizontal scaling."),
            bullet("Orchestrated ML Inference: Node.js backend acts as an orchestrator; Python service handles all model inference, decoupling runtime environments."),
            bullet("Mobile-First Readiness: Capacitor wraps the Next.js web app for native iOS/Android deployment without code duplication."),
            spacer(120),

            divider(),

            // ── FUNCTIONAL MODULES
            heading1("4. Functional Module Breakdown"),
            body("FORGE is composed of six primary functional modules, each encapsulating a discrete domain of business logic. This modularity ensures minimal coupling between subsystems and allows individual services to be maintained, tested, or replaced without system-wide impact."),
            spacer(80),
            makeModuleTable(),
            spacer(120),

            divider(),
            pageBreak(),

            // ── ML
            heading1("5. Machine Learning Architecture"),
            body("The food intelligence subsystem is the primary machine learning component of FORGE. It leverages transfer learning on the MobileNetV2 architecture to provide real-time food category classification from user-captured images. The ML service is implemented as an independent Python process, orchestrated via HTTP RPC from the Node.js backend, ensuring clean separation between the application runtime and the model serving environment."),
            spacer(80),
            makeMLTable(),
            spacer(120),

            heading2("5.1 ML Inference Data Flow"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1400, 200, 1400, 200, 1400, 200, 1400, 200, 1400, 360],
                rows: [new TableRow({
                    children: [
                        ...[
                            ["1. Image Capture", COLORS.accent],
                            ["→", COLORS.white],
                            ["2. Preprocess\n224×224 px", COLORS.accent2],
                            ["→", COLORS.white],
                            ["3. ML Inference\nMobileNetV2", "0A6644"],
                            ["→", COLORS.white],
                            ["4. Class Map\nNutrition DB", COLORS.accent2],
                            ["→", COLORS.white],
                            ["5. API Response\nMacros + kcal", COLORS.accent],
                        ].map(([text, bg]) =>
                            new TableCell({
                                borders: bg === COLORS.white ? noBorders : borders, width: { size: bg === COLORS.white ? 200 : 1400, type: WidthType.DXA },
                                shading: { fill: bg, type: ShadingType.CLEAR },
                                margins: { top: 100, bottom: 100, left: 80, right: 80 }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: bg === COLORS.white ? 22 : 18, bold: bg !== COLORS.white, color: bg === COLORS.white ? COLORS.darkGray : COLORS.white })], alignment: AlignmentType.CENTER })]
                            })
                        ),
                        new TableCell({ borders: noBorders, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "", size: 1 })] })] })
                    ]
                })]
            }),
            spacer(120),

            divider(),

            // ── TECH STACK
            heading1("6. Technology Stack"),
            body("FORGE is built on a modern, production-proven technology stack selected for developer ergonomics, deployment flexibility, and ecosystem maturity. Each layer of the stack was chosen to minimise operational complexity while maximising extensibility."),
            spacer(80),
            makeTechTable(),
            spacer(120),

            divider(),

            // ── RESULTS
            heading1("7. Results & Impact"),
            body("FORGE delivers a technically cohesive platform where user motivation mechanisms and health data infrastructure are deeply integrated. The combination of gamification and AI-assisted tracking creates a differentiated product proposition with measurable advantages over conventional fitness applications."),
            spacer(80),
            makeImpactTable(),
            spacer(120),

            divider(),

            // ── LIMITATIONS & FUTURE
            heading1("8. Limitations & Future Work"),
            body("While FORGE represents a technically mature pre-production platform, several areas have been identified for further hardening and expansion. The following table contrasts acknowledged current limitations with a structured roadmap of future enhancements prioritised for subsequent development sprints."),
            spacer(80),
            makeFutureTable(),
            spacer(120),

            divider(),

            // ── CONCLUSION
            heading1("9. Conclusion"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [9360],
                rows: [new TableRow({
                    children: [new TableCell({
                        borders: { top: { style: BorderStyle.SINGLE, size: 8, color: COLORS.accent2 }, bottom: border, left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.accent2 }, right: noBorders.right },
                        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
                        width: { size: 9360, type: WidthType.DXA },
                        margins: { top: 200, bottom: 200, left: 280, right: 280 },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "FORGE demonstrates a robust, modern implementation of a gamified fitness ecosystem with practical machine learning integration. The platform's three-tier modular architecture ensures scalability and long-term maintainability, while its progression-driven UX model addresses a fundamental weakness of conventional fitness applications — retention.", font: "Arial", size: 22, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "The integration of MobileNetV2-powered food detection as an assistive logging layer meaningfully reduces user friction, improving the completeness and consistency of nutrition tracking data. Combined with the gamified progression engine, FORGE creates a reinforcing feedback cycle: better data informs better decisions, and better decisions produce progression milestones that motivate continued engagement.", font: "Arial", size: 22, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "FORGE is technically mature enough for pre-production evolution and offers a strong foundation for scalable deployment, intelligent coaching capabilities, and community-driven engagement — positioning it well for the next phase of product development.", font: "Arial", size: 22, color: COLORS.darkGray })], alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 0 } }),
                        ]
                    })]
                })]
            }
            ),
            spacer(120),

            divider(),

            // ── KEYWORDS
            new Paragraph({
                children: [
                    new TextRun({ text: "Keywords:  ", font: "Arial", size: 20, bold: true, color: COLORS.accent2 }),
                    new TextRun({ text: "Gamified Fitness  ·  Health Informatics  ·  Machine Learning  ·  MobileNetV2  ·  Transfer Learning  ·  Nutrition Intelligence  ·  Full-Stack Web Platform  ·  Behavior Reinforcement  ·  TensorFlow  ·  Next.js", font: "Arial", size: 20, color: COLORS.medGray })
                ],
                spacing: { before: 80, after: 80 }
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync("/mnt/user-data/outputs/FORGE_Fitness_Platform_Synopsis.docx", buf);
    console.log("Done.");
});