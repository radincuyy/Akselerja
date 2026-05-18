import type { Skill } from "./types";

const skills: Skill[] = [
  { id: "excel", name: "Microsoft Excel" },
  { id: "komunikasi", name: "Komunikasi" },
  { id: "inventory", name: "Inventory Management" },
  { id: "wms", name: "Warehouse Management System" },
  { id: "data-literacy", name: "Data Literacy" },
  { id: "sql", name: "SQL" },
  { id: "powerbi", name: "Power BI" },
  { id: "customer-service", name: "Customer Service" },
  { id: "sales", name: "Sales" },
  { id: "manufacturing-basics", name: "Manufacturing Basics" },
  { id: "problem-solving", name: "Problem Solving" },
  { id: "ketelitian", name: "Ketelitian" },
  { id: "email-management", name: "Email & Calendar Management" },
  { id: "bookkeeping", name: "Bookkeeping Dasar" },
  { id: "visual-hierarchy", name: "Visual Hierarchy" },
  { id: "laporan-stok", name: "Laporan Stok" },
  { id: "sap-inventory", name: "SAP Inventory" },

  { id: "ms-office", name: "Microsoft Office" },
  { id: "google-workspace", name: "Google Workspace" },
  { id: "teamwork", name: "Kerja Sama Tim" },
  { id: "leadership", name: "Kepemimpinan" },
  { id: "time-management", name: "Manajemen Waktu" },
  { id: "english", name: "Bahasa Inggris" },
  { id: "public-speaking", name: "Public Speaking" },

  { id: "negotiation", name: "Negosiasi" },
  { id: "marketing", name: "Marketing" },
  { id: "digital-marketing", name: "Digital Marketing" },
  { id: "content-marketing", name: "Content Marketing" },
  { id: "social-media", name: "Social Media" },
  { id: "content-writing", name: "Content Writing" },
  { id: "copywriting", name: "Copywriting" },
  { id: "seo", name: "SEO" },
  { id: "google-ads", name: "Google Ads" },
  { id: "graphic-design", name: "Graphic Design" },
  { id: "canva", name: "Canva" },
  { id: "adobe-photoshop", name: "Adobe Photoshop" },
  { id: "video-editing", name: "Video Editing" },

  { id: "customer-relationship", name: "Customer Relationship Management" },
  { id: "telemarketing", name: "Telemarketing" },
  { id: "cashier", name: "Kasir" },

  { id: "accounting", name: "Akuntansi" },
  { id: "tax", name: "Perpajakan" },
  { id: "financial-analysis", name: "Analisis Keuangan" },
  { id: "administration", name: "Administrasi" },
  { id: "data-entry", name: "Data Entry" },
  { id: "office-administration", name: "Office Administration" },

  { id: "data-analysis", name: "Analisis Data" },

  { id: "logistics", name: "Logistik" },
  { id: "stock-opname", name: "Stock Opname" },
  { id: "maintenance", name: "Maintenance Engineering" },

  { id: "teaching", name: "Mengajar" },
  { id: "lesson-planning", name: "Lesson Planning" },
  { id: "classroom-management", name: "Classroom Management" },

  { id: "recruitment", name: "Rekrutmen" },
  { id: "hr-development", name: "Human Resource Development" },

  { id: "cooking", name: "Memasak" },
  { id: "baking", name: "Baking" },
  { id: "food-decoration", name: "Food Decoration" },

  { id: "autocad", name: "AutoCAD" },
  { id: "sketchup", name: "SketchUp" },
];

export const skillById: Record<string, Skill> = Object.fromEntries(
  skills.map((s) => [s.id, s]),
);
