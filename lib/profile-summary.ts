import { skillById } from "./skills";
import type { Candidate } from "./types";
import { embedText } from "./gemini-embed";
import { CONTAINERS, getContainer } from "./db";
import { revalidateTag } from "next/cache";
import { profileCacheTag } from "./profile-store";

function buildProfileText(profile: Candidate): string {
  const skills = (profile.skills ?? [])
    .map((s) => s.name ?? skillById[s.skillId]?.name ?? s.skillId)
    .filter(Boolean)
    .join(", ");

  const experience = (profile.experience ?? [])
    .map((e) => {
      const range =
        e.startMonth || e.endMonth
          ? `${e.startMonth || "?"} - ${e.endMonth || "sekarang"}`
          : "";
      const duties = e.duties?.replace(/\s+/g, " ").trim();
      return [
        `${e.position} di ${e.company}${range ? ` (${range})` : ""}`,
        duties ? `Tugas: ${duties}` : "",
      ]
        .filter(Boolean)
        .join(". ");
    })
    .join("\n");

  const organizations = (profile.organizations ?? [])
    .map((o) => {
      const range =
        o.startMonth || o.endMonth
          ? `${o.startMonth || "?"} - ${o.endMonth || "sekarang"}`
          : "";
      const duties = o.duties?.replace(/\s+/g, " ").trim();
      return [
        `${o.role} di ${o.organization}${range ? ` (${range})` : ""}`,
        duties ? `Kontribusi: ${duties}` : "",
      ]
        .filter(Boolean)
        .join(". ");
    })
    .join("\n");

  const projects = (profile.projects ?? [])
    .map((p) => {
      const range =
        p.startMonth || p.endMonth
          ? `${p.startMonth || "?"} - ${p.endMonth || "sekarang"}`
          : "";
      const ctx = p.context?.trim();
      const duties = p.duties?.replace(/\s+/g, " ").trim();
      return [
        `${p.title}${ctx ? ` (${ctx})` : ""}${range ? ` ${range}` : ""}`,
        duties ? `Ringkasan: ${duties}` : "",
      ]
        .filter(Boolean)
        .join(". ");
    })
    .join("\n");

  const education = (profile.education ?? [])
    .map((e) => {
      const range =
        e.startMonth || e.endMonth
          ? `${e.startMonth || "?"} - ${e.endMonth || "?"}`
          : "";
      return `${e.degree} di ${e.institution}${range ? ` (${range})` : ""}`;
    })
    .join("\n");

  const totals = profile.experienceYears
    ? `Total pengalaman: ${profile.experienceYears} tahun`
    : "";

  return [
    profile.bio?.trim() ? `Bio: ${profile.bio}` : "",
    totals,
    skills ? `Skills: ${skills}` : "",
    experience ? `Pengalaman kerja:\n${experience}` : "",
    organizations ? `Pengalaman organisasi:\n${organizations}` : "",
    projects ? `Proyek:\n${projects}` : "",
    education ? `Pendidikan:\n${education}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000);
}

export async function refreshProfileVector(userId: string): Promise<void> {
  const container = getContainer(CONTAINERS.candidates);
  try {
    const { resource } = await container.item(userId, userId).read();
    if (!resource) return;
    const profile = resource as Candidate;
    const text = buildProfileText(profile);
    if (!text) return;

    const vector = await embedText(text, "RETRIEVAL_QUERY");
    await container.item(userId, userId).patch([
      { op: "set", path: "/profileSummary", value: text },
      { op: "set", path: "/profileVector", value: vector },
      { op: "set", path: "/profileVectorUpdatedAt", value: new Date().toISOString() },
    ]);
    revalidateTag(profileCacheTag(userId));
  } catch (err) {
    console.error("[profile-summary] refresh failed for", userId, err);
  }
}
