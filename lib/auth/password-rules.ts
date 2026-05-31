export type PasswordCheck = {
  id: "length" | "number" | "symbol" | "letter";
  label: string;
  met: boolean;
};

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: "length",
      label: "Minimal 8 karakter",
      met: password.length >= 8,
    },
    {
      id: "letter",
      label: "Mengandung huruf",
      met: /[A-Za-z]/.test(password),
    },
    {
      id: "number",
      label: "Minimal 1 angka",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "Minimal 1 simbol (!, ?, &, ...)",
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordChecks(password).every((check) => check.met);
}

export const PASSWORD_RULE_ERROR =
  "Password harus minimal 8 karakter dan punya huruf, angka, dan simbol.";
