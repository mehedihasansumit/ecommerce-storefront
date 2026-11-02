/**
 * Demo "Details" rows and size charts for the seeded stores. Used by seed.ts on a fresh
 * database and by scripts/seed-details.ts to fill an existing one (only empty rows).
 * Sample content — store owners replace it from the admin.
 */
import type { LocalizedString } from "@/shared/types/i18n";

type Detail = { label: LocalizedString; value: LocalizedString };
type SizeGuide = { columns: LocalizedString[]; rows: string[][]; note: LocalizedString };

const d = (en: string, bn: string, valueEn: string, valueBn: string): Detail => ({
  label: { en, bn },
  value: { en: valueEn, bn: valueBn },
});

export const DEMO_DETAILS: Record<string, Detail[]> = {
  "classic-white-oxford": [
    d("Fabric", "কাপড়", "100% long-staple cotton oxford, 120 GSM", "১০০% লং-স্ট্যাপল কটন অক্সফোর্ড, ১২০ জিএসএম"),
    d("Fit", "ফিট", "Regular fit, true to size", "রেগুলার ফিট, নিজের মাপেই নিন"),
    d("Details", "খুঁটিনাটি", "Button-down collar, mother-of-pearl buttons", "বাটন-ডাউন কলার, ঝিনুকের বোতাম"),
    d("Care", "যত্ন", "Machine wash cold, iron on medium", "ঠান্ডা পানিতে মেশিন ওয়াশ, মাঝারি তাপে ইস্ত্রি"),
    d("Origin", "তৈরি", "Made in Bangladesh", "বাংলাদেশে তৈরি"),
  ],
  "blue-denim-casual": [
    d("Fabric", "কাপড়", "Washed cotton denim, 6 oz", "ওয়াশড কটন ডেনিম, ৬ আউন্স"),
    d("Fit", "ফিট", "Relaxed fit — size down for a closer cut", "রিল্যাক্সড ফিট — আঁটসাঁট চাইলে এক সাইজ ছোট নিন"),
    d("Care", "যত্ন", "Wash inside out with like colours", "উল্টো করে একই রঙের সাথে ধুয়ে নিন"),
  ],
  "graphic-print-tshirt": [
    d("Fabric", "কাপড়", "Combed cotton jersey, 180 GSM", "কম্বড কটন জার্সি, ১৮০ জিএসএম"),
    d("Print", "প্রিন্ট", "Water-based screen print", "ওয়াটার-বেসড স্ক্রিন প্রিন্ট"),
    d("Care", "যত্ন", "Wash inside out, do not iron the print", "উল্টো করে ধুয়ে নিন, প্রিন্টের উপর ইস্ত্রি নয়"),
  ],
  "royal-blue-cotton-punjabi": [
    d("Fabric", "কাপড়", "Fine Pakistani cotton, breathable for summer", "মিহি পাকিস্তানি কটন, গরমে আরামদায়ক"),
    d("Fit", "ফিট", "Regular fit, knee length", "রেগুলার ফিট, হাঁটু পর্যন্ত লম্বা"),
    d("Details", "খুঁটিনাটি", "Self-tone embroidery on placket and cuffs", "প্ল্যাকেট ও হাতায় একই রঙের সূচিকর্ম"),
    d("Care", "যত্ন", "Hand wash or dry clean", "হাতে ধোয়া বা ড্রাই ক্লিন"),
  ],
  "embroidered-silk-punjabi": [
    d("Fabric", "কাপড়", "Rajshahi silk blend with a soft lustre", "হালকা দ্যুতির রাজশাহী সিল্ক ব্লেন্ড"),
    d("Embroidery", "সূচিকর্ম", "Hand-finished zari work on the collar and placket", "কলার ও প্ল্যাকেটে হাতে করা জরির কাজ"),
    d("Fit", "ফিট", "Regular fit, below-knee length", "রেগুলার ফিট, হাঁটুর নিচ পর্যন্ত লম্বা"),
    d("Occasion", "উপলক্ষ", "Eid, weddings, evening events", "ঈদ, বিয়ে, সন্ধ্যার অনুষ্ঠান"),
    d("Care", "যত্ন", "Dry clean only", "শুধু ড্রাই ক্লিন"),
  ],
  "air-runner-pro": [
    d("Upper", "উপরিভাগ", "Engineered knit mesh", "ইঞ্জিনিয়ার্ড নিট মেশ"),
    d("Sole", "সোল", "Cushioned EVA midsole, rubber outsole", "কুশনযুক্ত ইভিএ মিডসোল, রাবার আউটসোল"),
    d("Fit", "ফিট", "True to size; half size up for wide feet", "নিজের মাপেই নিন; পা চওড়া হলে আধা সাইজ বড়"),
  ],
  "classic-leather-boot": [
    d("Upper", "উপরিভাগ", "Full-grain cow leather", "ফুল-গ্রেইন গরুর চামড়া"),
    d("Sole", "সোল", "Stitched rubber sole, resoleable", "সেলাই করা রাবার সোল, বদলানো যায়"),
    d("Care", "যত্ন", "Wipe clean, condition monthly", "মুছে পরিষ্কার, মাসে একবার কন্ডিশনার"),
  ],
  "summer-breeze-sandals": [
    d("Upper", "উপরিভাগ", "Soft synthetic straps", "নরম সিনথেটিক স্ট্র্যাপ"),
    d("Sole", "সোল", "Lightweight cushioned footbed", "হালকা কুশনযুক্ত ফুটবেড"),
  ],
};

