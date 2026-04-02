import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Stores" value="—" />
        <DashboardCard title="Total Products" value="—" />
        <DashboardCard title="Total Orders" value="—" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
