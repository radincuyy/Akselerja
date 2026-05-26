import GenerationLoadingState from "@/components/GenerationLoadingState";

export default function AssessmentDetailLoading() {
  return (
    <GenerationLoadingState
      title="Sedang membuat assessment"
      description="Pertanyaan sedang disusun dari kompetensi, KUK, dan konteks kerja yang relevan."
    />
  );
}
