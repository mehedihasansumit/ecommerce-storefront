"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import type { IStore } from "@/features/stores/types";

interface StoreEditFormProps {
  store: IStore;
}

export default function StoreEditForm({ store }: StoreEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: store.name,
    domains: store.domains.join(", "),
    theme: { ...store.theme },
    isActive: store.isActive,
    heroBanners: store.heroBanners || [],
    contact: {
      email: store.contact?.email || "",
      phone: store.contact?.phone || "",
      address: store.contact?.address || "",
    },
    seo: {
      title: store.seo?.title || "",
      description: store.seo?.description || "",
      keywords: store.seo?.keywords?.join(", ") || "",
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    section?: keyof typeof formData
  ) => {
    const { name, value } = e.target;

    if (section) {
      setFormData((prev) => {
        const sectionData = prev[section];
        if (typeof sectionData === 'object' && sectionData !== null) {
          return {
            ...prev,
            [section]: {
              ...sectionData,
              [name]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleColorChange = (colorKey: keyof typeof store.theme, value: string) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [colorKey]: value,
      },
    }));
  };

  const handleAddBanner = () => {
    setFormData((prev) => ({
      ...prev,
      heroBanners: [
        ...prev.heroBanners,
        { image: "", title: "", subtitle: "", linkUrl: "", linkText: "" },
      ],
    }));
  };

  const handleRemoveBanner = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      heroBanners: prev.heroBanners.filter((_, i) => i !== index),
    }));
  };

  const handleBannerChange = (
    index: number,
    field: keyof (typeof formData.heroBanners)[0],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      heroBanners: prev.heroBanners.map((banner, i) =>
        i === index ? { ...banner, [field]: value } : banner
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const domainsArray = formData.domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      const keywords = formData.seo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      const res = await fetch(`/api/stores/${store._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domains: domainsArray,
          theme: formData.theme,
          isActive: formData.isActive,
          heroBanners: formData.heroBanners,
          contact: formData.contact,
          seo: {
            title: formData.seo.title,
            description: formData.seo.description,
            keywords,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update store");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-6">Edit Store</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check size={18} />
          Store updated successfully
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="col-span-full md:col-span-2">
          <h3 className="font-medium mb-4">Basic Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            name="isActive"
            value={formData.isActive ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isActive: e.target.value === "true",
              }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Domains (comma-separated)</label>
          <input
            type="text"
            name="domains"
            value={formData.domains}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        {/* Theme */}
        <div className="col-span-full md:col-span-2 pt-4 border-t">
          <h3 className="font-medium mb-4">Theme Colors</h3>
        </div>

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

        {/* Font & Layout */}
        <div className="col-span-full md:col-span-2 pt-4 border-t">
          <h3 className="font-medium mb-4">Typography & Layout</h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Font Family</label>
          <select
            value={formData.theme.fontFamily}
            onChange={(e) =>
              handleColorChange("fontFamily", e.target.value as any)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option>Inter</option>
            <option>Poppins</option>
            <option>Playfair Display</option>
            <option>Roboto</option>
            <option>Open Sans</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Border Radius</label>
          <select
            value={formData.theme.borderRadius}
            onChange={(e) =>
              handleColorChange("borderRadius", e.target.value as any)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option value="0rem">None</option>
            <option value="0.25rem">Small</option>
            <option value="0.5rem">Medium</option>
            <option value="0.75rem">Large</option>
            <option value="1rem">Extra Large</option>
          </select>
        </div>

        {/* Hero Banners */}
        <div className="col-span-full md:col-span-2 pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Hero Banners</h3>
            <button
              type="button"
              onClick={handleAddBanner}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              disabled={loading}
            >
              + Add Banner
            </button>
          </div>
        </div>

        {formData.heroBanners.map((banner, index) => (
          <div
            key={index}
            className="col-span-full md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Banner {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveBanner(index)}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition"
                disabled={loading}
              >
                Remove
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL *</label>
              <input
                type="text"
                value={banner.image}
                onChange={(e) => handleBannerChange(index, "image", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={banner.title}
                onChange={(e) => handleBannerChange(index, "title", e.target.value)}
                placeholder="Banner title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <input
                type="text"
                value={banner.subtitle}
                onChange={(e) => handleBannerChange(index, "subtitle", e.target.value)}
                placeholder="Banner subtitle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Link URL</label>
                <input
                  type="text"
                  value={banner.linkUrl}
                  onChange={(e) => handleBannerChange(index, "linkUrl", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link Text</label>
                <input
                  type="text"
                  value={banner.linkText}
                  onChange={(e) => handleBannerChange(index, "linkText", e.target.value)}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="col-span-full md:col-span-2 pt-4 border-t">
          <h3 className="font-medium mb-4">Contact Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.contact.email}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.contact.phone}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div className="col-span-full md:col-span-2">
          <label className="block text-sm font-medium mb-2">Address</label>
          <textarea
            name="address"
            value={formData.contact.address}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows={3}
            disabled={loading}
          />
        </div>

        {/* SEO */}
        <div className="col-span-full md:col-span-2 pt-4 border-t">
          <h3 className="font-medium mb-4">SEO Settings</h3>
        </div>

        <div className="col-span-full md:col-span-2">
          <label className="block text-sm font-medium mb-2">SEO Title</label>
          <input
            type="text"
            name="title"
            value={formData.seo.title}
            onChange={(e) => handleInputChange(e, "seo")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div className="col-span-full md:col-span-2">
          <label className="block text-sm font-medium mb-2">SEO Description</label>
          <textarea
            name="description"
            value={formData.seo.description}
            onChange={(e) => handleInputChange(e, "seo")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="col-span-full md:col-span-2">
          <label className="block text-sm font-medium mb-2">SEO Keywords (comma-separated)</label>
          <input
            type="text"
            name="keywords"
            value={formData.seo.keywords}
            onChange={(e) => handleInputChange(e, "seo")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <div className="col-span-full md:col-span-2 pt-6 border-t flex gap-3">
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
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
