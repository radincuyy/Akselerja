export const INDUSTRY_GROUPS: Record<string, readonly string[]> = {
  "Akuntansi & Keuangan": ["Accounting", "Banking", "Finance"],
  "Sales & Bisnis": [
    "Business Development & Sales",
    "Sales Management",
    "Service Sales",
    "Advertisement Sales",
    "Import & Export Trade",
  ],
  "Marketing": ["Marketing", "Advertising & Public Relations"],
  "Administrasi & HR": ["Administrative & HR", "Human Resources"],
  "Logistik & Pergudangan": [
    "Supply Chain, Logistics & Transportation",
    "Storage",
    "Purchase (Procurement)",
  ],
  "Customer Service": ["Customer Service"],
  "Operasional & Manajemen": [
    "Operations",
    "Project Management",
    "Product Management",
    "Leadership & Senior Management",
    "Quality & Safety",
    "Consulting",
  ],
  "Teknologi Informasi": [
    "Computer & Software",
    "Backend Development",
    "Hardware Development",
    "Senior Technical Position",
    "Telecommunication",
  ],
  "Media & Kreatif": [
    "Arts, Media, & Communications",
    "Film & Television Media",
    "Visual & Interactive Design",
    "Non-Visual Design",
    "Translation",
  ],
  "Pendidikan": [
    "Education & Training",
    "Vocational Training",
    "Science & Research",
  ],
  "Kesehatan": [
    "Healthcare",
    "Medical Devices",
    "Nursing & Medical Support",
    "Nutrition & Rehabilitation",
  ],
  "Teknisi & Produksi": [
    "Manufacturing & Production",
    "Mechanical Design & Manufacturing",
    "Electronic & Semiconductor",
    "Chemical Industry",
    "Repair Technician",
    "Technician & General Worker",
    "Animal Husbandry & Fisheries",
  ],
  "Properti & Konstruksi": [
    "Building & Real Estate",
    "Real Estate Planning Development",
  ],
  "Hukum & Legal": ["Law & Legal Services", "Legal Affairs"],
  "Hotel & Pariwisata": [
    "Hotel & Travel",
    "Travel Services",
    "Wedding & Flower Art",
  ],
  "Layanan Profesional": ["Services Industry", "Others"],
};

export const INDUSTRY_OPTIONS = Object.keys(
  INDUSTRY_GROUPS,
) as readonly string[];

export function expandIndustryGroup(label: string): string[] {
  return [...(INDUSTRY_GROUPS[label] ?? [])];
}

export function expandIndustryGroups(labels: string[]): string[] {
  const out = new Set<string>();
  for (const label of labels) {
    for (const id of expandIndustryGroup(label)) out.add(id);
  }
  return [...out];
}
