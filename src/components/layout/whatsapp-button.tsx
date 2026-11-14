import { getSettings } from "@/lib/settings";
import { IconWhatsapp } from "@/components/icons";

export async function WhatsappButton() {
  const s = await getSettings();
  const n = s.store.whatsapp.replace(/\D/g, "");
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}?text=${encodeURIComponent("Bonjour Lumora, j'ai une question.")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed right-4 bottom-4 z-30 grid size-13 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/40 transition hover:scale-105 sm:right-6 sm:bottom-6"
      aria-label="Nous écrire sur WhatsApp"
    >
      <IconWhatsapp width={26} height={26} strokeWidth={1.8} />
    </a>
  );
}
