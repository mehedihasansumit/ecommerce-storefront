import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Login</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 text-white font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/account/register"
          className="font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
