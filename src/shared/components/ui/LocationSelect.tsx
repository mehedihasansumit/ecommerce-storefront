"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Select } from "./Select";

export interface LocationValue {
  division: string;
  district: string;
  upazila: string;
  union: string;
}

interface GeoItem {
  id: string;
  name: string;
  bnName: string;
}

type Level = keyof LocationValue;

interface LocationSelectProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  locale?: string;
  disabled?: boolean;
  errors?: Partial<Record<Level, string>>;
  required?: Partial<Record<Level, boolean>>;
  labels: Record<Level, string>;
  /** Placeholder option text per level, e.g. "Select division". */
  placeholders?: Partial<Record<Level, string>>;
}

const EMPTY: GeoItem[] = [];

async function fetchGeo(url: string): Promise<GeoItem[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return (await res.json()) as GeoItem[];
  } catch {
    return [];
  }
}

function sameValue(a: LocationValue, b: LocationValue | null): boolean {
  return (
    !!b &&
    a.division === b.division &&
    a.district === b.district &&
    a.upazila === b.upazila &&
    a.union === b.union
  );
}

/**
 * Cascading Bangladesh location selector: Division → District → Upazila → Union.
 * Controlled by name strings (what gets stored). Resolves names → ids on external
 * value changes (edit / saved-address preload). i18n-agnostic: pass translated labels.
 */
