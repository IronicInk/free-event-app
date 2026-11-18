import type { Metadata } from "next";
import { AdminLoader } from "@/components/admin/AdminLoader";

export const metadata: Metadata = {
  title: "Curator tool",
  robots: { index: false, follow: false },
};

/**
 * Operator-only curation tool (FR-15, FR-17). Not linked from the consumer app.
 * Access needs a Firebase sign-in AND the `curator` claim; Firestore rules enforce it.
 */
export default function AdminPage() {
  return <AdminLoader />;
}
