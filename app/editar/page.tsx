import Image from "next/image";
import EditAddress from "@/components/EditAddress";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { codigo?: string };
}

export default async function EditarPage({ searchParams }: Props) {
  const { codigo } = searchParams;

  return (
    <main className="min-h-screen bg-cream px-6 py-14">
      <div className="max-w-xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-2 mb-12 opacity-80 hover:opacity-100 transition-opacity"
        >
          <Image src="/iconVerde.png" alt="Verde" width={32} height={32} />
          <span className="text-[0.68rem] tracking-[0.16em] uppercase text-gray">
            Verde · Madrid
          </span>
        </a>

        <EditAddress codigo={codigo ?? ""} />
      </div>
    </main>
  );
}
