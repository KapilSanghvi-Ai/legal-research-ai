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

interface SemanticSearchResult {
  id: string;
  sourceId: string;
  paragraphNum: number;
  content: string;
  similarity: number;
  citation: string;
  court: string;
}

interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResult[];
  allFragments: SemanticSearchResult[];
  totalResults: number;
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

export async function semanticSearch(
  query: string,
  matchThreshold: number = 0.75,
  matchCount: number = 10
): Promise<SemanticSearchResponse> {
  const { data, error } = await supabase.functions.invoke('semantic-search', {
    body: { query, matchThreshold, matchCount }
  });

  if (error) {
    console.error('Semantic search error:', error);
    throw new Error(error.message || 'Semantic search failed');
  }

  return data as SemanticSearchResponse;
}

export type { SearchFilters, SearchResult, SearchResponse, SemanticSearchResult, SemanticSearchResponse };
