import type { Skill } from "./types";

export const skills: Skill[] = [
  // --- Original 17 (preserved verbatim for backwards compatibility) ---
  { id: "excel", name: "Microsoft Excel", level: 2 },
  { id: "komunikasi", name: "Komunikasi", level: 2 },
  { id: "inventory", name: "Inventory Management", level: 1 },
  { id: "wms", name: "Warehouse Management System", level: 1 },
  { id: "data-literacy", name: "Data Literacy", level: 1 },
  { id: "sql", name: "SQL", level: 1 },
  { id: "powerbi", name: "Power BI", level: 1 },
  { id: "customer-service", name: "Customer Service", level: 2 },
  { id: "sales", name: "Sales", level: 2 },
  { id: "manufacturing-basics", name: "Manufacturing Basics", level: 1 },
  { id: "problem-solving", name: "Problem Solving", level: 2 },
  { id: "ketelitian", name: "Ketelitian", level: 2 },
  { id: "email-management", name: "Email & Calendar Management", level: 1 },
  { id: "bookkeeping", name: "Bookkeeping Dasar", level: 1 },
  { id: "visual-hierarchy", name: "Visual Hierarchy", level: 1 },
  { id: "laporan-stok", name: "Laporan Stok", level: 1 },
  { id: "sap-inventory", name: "SAP Inventory", level: 1 },

  // --- Extensions to cover Karirhub job distribution ---
  // Foundational productivity & soft skills
  { id: "ms-office", name: "Microsoft Office", level: 2 },
  { id: "google-workspace", name: "Google Workspace", level: 1 },
  { id: "teamwork", name: "Kerja Sama Tim", level: 2 },
  { id: "leadership", name: "Kepemimpinan", level: 2 },
  { id: "time-management", name: "Manajemen Waktu", level: 2 },
  { id: "english", name: "Bahasa Inggris", level: 2 },
  { id: "public-speaking", name: "Public Speaking", level: 2 },

  // Sales, marketing, content, design
  { id: "negotiation", name: "Negosiasi", level: 2 },
  { id: "marketing", name: "Marketing", level: 2 },
  { id: "digital-marketing", name: "Digital Marketing", level: 2 },
  { id: "content-marketing", name: "Content Marketing", level: 2 },
  { id: "social-media", name: "Social Media", level: 2 },
  { id: "content-writing", name: "Content Writing", level: 2 },
  { id: "copywriting", name: "Copywriting", level: 2 },
  { id: "seo", name: "SEO", level: 2 },
  { id: "google-ads", name: "Google Ads", level: 2 },
  { id: "graphic-design", name: "Graphic Design", level: 2 },
  { id: "canva", name: "Canva", level: 1 },
  { id: "adobe-photoshop", name: "Adobe Photoshop", level: 2 },
  { id: "video-editing", name: "Video Editing", level: 2 },

  // Customer-facing
  { id: "customer-relationship", name: "Customer Relationship Management", level: 2 },
  { id: "telemarketing", name: "Telemarketing", level: 2 },
  { id: "cashier", name: "Kasir", level: 1 },

  // Finance, accounting, admin
  { id: "accounting", name: "Akuntansi", level: 2 },
  { id: "tax", name: "Perpajakan", level: 2 },
  { id: "financial-analysis", name: "Analisis Keuangan", level: 2 },
  { id: "administration", name: "Administrasi", level: 2 },
  { id: "data-entry", name: "Data Entry", level: 1 },
  { id: "office-administration", name: "Office Administration", level: 2 },

  // Data
  { id: "data-analysis", name: "Analisis Data", level: 2 },

  // Logistics, manufacturing
  { id: "logistics", name: "Logistik", level: 2 },
  { id: "stock-opname", name: "Stock Opname", level: 1 },
  { id: "maintenance", name: "Maintenance Engineering", level: 2 },

  // Education
  { id: "teaching", name: "Mengajar", level: 2 },
  { id: "lesson-planning", name: "Lesson Planning", level: 2 },
  { id: "classroom-management", name: "Classroom Management", level: 2 },

  // HR
  { id: "recruitment", name: "Rekrutmen", level: 2 },
  { id: "hr-development", name: "Human Resource Development", level: 2 },

  // Food & hospitality
  { id: "cooking", name: "Memasak", level: 2 },
  { id: "baking", name: "Baking", level: 2 },
  { id: "food-decoration", name: "Food Decoration", level: 2 },

  // Design tools
  { id: "autocad", name: "AutoCAD", level: 2 },
  { id: "sketchup", name: "SketchUp", level: 2 },
];

export const skillById: Record<string, Skill> = Object.fromEntries(
  skills.map((s) => [s.id, s]),
);

