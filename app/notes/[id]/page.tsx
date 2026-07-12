import NotesClient from "../NotesClient";

// Generate static parameters for Next.js static HTML export at build time
export async function generateStaticParams() {
  return [
    { id: "straight-line-motion" },
    { id: "chapter-4" },
    { id: "notes-1" }
  ];
}

export default function SmartNotesPage({ params }: { params: { id: string } }) {
  return <NotesClient params={params} />;
}
