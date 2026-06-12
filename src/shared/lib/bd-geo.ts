/**
 * Bangladesh administrative geo data (Division → District → Upazila → Union).
 * Source dataset: nuhil/bangladesh-geocode (bilingual en/bn, gov.bd-aligned).
 * Server-side only — keeps the large union dataset out of the client bundle.
 * Consumed via the /api/geo/* routes.
 */
import divisionsRaw from "../data/bd-geo/divisions.json";
import districtsRaw from "../data/bd-geo/districts.json";
import upazilasRaw from "../data/bd-geo/upazilas.json";
import unionsRaw from "../data/bd-geo/unions.json";
// Curated city-corporation metro thanas not present in the upstream upazila
// dataset (ids namespaced ≥ 90000). Merged into the upazila level so the
// cascading selector exposes city areas (Gulshan, Mirpur, Pahartali, …).
import metroThanasRaw from "../data/bd-geo/metro-thanas.json";

export type GeoLevel = "division" | "district" | "upazila" | "union";

/** Public shape returned to clients. */
export interface GeoItem {
  id: string;
  name: string;
  bnName: string;
}

interface DivisionRow { id: string; name: string; bn_name: string }
interface DistrictRow extends DivisionRow { division_id: string }
interface UpazilaRow extends DivisionRow { district_id: string }
interface UnionRow extends DivisionRow { upazila_id: string }

const divisions = divisionsRaw as DivisionRow[];
const districts = districtsRaw as DistrictRow[];
const upazilas = [
  ...(upazilasRaw as UpazilaRow[]),
  ...(metroThanasRaw as UpazilaRow[]),
];
const unions = unionsRaw as UnionRow[];

const toItem = (r: DivisionRow): GeoItem => ({ id: r.id, name: r.name, bnName: r.bn_name });
const byName = (a: GeoItem, b: GeoItem) => a.name.localeCompare(b.name);

export function getDivisions(): GeoItem[] {
  return divisions.map(toItem).sort(byName);
}

export function getDistricts(divisionId: string): GeoItem[] {
  return districts.filter((d) => d.division_id === divisionId).map(toItem).sort(byName);
}

export function getUpazilas(districtId: string): GeoItem[] {
  return upazilas.filter((u) => u.district_id === districtId).map(toItem).sort(byName);
}

export function getUnions(upazilaId: string): GeoItem[] {
  return unions.filter((u) => u.upazila_id === upazilaId).map(toItem).sort(byName);
}
