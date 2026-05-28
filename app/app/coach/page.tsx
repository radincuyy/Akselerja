import PageHeader from "@/components/PageHeader";
import CoachChat from "@/components/CoachChat";

export const metadata = {
  title: "Coach · Akselerja",
};

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Coach"
        title="Pendamping karier kamu"
        description="Tanyakan apa pun soal skor, skill gap, atau langkah karier. Coach akan menjawab berdasarkan profil dan latihan kamu."
      />
      <div className="mt-8">
        <CoachChat />
      </div>
    </div>
  );
}
