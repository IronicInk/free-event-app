"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getClientApp } from "@/lib/data/firebase-client";
import { EventQueue, type QueueTab } from "./EventQueue";
import { RunsPanel } from "./RunsPanel";
import { SourcesPanel } from "./SourcesPanel";

type Tab = QueueTab | "sources" | "runs";

const TABS: { id: Tab; label: string }[] = [
  { id: "review", label: "Review queue" },
  { id: "published", label: "Published" },
  { id: "hidden", label: "Hidden (paid)" },
  { id: "closed", label: "Rejected & cancelled" },
  { id: "sources", label: "Sources" },
  { id: "runs", label: "Pull runs" },
];

type AuthState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "not-curator"; user: User }
  | { kind: "curator"; user: User };

export default function AdminApp() {
  const app = getClientApp();
  const [auth, setAuth] = useState<AuthState>({ kind: "loading" });
  const [tab, setTab] = useState<Tab>("review");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!app) return;
    return onIdTokenChanged(getAuth(app), async (user) => {
      if (!user) return setAuth({ kind: "signed-out" });
      const token = await user.getIdTokenResult();
      setAuth(token.claims.curator === true ? { kind: "curator", user } : { kind: "not-curator", user });
    });
  }, [app]);

  if (!app) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Curator tool</h1>
        <p className="mt-2 text-muted">
          Firebase isn&apos;t connected yet, so there is nothing to curate. Add the
          NEXT_PUBLIC_FIREBASE_* settings (see docs/FIREBASE_SETUP.md) and redeploy.
        </p>
      </Shell>
    );
  }

  const signIn = async () => {
    setError(null);
    try {
      await signInWithPopup(getAuth(app), new GoogleAuthProvider());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (auth.kind === "loading") return <Shell>Checking sign-in…</Shell>;

  if (auth.kind === "signed-out") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Curator tool</h1>
        <p className="mt-2 text-muted">For Valley Vibe operators only. Visitors never need to sign in.</p>
        <button type="button" onClick={signIn} className="bg-brand mt-6 rounded-full px-5 py-3 font-semibold text-accent-fg">
          Sign in with Google
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Shell>
    );
  }

  if (auth.kind === "not-curator") {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">No curator access</h1>
        <p className="mt-2 text-muted">
          You&apos;re signed in as <strong>{auth.user.email}</strong>, but this account isn&apos;t a curator.
          An admin can grant access with <code>npm run set-curator -- {auth.user.email}</code> (in{" "}
          <code>functions/</code>). Then sign out and back in.
        </p>
        <button type="button" onClick={() => signOut(getAuth(app))} className="mt-6 rounded-full bg-surface-2 px-5 py-3 font-semibold">
          Sign out
        </button>
      </Shell>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Curator tool</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          {auth.user.email}
          <button type="button" onClick={() => signOut(getAuth(app))} className="font-semibold text-fg hover:underline">
            Sign out
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        Changes reach the public site within an hour (the public list is cached).
      </p>

      <nav aria-label="Curator sections" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id ? "bg-fg text-bg" : "bg-surface-2 hover:bg-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "sources" ? (
          <SourcesPanel app={app} />
        ) : tab === "runs" ? (
          <RunsPanel app={app} />
        ) : (
          <EventQueue key={tab} app={app} tab={tab} uid={auth.user.uid} />
        )}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 py-12">{children}</div>;
}
