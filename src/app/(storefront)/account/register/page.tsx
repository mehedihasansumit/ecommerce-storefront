import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">Create Account</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="Your Name"
          />
        </div>
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
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/account/login"
          className="font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          Login
        </Link>
      </p>
    </div>
  );
}
