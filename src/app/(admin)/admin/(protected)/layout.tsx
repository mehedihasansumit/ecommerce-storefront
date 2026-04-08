import { redirect } from "next/navigation";
import { getAdminToken } from "@/shared/lib/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getAdminToken();

  if (!payload || payload.type !== "admin") {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
