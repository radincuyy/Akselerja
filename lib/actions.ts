"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addNote,
  autoTriggerReview,
  createApplication,
  markCandidateSeen,
  setRating,
  setStatus,
} from "./applications-store";
import type { ApplicationStatus, RejectReasonId } from "./types";

const ME_ID = "me";

function revalidateLamaranSurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/lamaran");
  revalidatePath("/app/lowongan");
  revalidatePath("/app/lowongan/[id]", "page");
  revalidatePath("/hr");
  revalidatePath("/hr/lowongan");
  revalidatePath("/hr/lowongan/[id]", "page");
  revalidatePath("/hr/kandidat/[id]", "page");
}

export async function applyToJob(jobId: string) {
  if (!jobId) return;
  const app = createApplication(ME_ID, jobId);
  revalidateLamaranSurfaces();
  redirect(`/app/lamaran/${app.id}`);
}

export async function autoReviewIfSubmitted(candidateId: string, jobId: string) {
  if (!candidateId || !jobId) return;
  autoTriggerReview(candidateId, jobId);
  revalidateLamaranSurfaces();
}

export async function changeApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  rejectReason?: RejectReasonId,
) {
  if (!applicationId) return;
  setStatus(applicationId, status, "hr", rejectReason ? { rejectReason } : undefined);
  revalidateLamaranSurfaces();
}

export async function reopenApplication(applicationId: string) {
  if (!applicationId) return;
  setStatus(applicationId, "reviewing", "hr");
  revalidateLamaranSurfaces();
}

export async function rateApplication(applicationId: string, rating: number) {
  if (!applicationId) return;
  const safe = Math.max(0, Math.min(5, Math.round(rating))) as 0 | 1 | 2 | 3 | 4 | 5;
  setRating(applicationId, safe);
  revalidatePath("/hr/kandidat/[id]", "page");
}

export async function postHrNote(applicationId: string, formData: FormData) {
  if (!applicationId) return;
  const text = String(formData.get("note") ?? "");
  addNote(applicationId, text, "Kamu");
  revalidatePath("/hr/kandidat/[id]", "page");
}

export async function markApplicationSeen(applicationId: string) {
  if (!applicationId) return;
  markCandidateSeen(applicationId);
  revalidatePath("/app/lamaran");
  revalidatePath("/app");
}
