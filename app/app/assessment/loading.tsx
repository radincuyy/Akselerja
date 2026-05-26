import GenerationLoadingState from "@/components/GenerationLoadingState";

export default function AssessmentLoading() {
  return (
    <GenerationLoadingState
      title="Sedang menyiapkan assessment"
      description="Soal sedang dibuat berdasarkan skill di profil dan referensi SKKNI."
    />
  );
}
