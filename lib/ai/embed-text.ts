import { skillById } from "../learning/skills";
import type { Job, Candidate } from "../shared/types";

const BOILERPLATE_RE =
  /\b(BPJS\s*(kesehatan|ketenagakerjaan|ketenagakerja)?|THR|tunjangan hari raya|cuti tahunan|cuti bersama|gaji pokok|tunjangan(?: makan| transportasi| jabatan)?|kompensasi|benefit|bonus(?: kpi| tahunan| serah terima)?|fresh graduate|kemampuan komunikasi(?: yang baik)?|mampu bekerja(?: di bawah tekanan| dalam tim| individu maupun dalam tim)?|fast learner|easy going|target oriented|hard working|disiplin(?: tinggi)?|jujur(?: dan bertanggung jawab)?|teliti(?: dan rapi)?|pekerja keras|kualifikasi(?: dan persyaratan)?|persyaratan(?: umum)?|nilai tambah|nice to have|kondisi kerja|jam kerja|hari kerja|domisili|D3 segala jurusan|S1 segala jurusan|minimal D3|minimal S1|minimal SMA|minimal SMK|terbuka untuk(?: fresh graduate)?|silahkan melamar|tertarik(?: untuk melamar)?|melamar segera|gaji tidak ditampilkan|gaji kompetitif|UMR|UMUT|UMK|loyal|memiliki laptop|memiliki kendaraan|memiliki sim|sim a|sim b|sim c)\b/gi;

export type CategoryHint =
  | "SOFTWARE_DEVELOPMENT_IT_TECHNOLOGY"
  | "LOGISTICS_DRIVER_TRANSPORTATION"
  | "MARKETING_SALES_COMMUNITY"
  | "FINANCE_ACCOUNTING"
  | "HEALTHCARE_MEDICAL"
  | "EDUCATION_TRAINING"
  | "HUMAN_RESOURCES"
  | "ADMINISTRATION_OFFICE"
  | "CUSTOMER_SERVICE_SUPPORT"
  | "HOSPITALITY_FOOD_BEVERAGE"
  | "MANUFACTURING_OPERATIONS"
  | "DESIGN_CREATIVE"
  | "GENERAL";

export function stripBoilerplate(text: string): string {
  return text.replace(BOILERPLATE_RE, "").replace(/\s+/g, " ").trim();
}

export function categoryHintFromText(haystack: string): CategoryHint {
  const h = haystack.toLowerCase();
  if (
    /\b(software|computer|developer|engineering|programmer|coding|backend|frontend|fullstack|devops|data\s+(analyst|engineer|science)|machine\s+learning|ai|cyber)\b|\bit\b/.test(
      h,
    )
  )
    return "SOFTWARE_DEVELOPMENT_IT_TECHNOLOGY";
  if (
    /\b(driver|sopir|kurir|logistic|transport|warehouse|gudang|forklift|delivery|ekspedisi)\b/.test(
      h,
    )
  )
    return "LOGISTICS_DRIVER_TRANSPORTATION";
  if (
    /\b(marketing|sales|fundraising|community|brand|merchandise|promotion|advertising|public\s+relation|pr\b|business\s+development)\b/.test(
      h,
    )
  )
    return "MARKETING_SALES_COMMUNITY";
  if (
    /\b(finance|accounting|akuntansi|pajak|tax|audit|treasury|controller|bookkeep)\b/.test(
      h,
    )
  )
    return "FINANCE_ACCOUNTING";
  if (
    /\b(healthcare|medical|hospital|klinik|perawat|dokter|nurse|farmasi|apoteker|kesehatan)\b/.test(
      h,
    )
  )
    return "HEALTHCARE_MEDICAL";
  if (
    /\b(teacher|trainer|tutor|education|pendidikan|guru|dosen|pelatih|instructor)\b/.test(
      h,
    )
  )
    return "EDUCATION_TRAINING";
  if (
    /\b(hr|human\s+resource|recruit|talent|people\s+operations|sumber\s+daya\s+manusia)\b/.test(
      h,
    )
  )
    return "HUMAN_RESOURCES";
  if (
    /\b(admin|secretary|administration|administrasi|sekretaris|personal\s+assistant|office\s+support)\b/.test(
      h,
    )
  )
    return "ADMINISTRATION_OFFICE";
  if (
    /\b(customer\s+service|cs\b|operator|call\s+center|telesales|frontliner|teller)\b/.test(
      h,
    )
  )
    return "CUSTOMER_SERVICE_SUPPORT";
  if (
    /\b(restaurant|hotel|f&b|food|chef|kitchen|barista|waiter|hospitality|kuliner)\b/.test(
      h,
    )
  )
    return "HOSPITALITY_FOOD_BEVERAGE";
  if (
    /\b(manufacturing|production|operation|operator\s+pabrik|qc|quality\s+control|maintenance|teknisi|machinist)\b/.test(
      h,
    )
  )
    return "MANUFACTURING_OPERATIONS";
  if (
    /\b(designer|design|graphic|ui\/ux|illustrator|video\s+editor|photographer|content\s+creator|creative)\b/.test(
      h,
    )
  )
    return "DESIGN_CREATIVE";
  return "GENERAL";
}