const SHIRT_GUIDE: SizeGuide = {
  columns: [
    { en: "Size", bn: "সাইজ" },
    { en: "Chest (in)", bn: "বুক (ইঞ্চি)" },
    { en: "Length (in)", bn: "লম্বা (ইঞ্চি)" },
    { en: "Sleeve (in)", bn: "হাতা (ইঞ্চি)" },
  ],
  rows: [
    ["S", "38", "28", "24"],
    ["M", "40", "29", "24.5"],
    ["L", "42", "30", "25"],
    ["XL", "44", "31", "25.5"],
  ],
  note: {
    en: "Measure around the fullest part of your chest with the tape level. Between sizes? Take the larger one.",
    bn: "বুকের সবচেয়ে চওড়া জায়গায় ফিতা সমান রেখে মাপুন। দুই সাইজের মাঝে হলে বড়টি নিন।",
  },
};

const PUNJABI_GUIDE: SizeGuide = {
  columns: [
    { en: "Size", bn: "সাইজ" },
    { en: "Chest (in)", bn: "বুক (ইঞ্চি)" },
    { en: "Length (in)", bn: "লম্বা (ইঞ্চি)" },
  ],
  rows: [
    ["38", "38", "40"],
    ["40", "40", "41"],
    ["42", "42", "42"],
    ["44", "44", "43"],
  ],
  note: {
    en: "Punjabi sizes follow chest measurement. Length is from the shoulder seam.",
    bn: "পাঞ্জাবির সাইজ বুকের মাপ অনুযায়ী। লম্বা কাঁধের সেলাই থেকে মাপা।",
  },
};

const SHOE_GUIDE: SizeGuide = {
  columns: [
    { en: "US", bn: "ইউএস" },
    { en: "UK", bn: "ইউকে" },
    { en: "EU", bn: "ইইউ" },
    { en: "Foot length (cm)", bn: "পায়ের দৈর্ঘ্য (সেমি)" },
  ],
  rows: [
    ["7", "6", "40", "25.0"],
    ["8", "7", "41", "25.7"],
    ["9", "8", "42", "26.3"],
    ["10", "9", "43", "27.0"],
    ["11", "10", "44", "27.7"],
  ],
  note: {
    en: "Stand on paper, mark heel and longest toe, and measure the distance.",
    bn: "কাগজের উপর দাঁড়িয়ে গোড়ালি ও সবচেয়ে লম্বা আঙুল দাগ দিন, তারপর দূরত্ব মাপুন।",
  },
};

/** Keyed by category slug. */
export const DEMO_SIZE_GUIDES: Record<string, SizeGuide> = {
  "casual-shirts": SHIRT_GUIDE,
  "formal-shirts": SHIRT_GUIDE,
  "t-shirts": SHIRT_GUIDE,
  "cotton-punjabi": PUNJABI_GUIDE,
  "silk-punjabi": PUNJABI_GUIDE,
  "designer-punjabi": PUNJABI_GUIDE,
  sneakers: SHOE_GUIDE,
  boots: SHOE_GUIDE,
  sandals: SHOE_GUIDE,
};
