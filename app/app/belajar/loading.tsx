import GenerationLoadingState from "@/components/GenerationLoadingState";

export default function BelajarLoading() {
  return (
    <GenerationLoadingState
      variant="roadmap"
      title="Sedang menyiapkan roadmap belajar"
      description="Latihan praktik sedang dibuat dari skill gap dan target kerjamu. Biasanya butuh 5 sampai 15 detik."
    />
  );
}
