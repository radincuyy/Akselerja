import { skillById } from "./skills";

export type LearningTrack = "behavioral" | "tool";

const TOOL_PATTERNS: RegExp[] = [
  /\b(microsoft\s+)?excel\b/i,
  /\b(microsoft\s+)?word\b/i,
  /\bpower(?:\s|-)?point\b/i,
  /\bms\s*office\b/i,
  /\boffice\b(?!.*admin)/i,
  /\bgoogle\s+(workspace|sheets|docs|slides|drive)\b/i,
  /\b(?:sql|mysql|postgresql|postgres|sqlite|oracle|mongodb|nosql|redis|database)\b/i,
  /\b(?:python|java|javascript|typescript|kotlin|swift|golang|go|ruby|php|c\+\+|c#|rust|scala|dart)\b/i,
  /\b(?:react|vue|angular|next\.?js|svelte|nuxt|express|nest\.?js|django|flask|laravel|rails|spring|fastapi)\b/i,
  /\b(?:html|css|tailwind|bootstrap|sass|less)\b/i,
  /\b(?:docker|kubernetes|k8s|terraform|ansible|jenkins|github\s+actions|gitlab\s+ci|circleci|aws|azure|gcp|firebase|supabase|vercel|netlify)\b/i,
  /\b(?:git|github|gitlab|bitbucket|svn)\b/i,
  /\b(?:linux|ubuntu|bash|shell|windows\s+server|server\s+admin)\b/i,
  /\b(?:postman|swagger|graphql|rest\s+api|api\s+development)\b/i,
  /\bpower\s*bi\b/i,
  /\btableau\b/i,
  /\bsap(?:\s+inventory|\s+hana|\s+abap)?\b/i,
  /\bsalesforce\b/i,
  /\boracle\s+erp\b/i,
  /\b(?:photoshop|illustrator|indesign|premiere|after\s+effects|lightroom|adobe)\b/i,
  /\b(?:figma|sketch|adobe\s+xd|invision|canva|miro)\b/i,
  /\b(?:autocad|sketchup|revit|3ds\s+max|blender|cinema\s+4d|solidworks|catia|fusion\s+360)\b/i,
  /\bvideo\s+editing\b/i,
  /\bgraphic\s+design\b/i,
  /\bvisual\s+hierarchy\b/i,
  /\b(?:wordpress|shopify|magento|wix|squarespace)\b/i,
  /\b(?:google\s+ads|facebook\s+ads|meta\s+ads|tiktok\s+ads|instagram\s+ads|seo\s+tool|ahrefs|semrush|moz)\b/i,
  /\b(?:hubspot|mailchimp|hootsuite|buffer|sprout\s+social)\b/i,
  /\b(?:warehouse\s+management|wms|inventory\s+management|stock\s+opname|laporan\s+stok)\b/i,
  /\b(?:bookkeeping|akuntansi|accounting|perpajakan|tax|financial\s+analysis|jurnal\s+umum|spreadsheet|pembukuan)\b/i,
  /\b(?:autocount|myob|accurate|jurnal\.id|xero|quickbooks)\b/i,
  /\b(?:data\s+entry|data\s+analysis|analisis\s+data)\b/i,
  /\b(?:masak|memasak|baking|pastry|kuliner|food\s+decoration|kitchen)\b/i,
  /\b(?:autocad|sketchup|revit|civil\s+3d|tekla)\b/i,
  /\b(?:r\s+studio|stata|spss|matlab|jupyter)\b/i,
  /\b(?:troubleshooting|server\s+optimization|network\s+admin|cisco|mikrotik)\b/i,
  /\bcontent\s+(editing|operations)\b/i,
  /\bimage\s+editing\b/i,
  /\bdata\s+visualization\b/i,
  /\b(?:vehicle\s+maintenance|engine\s+repair|otomotif|kendaraan)\b/i,
  /\b(?:driving|mengemudi|sopir|supir|kurir|delivery|pengemudi)\b/i,
  /\b(?:logistics\s+distribution|distribusi\s+barang|pengiriman)\b/i,
  /\b(?:welding|pengelasan|machining|bubut|cnc)\b/i,
  /\b(?:plumbing|electrical|kelistrikan|hvac|ac\s+technician)\b/i,
];

const BEHAVIORAL_PATTERNS: RegExp[] = [
  /\bkomunikasi\b/i,
  /\bcommunication\b/i,
  /\b(kerja\s+(sama\s+)?tim|teamwork|kolaborasi|collaboration)\b/i,
  /\b(kepemimpinan|leadership|managerial)\b/i,
  /\b(problem\s+solving|critical\s+thinking|analytical\s+thinking)\b/i,
  /\b(time\s+management|manajemen\s+waktu)\b/i,
  /\b(public\s+speaking|presentasi|presentation)\b/i,
  /\b(negosiasi|negotiation|persuasi)\b/i,
  /\b(customer\s+service|customer\s+relationship|cs\s+skill|service\s+excellence)\b/i,
  /\b(sales|selling|telemarketing|cold\s+calling)\b/i,
  /\b(ketelitian|attention\s+to\s+detail|detail\s+oriented)\b/i,
  /\b(adaptif|adaptability|fleksibel)\b/i,
  /\b(kreatif|creativity|kreativitas|inovatif)\b/i,
  /\b(disiplin|discipline|tanggung\s+jawab|responsibility)\b/i,
  /\b(empati|empathy|emotional\s+intelligence)\b/i,
  /\b(community\s+(engagement|building|operation))\b/i,
  /\b(event\s+(operations|management))\b/i,
  /\b(stakeholder\s+management|relationship\s+building)\b/i,
  /\b(bahasa\s+inggris|english\s+(speaking|fluent|conversation))\b/i,
  /\b(mengajar|teaching|tutoring|coaching|mentoring)\b/i,
  /\b(lesson\s+planning|classroom\s+management)\b/i,
  /\b(rekrutmen|recruitment|talent\s+acquisition|interviewing)\b/i,
  /\b(hr\s+development|people\s+development|training\s+facilitation)\b/i,
  /\b(content\s+writing|copywriting|content\s+strategy)\b/i,
  /\b(social\s+media|content\s+marketing|digital\s+marketing|brand\s+management)\b/i,
  /\b(marketing|sales\s+and\s+marketing)$/i,
  /\b(kasir|cashier|frontliner|teller)\b/i,
  /\b(administrasi|administration|filing|kearsipan)\b/i,
  /\b(logistik|logistics|distribusi|supply\s+chain)\b/i,
  /\b(maintenance|preventive\s+maintenance|repair)\b/i,
  /\b(manufacturing\s+basics|operasional\s+pabrik|qc|quality\s+control)\b/i,
];

type CuratedSkill = { id: string; name: string; track?: LearningTrack };

function classifyByPatterns(text: string): LearningTrack | null {
  for (const re of TOOL_PATTERNS) if (re.test(text)) return "tool";
  for (const re of BEHAVIORAL_PATTERNS) if (re.test(text)) return "behavioral";
  return null;
}

export function classifySkillTrack(
  skillId: string,
  skillName?: string,
): LearningTrack {
  const curated = skillById[skillId] as CuratedSkill | undefined;
  if (curated?.track) return curated.track;

  const haystack = `${skillId} ${skillName ?? curated?.name ?? ""}`
    .toLowerCase()
    .trim();
  if (!haystack) return "behavioral";
  return classifyByPatterns(haystack) ?? "behavioral";
}
