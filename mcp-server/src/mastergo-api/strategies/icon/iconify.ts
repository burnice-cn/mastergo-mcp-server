const ICONIFY_API_BASE_URL = "https://api.iconify.design";
const MAX_SVG_BYTES = 200_000;
const ICONIFY_REQUEST_TIMEOUT_MS = 10_000;
const ICONIFY_MIN_SEARCH_LIMIT = 32;

export type IconSource = {
  id: "iconify";
  name: string;
  description: string;
  homepage: string;
  supportsSearch: boolean;
  supportsSvg: boolean;
};

export type IconSearchParams = {
  query: string;
  source?: "iconify" | null;
  collections?: string[] | null;
  limit?: number | null;
  offset?: number | null;
  includePreviewSvg?: boolean | null;
};

export type IconSvgParams = {
  id: string;
  source?: "iconify" | null;
  color?: string | null;
  size?: number | null;
};

export type IconCandidate = {
  id: string;
  name: string;
  collection: string;
  source: "iconify";
  previewSvg?: string;
};

export type IconSearchResult = {
  source: "iconify";
  query: string;
  total: number;
  limit: number;
  offset: number;
  truncated: boolean;
  icons: IconCandidate[];
  collections?: Record<string, unknown>;
};

export type IconSvgResult = {
  id: string;
  source: "iconify";
  collection: string;
  name: string;
  svg: string;
  byteLength: number;
};

type IconifySearchResponse = {
  icons?: string[];
  total?: number;
  limit?: number;
  start?: number;
  collections?: Record<string, unknown>;
};

const svgCache = new Map<string, string>();
const searchCache = new Map<string, IconSearchResult>();

export function listIconSources(): IconSource[] {
  return [
    {
      id: "iconify",
      name: "Iconify",
      description:
        "Search and retrieve SVG icons from the public Iconify API.",
      homepage: "https://iconify.design",
      supportsSearch: true,
      supportsSvg: true,
    },
  ];
}

export async function searchIcons(params: IconSearchParams): Promise<IconSearchResult> {
  const source = params.source ?? "iconify";
  if (source !== "iconify") {
    throw new Error(`Unsupported icon source: ${source}`);
  }

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const apiLimit = Math.max(limit, ICONIFY_MIN_SEARCH_LIMIT);
  const includePreviewSvg = params.includePreviewSvg ?? false;
  const cacheKey = JSON.stringify({
    query: params.query,
    collections: params.collections ?? [],
    limit,
    offset,
    includePreviewSvg,
  });
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL("/search", ICONIFY_API_BASE_URL);
  url.searchParams.set("query", params.query);
  url.searchParams.set("limit", String(apiLimit));
  url.searchParams.set("start", String(offset));

  if (params.collections && params.collections.length > 0) {
    url.searchParams.set("prefixes", params.collections.join(","));
  }

  const response = await fetchJson<IconifySearchResponse>(url);
  const icons = (response.icons ?? []).slice(0, limit);
  const candidates: IconCandidate[] = [];

  for (const id of icons) {
    const parsed = parseIconId(id);
    const candidate: IconCandidate = {
      id,
      name: parsed.name,
      collection: parsed.collection,
      source: "iconify",
    };

    if (includePreviewSvg) {
      candidate.previewSvg = (await getIconSvg({ id })).svg;
    }

    candidates.push(candidate);
  }

  const result: IconSearchResult = {
    source: "iconify",
    query: params.query,
    total: response.total ?? icons.length,
    limit,
    offset: response.start ?? offset,
    truncated: (response.start ?? offset) + icons.length < (response.total ?? icons.length),
    icons: candidates,
    collections: response.collections,
  };

  searchCache.set(cacheKey, result);
  return result;
}

export async function getIconSvg(params: IconSvgParams): Promise<IconSvgResult> {
  const source = params.source ?? "iconify";
  if (source !== "iconify") {
    throw new Error(`Unsupported icon source: ${source}`);
  }

  const { collection, name } = parseIconId(params.id);
  const cacheKey = JSON.stringify({
    id: params.id,
    color: params.color ?? null,
    size: params.size ?? null,
  });
  const cached = svgCache.get(cacheKey);
  if (cached) {
    return {
      id: params.id,
      source: "iconify",
      collection,
      name,
      svg: cached,
      byteLength: utf8ByteLength(cached),
    };
  }

  const url = new URL(`/${encodeURIComponent(collection)}/${encodeURIComponent(name)}.svg`, ICONIFY_API_BASE_URL);
  if (params.color) {
    url.searchParams.set("color", params.color);
  }
  if (params.size) {
    url.searchParams.set("width", String(params.size));
    url.searchParams.set("height", String(params.size));
  }

  const svg = sanitizeSvg(await fetchText(url));
  svgCache.set(cacheKey, svg);

  return {
    id: params.id,
    source: "iconify",
    collection,
    name,
    svg,
    byteLength: utf8ByteLength(svg),
  };
}

export function sanitizeSvg(svg: string): string {
  const cleaned = svg.trim();
  const byteLength = utf8ByteLength(cleaned);

  if (byteLength > MAX_SVG_BYTES) {
    throw new Error(`SVG is ${byteLength} bytes, exceeding ${MAX_SVG_BYTES}.`);
  }
  if (!/^<svg[\s>]/i.test(cleaned)) {
    throw new Error("Icon response is not an SVG document.");
  }
  if (/<(?:script|foreignObject)\b/i.test(cleaned)) {
    throw new Error("SVG contains disallowed script or foreignObject elements.");
  }
  if (/<!doctype\b/i.test(cleaned)) {
    throw new Error("SVG doctype declarations are not allowed.");
  }
  if (/\son[a-z]+\s*=/i.test(cleaned)) {
    throw new Error("SVG event handler attributes are not allowed.");
  }
  if (/\s(?:href|xlink:href)\s*=\s*["'](?!#)[^"']+["']/i.test(cleaned)) {
    throw new Error("SVG external href references are not allowed.");
  }

  assertAllowedSvgTags(cleaned);
  return cleaned;
}

export function clearIconCache(): { cleared: true; searchEntries: number; svgEntries: number } {
  const searchEntries = searchCache.size;
  const svgEntries = svgCache.size;

  searchCache.clear();
  svgCache.clear();

  return {
    cleared: true,
    searchEntries,
    svgEntries,
  };
}

function parseIconId(id: string): { collection: string; name: string } {
  const [collection, ...nameParts] = id.split(":");
  const name = nameParts.join(":");

  if (!collection || !name) {
    throw new Error(`Icon id must use "collection:name" format: ${id}`);
  }

  return { collection, name };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(ICONIFY_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Iconify request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function fetchText(url: URL): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(ICONIFY_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Iconify request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function assertAllowedSvgTags(svg: string): void {
  const allowedTags = new Set([
    "svg",
    "g",
    "path",
    "rect",
    "circle",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "defs",
    "clipPath",
    "mask",
    "linearGradient",
    "radialGradient",
    "stop",
    "title",
    "desc",
  ]);

  for (const match of svg.matchAll(/<\/?\s*([A-Za-z][\w:-]*)/g)) {
    if (!allowedTags.has(match[1])) {
      throw new Error(`SVG contains disallowed tag: ${match[1]}`);
    }
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
