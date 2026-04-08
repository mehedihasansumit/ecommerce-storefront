import { redirect } from "next/navigation";
import { getAdminToken } from "@/shared/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const payload = await getAdminToken();

  if (payload?.type === "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          Demo: admin@example.com / admin123
        </p>
      </div>
    </div>
  );
}
