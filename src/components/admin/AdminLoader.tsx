"use client";

import dynamic from "next/dynamic";

// The curator tool talks to Firebase from the browser only; nothing to pre-render.
const AdminApp = dynamic(() => import("./AdminApp"), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading curator tool…</p>,
});

export function AdminLoader() {
  return <AdminApp />;
}
