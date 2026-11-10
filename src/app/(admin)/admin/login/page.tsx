import { redirect } from "next/navigation";
import { getAdminToken } from "@/shared/lib/auth";
import { Card } from "@/shared/components/ui";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const payload = await getAdminToken();

  if (payload?.type === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-admin-bg px-4 py-10">
      <Card padding="lg" className="w-full max-w-md shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary mb-6 text-center">
          Admin Login
        </h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-admin-text-muted">
          Demo: admin@example.com / admin123
        </p>
      </Card>
    </main>
  );
}
