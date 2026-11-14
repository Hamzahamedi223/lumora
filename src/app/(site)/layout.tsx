import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { WhatsappButton } from "@/components/layout/whatsapp-button";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <WhatsappButton />
    </div>
  );
}
