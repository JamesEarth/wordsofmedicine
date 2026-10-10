import LibraryPage from "@/app/library/page";

export const metadata = {
  title: "Health & wellness journal",
  description: "Approachable guides to everyday health and wellbeing.",
};

export default function BlogPage() {
  return <LibraryPage searchParams={Promise.resolve({ category: "wellness" })} />;
}
