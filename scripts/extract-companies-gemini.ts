import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const RAW_IN = resolve(process.cwd(), "data/karirhub-jobs.json");
const OUT = resolve(process.cwd(), "data/company-names.json");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const RPM_DELAY_MS = 5000;
const BATCH_SIZE = 10;

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type RawJob = { uuid: string; companyAbout: string | null };
type CompanyMap = Record<string, string | null>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadCache(): Promise<CompanyMap> {
  if (!(await fileExists(OUT))) return {};
  try {
    return JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    return {};
  }
}

async function extractBatch(
  items: { uuid: string; about: string }[],
): Promise<CompanyMap> {
  const numbered = items
    .map((it, i) => `[${i + 1}] ${it.about.slice(0, 600)}`)
    .join("\n\n");

  const prompt = `Tugas: ekstrak nama perusahaan dari setiap teks "Tentang Perusahaan" di bawah.

Aturan:
- Kembalikan HANYA nama perusahaan apa adanya. Contoh: "PT Erlangga", "Erlangga Group", "Tunas Mitra", "FUNWORLD".
- Jangan kembalikan deskripsi, kalimat verb, atau frasa seperti "perusahaan yang bergerak di...".
- Jika nama jelas pakai prefix legal (PT/CV/UD/Yayasan), pertahankan.
- Jika tidak ada nama yang jelas, kembalikan string kosong.
- Pertahankan kapitalisasi asli.

Output JSON sesuai schema. Index harus persis 1..${items.length} sesuai urutan input.

Input:
${numbered}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          names: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: { type: "integer" },
                name: { type: "string" },
              },
              required: ["index", "name"],
            },
          },
        },
        required: ["names"],
      },
    },
  });

  const out: CompanyMap = {};
  try {
    const parsed = JSON.parse(response.text ?? "{}") as {
      names?: { index: number; name: string }[];
    };
    for (const entry of parsed.names ?? []) {
      const item = items[entry.index - 1];
      if (!item) continue;
      const name = entry.name?.trim();
      out[item.uuid] = name && name.length >= 2 && name.length <= 80 ? name : null;
    }
  } catch (err) {
    console.warn("  parse failed for batch:", err);
  }
  for (const it of items) {
    if (!(it.uuid in out)) out[it.uuid] = null;
  }
  return out;
}

async function main() {
  const buf = await readFile(RAW_IN, "utf8");
  const rawJobs: RawJob[] = JSON.parse(buf);
  const cache = await loadCache();

  const todo = rawJobs.filter(
    (r) => r.companyAbout && r.companyAbout.trim().length > 0 && !(r.uuid in cache),
  );
  console.log(
    `[gemini] ${rawJobs.length} jobs total, ${Object.keys(cache).length} cached, ${todo.length} to process`,
  );

  if (todo.length === 0) {
    console.log("[gemini] nothing to do");
    return;
  }

  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE).map((r) => ({
      uuid: r.uuid,
      about: r.companyAbout!,
    }));

    let result: CompanyMap = {};
    let attempt = 0;
    while (attempt < 3) {
      try {
        result = await extractBatch(batch);
        break;
      } catch (err: unknown) {
        attempt++;
        const status = (err as { status?: number })?.status;
        const wait = status === 429 ? 30_000 : 5000 * attempt;
        console.warn(`  batch ${i / BATCH_SIZE + 1} attempt ${attempt} failed (status=${status}), wait ${wait}ms`);
        await sleep(wait);
      }
    }

    Object.assign(cache, result);
    done += batch.length;
    if (done % 50 === 0 || i + BATCH_SIZE >= todo.length) {
      console.log(`  ${done}/${todo.length} processed`);
      await writeFile(OUT, JSON.stringify(cache, null, 2), "utf8");
    }
    await sleep(RPM_DELAY_MS);
  }

  await writeFile(OUT, JSON.stringify(cache, null, 2), "utf8");
  const extracted = Object.values(cache).filter((v) => v).length;
  console.log(`[gemini] done. ${extracted}/${rawJobs.length} have a name -> ${OUT}`);
}

main().catch((err) => {
  console.error("\nextract failed:", err);
  process.exit(1);
});
