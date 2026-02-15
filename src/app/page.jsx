'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to /index when accessing the root URL
    router.replace('/index');
  }, [router]);
  return null; // Or a loading spinner/message
}