export function categoryHintFromJob(job: Job): CategoryHint {
  const haystack = [job.industryId, job.industry, job.title]
    .filter(Boolean)
    .join(" ");
  return categoryHintFromText(haystack);
}

export function categoryHintFromCandidate(p: Candidate): CategoryHint {
  const skillIds = (p.skills ?? []).map((s) => s.skillId).filter(Boolean);
  const skillNames = (p.skills ?? [])
    .map((s) => s.name ?? skillById[s.skillId]?.name ?? s.skillId)
    .filter(Boolean);
  const haystack = [
    p.bio ?? "",
    skillNames.join(" "),
    skillIds.join(" "),
    (p.experience ?? []).map((e) => `${e.position} ${e.company}`).join(" "),
    (p.education ?? []).map((e) => e.degree).join(" "),
    (p.projects ?? []).map((pr) => pr.title).join(" "),
  ].join(" ");
  return categoryHintFromText(haystack);
}

export function buildJobEmbedText(job: Job): string {
  const skillIds = (job.requirements ?? []).map((r) => r.skillId).filter(Boolean);
  const skillNames = (job.requirements ?? [])
    .map((r) => skillById[r.skillId]?.name ?? r.skillId)
    .filter(Boolean);
  const skillBlock =
    skillNames.length > 0
      ? `${skillNames.join(", ")}. ${skillIds.join(" ")}`
      : "";
  const desc = stripBoilerplate(job.description ?? "").slice(0, 600);
  const enHint = categoryHintFromJob(job);
  const categoryLine = `CATEGORY: ${enHint}. ${enHint}. ${enHint}. KATEGORI: ${job.industryId ?? job.industry ?? "umum"}`;
  const positionLine = `POSISI: ${job.title}. ${job.title}. ${job.title}`;
  const skillsBlock = skillBlock
    ? `SKILLS: ${skillBlock}. ${skillBlock}. ${skillBlock}. ${skillBlock}. ${skillBlock}`
    : "";
  const parts = [
    categoryLine,
    positionLine,
    job.industry ? `BIDANG: ${job.industry}. ${job.industry}` : "",
    skillsBlock,
    desc,
  ].filter(Boolean);
  return parts.join("\n");
}

export function buildProfileEmbedText(p: Candidate): string {
  const skillIds = (p.skills ?? []).map((s) => s.skillId).filter(Boolean);
  const skillNames = (p.skills ?? [])
    .map((s) => s.name ?? skillById[s.skillId]?.name ?? s.skillId)
    .filter(Boolean);
  const skillBlock =
    skillNames.length > 0
      ? `${skillNames.join(", ")}. ${skillIds.join(" ")}`
      : "";
  const skillsRepeated = skillBlock
    ? `SKILLS: ${skillBlock}. ${skillBlock}. ${skillBlock}. ${skillBlock}. ${skillBlock}`
    : "";

  const enHint = categoryHintFromCandidate(p);

  const exp = (p.experience ?? [])
    .map((e) => {
      const duties = e.duties?.replace(/\s+/g, " ").trim();
      return `${e.position} di ${e.company}${duties ? `. ${duties}` : ""}`;
    })
    .join("\n");

  const projects = (p.projects ?? [])
    .map((pr) => {
      const duties = pr.duties?.replace(/\s+/g, " ").trim();
      return `${pr.title}${duties ? `. ${duties}` : ""}`;
    })
    .join("\n");

  const edu = (p.education ?? [])
    .map((e) => `${e.degree} di ${e.institution}`)
    .join("\n");

  const parts = [
    `CATEGORY: ${enHint}. ${enHint}. ${enHint}`,
    skillsRepeated,
    p.bio?.trim() ? `BIO: ${p.bio.trim()}` : "",
    exp ? `PENGALAMAN:\n${exp}` : "",
    projects ? `PROYEK:\n${projects}` : "",
    edu ? `PENDIDIKAN: ${edu}` : "",
  ].filter(Boolean);
  return parts.join("\n").slice(0, 2000);
}
