import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen min-h-dvh bg-background">
      <DashboardSidebar user={session.user} />

      {/*
        Desktop: flex-1 next to sidebar.
        Mobile: full width, padded top (fixed top bar) and bottom (fixed tab bar).
      */}
      <main className="
        flex-1 flex flex-col overflow-hidden
        pt-0 md:pt-0
        mt-14 md:mt-0
        mb-[var(--bottom-nav-h)] md:mb-0
      ">
        {children}
      </main>
    </div>
  );
}
