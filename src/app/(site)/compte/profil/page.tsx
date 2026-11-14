import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileForms name={user.name} phone={user.phone ?? ""} email={user.email} />;
}