export function LocationSelect({
  value,
  onChange,
  locale = "en",
  disabled = false,
  errors = {},
  required = {},
  labels,
  placeholders = {},
}: LocationSelectProps) {
  const isBn = locale === "bn";
  const labelOf = (g: GeoItem) => (isBn && g.bnName ? g.bnName : g.name);

  const [divisions, setDivisions] = useState<GeoItem[]>(EMPTY);
  const [districts, setDistricts] = useState<GeoItem[]>(EMPTY);
  const [upazilas, setUpazilas] = useState<GeoItem[]>(EMPTY);
  const [unions, setUnions] = useState<GeoItem[]>(EMPTY);

  const [divId, setDivId] = useState("");
  const [distId, setDistId] = useState("");
  const [upaId, setUpaId] = useState("");
  const [uniId, setUniId] = useState("");

  const lastEmitted = useRef<LocationValue | null>(null);

  // Load divisions once on mount.
  useEffect(() => {
    fetchGeo("/api/geo/divisions").then(setDivisions);
  }, []);

  // Resolve external value (names) → ids + child lists. Skips our own emissions.
  useEffect(() => {
    if (sameValue(value, lastEmitted.current)) return;
    let cancelled = false;

    (async () => {
      const divs = divisions.length ? divisions : await fetchGeo("/api/geo/divisions");
      if (cancelled) return;
      if (!divisions.length) setDivisions(divs);

      const div = divs.find((d) => d.name === value.division);
      setDivId(div?.id ?? "");
      if (!div) {
        setDistricts(EMPTY); setUpazilas(EMPTY); setUnions(EMPTY);
        setDistId(""); setUpaId(""); setUniId("");
        lastEmitted.current = value;
        return;
      }

      const dists = await fetchGeo(`/api/geo/districts?divisionId=${div.id}`);
      if (cancelled) return;
      setDistricts(dists);
      const dist = dists.find((d) => d.name === value.district);
      setDistId(dist?.id ?? "");
      if (!dist) {
        setUpazilas(EMPTY); setUnions(EMPTY); setUpaId(""); setUniId("");
        lastEmitted.current = value;
        return;
      }

      const upas = await fetchGeo(`/api/geo/upazilas?districtId=${dist.id}`);
      if (cancelled) return;
      setUpazilas(upas);
      const upa = upas.find((u) => u.name === value.upazila);
      setUpaId(upa?.id ?? "");
      if (!upa) {
        setUnions(EMPTY); setUniId("");
        lastEmitted.current = value;
        return;
      }

      const unis = await fetchGeo(`/api/geo/unions?upazilaId=${upa.id}`);
      if (cancelled) return;
      setUnions(unis);
      const uni = unis.find((u) => u.name === value.union);
      setUniId(uni?.id ?? "");
      lastEmitted.current = value;
    })();

    return () => { cancelled = true; };
  }, [value, divisions]);

  const emit = useCallback((next: LocationValue) => {
    lastEmitted.current = next;
    onChange(next);
  }, [onChange]);

  function handleDivision(id: string) {
    const div = divisions.find((d) => d.id === id);
    setDivId(id);
    setDistId(""); setUpaId(""); setUniId("");
    setDistricts(EMPTY); setUpazilas(EMPTY); setUnions(EMPTY);
    emit({ division: div?.name ?? "", district: "", upazila: "", union: "" });
    if (id) fetchGeo(`/api/geo/districts?divisionId=${id}`).then(setDistricts);
  }

  function handleDistrict(id: string) {
    const dist = districts.find((d) => d.id === id);
    setDistId(id);
    setUpaId(""); setUniId("");
    setUpazilas(EMPTY); setUnions(EMPTY);
    emit({ division: value.division, district: dist?.name ?? "", upazila: "", union: "" });
    if (id) fetchGeo(`/api/geo/upazilas?districtId=${id}`).then(setUpazilas);
  }

  function handleUpazila(id: string) {
    const upa = upazilas.find((u) => u.id === id);
    setUpaId(id);
    setUniId("");
    setUnions(EMPTY);
    emit({ division: value.division, district: value.district, upazila: upa?.name ?? "", union: "" });
    if (id) fetchGeo(`/api/geo/unions?upazilaId=${id}`).then(setUnions);
  }

  function handleUnion(id: string) {
    const uni = unions.find((u) => u.id === id);
    setUniId(id);
    emit({ division: value.division, district: value.district, upazila: value.upazila, union: uni?.name ?? "" });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <LevelField label={labels.division} required={required.division} error={errors.division}>
        <Select
          value={divId}
          disabled={disabled}
          invalid={!!errors.division}
          onChange={(e) => handleDivision(e.target.value)}
        >
          <option value="">{placeholders.division ?? `— ${labels.division} —`}</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{labelOf(d)}</option>
          ))}
        </Select>
      </LevelField>

      <LevelField label={labels.district} required={required.district} error={errors.district}>
        <Select
          value={distId}
          disabled={disabled || !divId}
          invalid={!!errors.district}
          onChange={(e) => handleDistrict(e.target.value)}
        >
          <option value="">{placeholders.district ?? `— ${labels.district} —`}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{labelOf(d)}</option>
          ))}
        </Select>
      </LevelField>

      <LevelField label={labels.upazila} required={required.upazila} error={errors.upazila}>
        <Select
          value={upaId}
          disabled={disabled || !distId}
          invalid={!!errors.upazila}
          onChange={(e) => handleUpazila(e.target.value)}
        >
          <option value="">{placeholders.upazila ?? `— ${labels.upazila} —`}</option>
          {upazilas.map((u) => (
            <option key={u.id} value={u.id}>{labelOf(u)}</option>
          ))}
        </Select>
      </LevelField>

      {/* Union only applies to rural upazilas; metro thanas have none — hide it
          rather than show a dead, empty dropdown. */}
      {unions.length > 0 && (
        <LevelField label={labels.union} required={required.union} error={errors.union}>
          <Select
            value={uniId}
            disabled={disabled || !upaId}
            invalid={!!errors.union}
            onChange={(e) => handleUnion(e.target.value)}
          >
            <option value="">{placeholders.union ?? `— ${labels.union} —`}</option>
            {unions.map((u) => (
              <option key={u.id} value={u.id}>{labelOf(u)}</option>
            ))}
          </Select>
        </LevelField>
      )}
    </div>
  );
}

function LevelField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
