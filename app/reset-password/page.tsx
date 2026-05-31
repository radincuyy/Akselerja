import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Atur password baru · Akselerja",
};

export default function ResetPasswordPage() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
        Atur password baru
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
        Pilih password baru dengan minimal 8 karakter. Hindari memakai password
        yang sama dengan akun lain.
      </p>

      <Suspense
        fallback={
          <div className="mt-8 h-32 animate-pulse rounded-lg border border-(--color-line) bg-(--color-tint)" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
