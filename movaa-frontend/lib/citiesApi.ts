const GEONAMES_USERNAME = "efemjoba";
export async function fetchNigerianCities(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  const url = `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(query)}&country=NG&featureClass=P&maxRows=10&username=${GEONAMES_USERNAME}`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.geonames.map((item: any) => item.name).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i);
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
} 