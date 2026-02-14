'use client';

import dynamic from 'next/dynamic';

// TiptapEditor를 클라이언트 사이드에서만 렌더링하도록 dynamic import를 사용합니다.
const TiptapEditor = dynamic(() => import('@/components/editor'), { ssr: false });

// 이 컴포넌트는 TiptapEditor를 렌더링하는 역할을 합니다.
export default function EditorLoader() {
  return <TiptapEditor />;
}
