"use client";

import Link from "next/link";
import { useTenant } from "@/shared/hooks/useTenant";

export function Footer() {
  const tenant = useTenant();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {tenant?.name || "Store"}
            </h3>
            {tenant?.contact.address && (
              <p className="text-sm text-gray-600">{tenant.contact.address}</p>
            )}
            {tenant?.contact.email && (
              <p className="text-sm text-gray-600">{tenant.contact.email}</p>
            )}
            {tenant?.contact.phone && (
              <p className="text-sm text-gray-600">{tenant.contact.phone}</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/products" className="hover:text-gray-900">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-gray-900">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-gray-900">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-gray-900">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              {tenant?.socialLinks.facebook && (
                <a
                  href={tenant.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Facebook
                </a>
              )}
              {tenant?.socialLinks.instagram && (
                <a
                  href={tenant.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Instagram
                </a>
              )}
              {tenant?.socialLinks.twitter && (
                <a
                  href={tenant.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Twitter
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {tenant?.name || "Store"}. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
