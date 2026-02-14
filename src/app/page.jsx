import dynamic from 'next/dynamic';

const DynamicQuillEditor = dynamic(() => import("../components/editor/index.jsx"), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">DocPub</h1> {/* Added DocPub title */}
      <div className="w-full max-w-[794px] rounded-lg border flex flex-col flex-grow">
        <DynamicQuillEditor />
      </div>
    </main>
  );
}