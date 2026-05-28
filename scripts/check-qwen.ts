// Quick smoke test: cek koneksi Qwen API
// Usage: npx tsx scripts/check-qwen.ts

import { config } from "dotenv";
config({ path: ".env.local" });
config();
import {
  generateQwenChat,
  generateQwenJson,
  isQwenConfigured,
} from "../lib/qwen-client";

async function main() {
  console.log("--- Qwen API smoke test ---");
  console.log("isQwenConfigured:", isQwenConfigured());
  console.log("QWEN_API_KEY present:", Boolean(process.env.QWEN_API_KEY));
  console.log(
    "QWEN_BASE_URL:",
    process.env.QWEN_BASE_URL ||
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1 (default)",
  );
  console.log(
    "QWEN_CHAT_MODEL:",
    process.env.QWEN_CHAT_MODEL || "qwen-plus (default)",
  );

  if (!isQwenConfigured()) {
    console.error(
      "\nQWEN_API_KEY tidak ditemukan di .env.local. Tambahkan dulu lalu coba lagi.",
    );
    process.exit(1);
  }

  console.log("\n[1/2] Test chat sederhana...");
  const t1 = Date.now();
  try {
    const reply = await generateQwenChat({
      systemInstruction:
        "Kamu pelatih karier yang ramah dan ringkas. Jawab maksimal 2 kalimat dalam Bahasa Indonesia.",
      userMessage: "Halo, sebutkan 1 tip mencari kerja untuk fresh graduate.",
      maxTokens: 120,
    });
    console.log(`  Sukses (${Date.now() - t1}ms):`);
    console.log(`  > ${reply}`);
  } catch (err) {
    console.error(`  Gagal (${Date.now() - t1}ms):`, err);
    process.exit(2);
  }

  console.log("\n[2/2] Test JSON mode...");
  const t2 = Date.now();
  try {
    const json = await generateQwenJson<{ ok: boolean; pesan: string }>({
      systemInstruction:
        "Kembalikan JSON valid dengan field: ok (boolean), pesan (string Indonesia singkat).",
      prompt:
        'Konfirmasi koneksi berhasil. Format: {"ok": true, "pesan": "..."}',
      maxTokens: 100,
    });
    console.log(`  Sukses (${Date.now() - t2}ms):`);
    console.log("  >", json);
  } catch (err) {
    console.error(`  Gagal (${Date.now() - t2}ms):`, err);
    process.exit(3);
  }

  console.log("\nQwen API terhubung dan siap dipakai sebagai fallback.");
}

main().catch((err) => {
  console.error("Smoke test gagal:", err);
  process.exit(1);
});
