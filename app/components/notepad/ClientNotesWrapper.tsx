"use client";

import dynamic from 'next/dynamic';

// Dynamic import of NotesDrawer to avoid SSR issues
const NotesDrawer = dynamic(() => import('./NotesDrawer'), {
  ssr: false,
});

export default function ClientNotesWrapper() {
  return <NotesDrawer />;
}