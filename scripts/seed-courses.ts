import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";
import { classifySkillTrack } from "../lib/skill-track";
import type { Course } from "../lib/types";

config({ path: resolve(process.cwd(), ".env.local") });

type CourseSeed = Omit<Course, "id"> & { id?: string };

const TOOL_SKILLS: { skillId: string; name: string }[] = [
  { skillId: "ms-office", name: "Microsoft Office" },
  { skillId: "excel", name: "Microsoft Excel" },
  { skillId: "google-workspace", name: "Google Workspace" },
  { skillId: "graphic-design", name: "Graphic Design" },
  { skillId: "social-media", name: "Social Media" },
  { skillId: "content-marketing", name: "Content Marketing" },
  { skillId: "digital-marketing", name: "Digital Marketing" },
  { skillId: "accounting", name: "Akuntansi" },
  { skillId: "tax", name: "Perpajakan" },
  { skillId: "data-entry", name: "Data Entry" },
  { skillId: "financial-analysis", name: "Analisis Keuangan" },
  { skillId: "google-ads", name: "Google Ads" },
  { skillId: "adobe-photoshop", name: "Adobe Photoshop" },
  { skillId: "wms", name: "Warehouse Management System" },
  { skillId: "autocad", name: "AutoCAD" },
  { skillId: "video-editing", name: "Video Editing" },
  { skillId: "bookkeeping", name: "Bookkeeping" },
  { skillId: "data-analysis", name: "Analisis Data" },
  { skillId: "stock-opname", name: "Stock Opname" },
  { skillId: "logistics-distribution", name: "Logistics Distribution" },
  { skillId: "sql", name: "SQL" },
  { skillId: "powerbi", name: "Power BI" },
  { skillId: "canva", name: "Canva" },
  { skillId: "sap-inventory", name: "SAP Inventory" },
  { skillId: "sketchup", name: "SketchUp" },
  { skillId: "data-literacy", name: "Data Literacy" },
  { skillId: "office-administration", name: "Office Administration" },
  { skillId: "inventory", name: "Inventory Management" },
  { skillId: "cooking", name: "Memasak" },
  { skillId: "baking", name: "Baking" },
];

function buildSeeds(): CourseSeed[] {
  const seeds: CourseSeed[] = [];
  for (const s of TOOL_SKILLS) {
    const track = classifySkillTrack(s.skillId, s.name);
    if (track !== "tool") continue;
    const q = encodeURIComponent(s.name);
    seeds.push({
      id: `c-${s.skillId}-skillacademy`,
      skillId: s.skillId,
      title: `${s.name} (Skill Academy)`,
      provider: "Skill Academy by Ruangguru",
      durationHours: 8,
      free: false,
      description: `Kelas berstruktur ${s.name} dari Skill Academy Ruangguru. Cocok untuk pemula yang ingin pondasi yang kuat sebelum kerja.`,
      url: `https://www.skillacademy.com/search?query=${q}`,
    });
    seeds.push({
      id: `c-${s.skillId}-coursera`,
      skillId: s.skillId,
      title: `${s.name} (Coursera)`,
      provider: "Coursera",
      durationHours: 12,
      free: true,
      description: `Kursus ${s.name} dari penyedia internasional di Coursera. Banyak pilihan gratis dengan opsi sertifikat berbayar.`,
      url: `https://www.coursera.org/search?query=${q}`,
    });
    seeds.push({
      id: `c-${s.skillId}-youtube`,
      skillId: s.skillId,
      title: `Tutorial ${s.name} (YouTube)`,
      provider: "YouTube",
      durationHours: 4,
      free: true,
      description: `Tutorial ${s.name} dari berbagai kreator di YouTube. Cara cepat untuk eksplorasi visual dan demo praktis.`,
      url: `https://www.youtube.com/results?search_query=${q}+tutorial+indonesia`,
    });
  }
  return seeds;
}

async function main() {
  const cosmos = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!,
  });
  const container = cosmos
    .database(process.env.COSMOS_DATABASE!)
    .container("courses");

  const seeds = buildSeeds();
  console.log(`[seed-courses] preparing ${seeds.length} course seeds`);

  let upserted = 0;
  for (const seed of seeds) {
    try {
      await container.items.upsert(seed);
      upserted++;
    } catch (err) {
      console.warn(`  upsert failed for ${seed.id}:`, String(err).slice(0, 200));
    }
  }
  console.log(`[seed-courses] upserted ${upserted}/${seeds.length}`);
}

main().catch((err) => {
  console.error("[seed-courses] failed:", err);
  process.exit(1);
});
