export type PasswordCheck = {
  id: "length" | "number" | "symbol" | "capital";
  label: string;
  met: boolean;
};

function startsWithCapitalLetter(password: string): boolean {
  const first = password.charAt(0);
  return Boolean(first && first !== first.toLowerCase() && first === first.toUpperCase());
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: "length",
      label: "Minimal 8 karakter",
      met: password.length >= 8,
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
    {
      id: "capital",
      label: "Huruf pertama kapital",
      met: startsWithCapitalLetter(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordChecks(password).every((check) => check.met);
}

export const PASSWORD_RULE_ERROR =
  "Password harus minimal 8 karakter, punya 1 angka, punya 1 simbol, dan diawali huruf kapital.";
