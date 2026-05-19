export function deriveIndustryId(
  breadcrumb: string[] | undefined,
): string | null {
  if (!Array.isArray(breadcrumb) || breadcrumb.length === 0) return null;
  const top = breadcrumb[0];
  return typeof top === "string" && top.length > 0 ? top : null;
}
