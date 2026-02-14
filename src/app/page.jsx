import dynamic from "next/dynamic";

const DynamicQuillEditor = dynamic(
  () => import("../components/editor/index.jsx"),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center py-4 px-4">
      <h1 className="text-4xl font-bold mb-4">DocPub</h1>{" "}
      {/* Reduced bottom margin */}
      <div
        id="editor-wrapper-page"
        className="w-full max-w-[794px] rounded-lg border border-gray-300 flex flex-col h-[calc(100vh-6rem)]" // Re-added fixed height
      >
        {" "}
        {/* Removed fixed height constraint */}
        <DynamicQuillEditor />
      </div>
    </main>
  );
}
