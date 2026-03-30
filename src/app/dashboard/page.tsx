import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? "Usuario";
  return <DashboardClient userName={userName} />;
}
