import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[72rem] px-4 pt-10 md:px-8">
        <article className="prose-napf">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}
