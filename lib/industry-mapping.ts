export const BREADCRUMB_TO_INDUSTRY_ID: Record<string, string> = {
  // Layanan Profesional
  "Services Industry": "Layanan Profesional",
  "Consulting": "Layanan Profesional",

  // Marketing
  "Marketing": "Marketing",
  "Advertising & Public Relations": "Marketing",

  // Sales & Bisnis
  "Business Development & Sales": "Sales & Bisnis",
  "Sales Management": "Sales & Bisnis",
  "Service Sales": "Sales & Bisnis",
  "Car Sales": "Sales & Bisnis",

  // Akuntansi & Keuangan
  "Accounting": "Akuntansi & Keuangan",
  "Banking": "Akuntansi & Keuangan",
  "Middle Office & Back Office": "Akuntansi & Keuangan",

  // Ritel
  "Retail": "Ritel",

  // Logistik & Pergudangan
  "Supply Chain, Logistics & Transportation": "Logistik & Pergudangan",
  "Storage": "Logistik & Pergudangan",

  // Administrasi & HR
  "Administrative & HR": "Administrasi & HR",
  "Human Resources": "Administrasi & HR",

  // Pendidikan
  "Education & Training": "Pendidikan",
  "Translation": "Pendidikan",

  // Media & Kreatif
  "Film & Television Media": "Media & Kreatif",
  "Arts, Media, & Communications": "Media & Kreatif",
  "Visual & Interactive Design": "Media & Kreatif",
  "Non-Visual Design": "Media & Kreatif",
  "Wedding & Flower Art": "Media & Kreatif",

  // Customer Service
  "Customer Service": "Customer Service",

  // Operasional
  "Operations": "Operasional",
  "Project Management": "Operasional",
  "Leadership & Senior Management": "Operasional",
  "Quality & Safety": "Operasional",

  // Teknisi & Produksi
  "Technician & General Worker": "Teknisi & Produksi",
  "Manufacturing & Production": "Teknisi & Produksi",
  "Mechanical Design & Manufacturing": "Teknisi & Produksi",
  "Chemical Industry": "Teknisi & Produksi",

  // Properti & Konstruksi
  "Building & Real Estate": "Properti & Konstruksi",
  "Real Estate Planning Development": "Properti & Konstruksi",

  // Kesehatan
  "Healthcare": "Kesehatan",
  "Nursing & Medical Support": "Kesehatan",
  "Nutrition & Rehabilitation": "Kesehatan",

  // Teknologi Informasi
  "Computer & Software": "Teknologi Informasi",
  "Backend Development": "Teknologi Informasi",
  "Product Management": "Teknologi Informasi",

  // Hotel & Pariwisata
  "Hotel & Travel": "Hotel & Pariwisata",
  "Travel Services": "Hotel & Pariwisata",
};

export function breadcrumbToIndustryId(
  breadcrumb: string | undefined,
): string | null {
  if (!breadcrumb) return null;
  return BREADCRUMB_TO_INDUSTRY_ID[breadcrumb] ?? null;
}

export function deriveIndustryId(
  breadcrumb: string[] | undefined,
): string | null {
  if (!Array.isArray(breadcrumb) || breadcrumb.length === 0) return null;
  return breadcrumbToIndustryId(breadcrumb[0]);
}
