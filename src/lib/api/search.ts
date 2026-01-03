import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  court?: string;
  fromYear?: number;
  toYear?: number;
  pagenum?: number;
}

interface SearchResult {
  id: string;
  docId: string;
  citation: string;
  title: string;
  court: string;
  date: string;
  snippet: string;
  relevance: number;
  sections: string[];
  url: string;
}

interface SearchResponse {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  totalResults: number;
  pagenum: number;
  found?: string;
  attribution: string;
}

export async function searchLegalCases(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const { data, error } = await supabase.functions.invoke('legal-search', {
    body: { query, filters }
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error(error.message || 'Search failed');
  }

  return data as SearchResponse;
}

export type { SearchFilters, SearchResult, SearchResponse };
