import { notFound } from "next/navigation";
import { Hero } from "@/components/home/hero/Hero";

export default async function Home({ params: { segments } }: { params: { segments?: string[] } }) {
  if (segments && segments.length > 0) {
    notFound();
  }

  return <Hero />;
}
