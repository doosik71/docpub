import dynamic from 'next/dynamic';

const DynamicQuillEditor = dynamic(() => import("../components/editor/index.jsx"), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-4xl rounded-lg border" style={{ minHeight: '300px' }}>
        <DynamicQuillEditor />
      </div>
    </main>
  );
}
