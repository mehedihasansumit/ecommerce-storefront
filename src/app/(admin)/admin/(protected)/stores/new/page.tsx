"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";

const DEFAULT_THEME = {
  primaryColor: "#2563EB",
  secondaryColor: "#3B82F6",
  accentColor: "#DBEAFE",
  backgroundColor: "#FFFFFF",
  textColor: "#1E293B",
  headerBg: "#1E3A5F",
  headerText: "#FFFFFF",
  fontFamily: "Inter",
  borderRadius: "0.5rem",
  layoutStyle: "grid" as const,
};

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    domains: "",
    theme: DEFAULT_THEME,
    supportedLanguages: ["en"],
    defaultLanguage: "en",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (
    colorKey: keyof typeof DEFAULT_THEME,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [colorKey]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const domainsArray = formData.domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      if (!formData.name.trim()) {
        throw new Error("Store name is required");
      }

      if (domainsArray.length === 0) {
        throw new Error("At least one domain is required");
      }

      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domains: domainsArray,
          theme: formData.theme,
          supportedLanguages: formData.supportedLanguages,
          defaultLanguage: formData.defaultLanguage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create store");
      }

      const data = await res.json();
      router.push(`/admin/stores/${data.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/admin/stores"
          className="p-2 hover:bg-admin-surface-hover rounded-lg transition"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold">Create New Store</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-admin-surface p-6 rounded-lg">
        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Shirts Hub"
            className="w-full px-4 py-2 border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
            disabled={loading}
          />
        </div>

        {/* Domains */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Domains (comma-separated)
          </label>
          <input
            type="text"
            name="domains"
            value={formData.domains}
            onChange={handleInputChange}
            placeholder="e.g., store.com, www.store.com"
            className="w-full px-4 py-2 border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
            disabled={loading}
          />
          <p className="text-xs text-admin-text-secondary mt-1">
            Enter multiple domains separated by commas
          </p>
        </div>

        {/* Languages Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Languages</h2>
          <p className="text-sm text-admin-text-secondary mb-4">Select which languages this store should support</p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lang-en"
                checked={formData.supportedLanguages.includes("en")}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    supportedLanguages: e.target.checked
                      ? [...prev.supportedLanguages, "en"]
                      : prev.supportedLanguages.filter((l) => l !== "en"),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
                disabled={loading}
              />
              <label htmlFor="lang-en" className="text-sm cursor-pointer">
                English
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lang-bn"
                checked={formData.supportedLanguages.includes("bn")}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    supportedLanguages: e.target.checked
                      ? [...prev.supportedLanguages, "bn"]
                      : prev.supportedLanguages.filter((l) => l !== "bn"),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
                disabled={loading}
              />
              <label htmlFor="lang-bn" className="text-sm cursor-pointer">
                বাংলা (Bangla)
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Default Language</label>
            <select
              value={formData.defaultLanguage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  defaultLanguage: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={loading}
            >
              {formData.supportedLanguages.includes("en") && <option value="en">English</option>}
              {formData.supportedLanguages.includes("bn") && <option value="bn">বাংলা (Bangla)</option>}
            </select>
          </div>
        </div>

        {/* Theme Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Theme</h2>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <ColorInput
              label="Primary Color"
              value={formData.theme.primaryColor}
              onChange={(value) => handleColorChange("primaryColor", value)}
              disabled={loading}
            />
            <ColorInput
              label="Secondary Color"
              value={formData.theme.secondaryColor}
              onChange={(value) => handleColorChange("secondaryColor", value)}
              disabled={loading}
            />
            <ColorInput
              label="Accent Color"
              value={formData.theme.accentColor}
              onChange={(value) => handleColorChange("accentColor", value)}
              disabled={loading}
            />
            <ColorInput
              label="Background Color"
              value={formData.theme.backgroundColor}
              onChange={(value) => handleColorChange("backgroundColor", value)}
              disabled={loading}
            />
            <ColorInput
              label="Text Color"
              value={formData.theme.textColor}
              onChange={(value) => handleColorChange("textColor", value)}
              disabled={loading}
            />
            <ColorInput
              label="Header Background"
              value={formData.theme.headerBg}
              onChange={(value) => handleColorChange("headerBg", value)}
              disabled={loading}
            />
            <ColorInput
              label="Header Text"
              value={formData.theme.headerText}
              onChange={(value) => handleColorChange("headerText", value)}
              disabled={loading}
            />
          </div>

          {/* Font Family */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={formData.theme.fontFamily}
              onChange={(e) =>
                handleColorChange("fontFamily", e.target.value as any)
              }
              className="w-full px-4 py-2 border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={loading}
            >
              <option>Inter</option>
              <option>Poppins</option>
              <option>Playfair Display</option>
              <option>Roboto</option>
              <option>Open Sans</option>
            </select>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-sm font-medium mb-2">Border Radius</label>
            <select
              value={formData.theme.borderRadius}
              onChange={(e) =>
                handleColorChange("borderRadius", e.target.value as any)
              }
              className="w-full px-4 py-2 border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              disabled={loading}
            >
              <option value="0rem">None</option>
              <option value="0.25rem">Small</option>
              <option value="0.5rem">Medium</option>
              <option value="0.75rem">Large</option>
              <option value="1rem">Extra Large</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Link
            href="/admin/stores"
            className="px-6 py-2 border border-admin-border-md rounded-lg hover:bg-admin-surface-hover transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Store"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer"
          disabled={disabled}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
