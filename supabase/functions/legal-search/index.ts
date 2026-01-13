import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates JWT and returns user
async function authenticateRequest(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { user: data.user, error: null };
}

// India Kanoon API base URL
const INDIA_KANOON_API_URL = 'https://api.indiankanoon.org';

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

// Map court filter values to India Kanoon doctypes
function getDocTypes(court?: string): string | undefined {
  if (!court || court === 'all') return undefined;
  
  const courtMap: Record<string, string> = {
    'sc': 'supremecourt',
    'hc': 'highcourts',
    'itat': 'itat',
    'tribunals': 'tribunals',
    'delhi': 'delhi',
    'bombay': 'bombay',
    'kolkata': 'kolkata',
    'chennai': 'chennai',
  };
  
  return courtMap[court] || court;
}

// Extract sections from document title or content
function extractSections(title: string, headline: string): string[] {
  const sections: string[] = [];
  const text = `${title} ${headline}`;
  
  // Match Section patterns like "Section 68", "Sec. 148", "S. 271(1)(c)"
  const sectionPattern = /(?:Section|Sec\.|S\.)\s*(\d+[A-Za-z]?(?:\(\d+\))?(?:\([a-z]\))?)/gi;
  let match;
  
  while ((match = sectionPattern.exec(text)) !== null) {
    const section = `Section ${match[1]}`;
    if (!sections.includes(section)) {
      sections.push(section);
    }
  }
  
  // Also look for common patterns like "u/s 68"
  const usPattern = /u\/s\.?\s*(\d+[A-Za-z]?)/gi;
  while ((match = usPattern.exec(text)) !== null) {
    const section = `Section ${match[1]}`;
    if (!sections.includes(section)) {
      sections.push(section);
    }
  }
  
  return sections.slice(0, 5); // Return max 5 sections
}

// Parse date from India Kanoon format or extract year
function parseDate(docsource: string): string {
  // Try to extract date from docsource which typically contains court and date info
  const dateMatch = docsource.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  
  if (dateMatch) {
    const months: Record<string, string> = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    const day = dateMatch[1].padStart(2, '0');
    const month = months[dateMatch[2].toLowerCase()];
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Try to extract just year
  const yearMatch = docsource.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return `${yearMatch[0]}-01-01`;
  }
  
  return new Date().toISOString().split('T')[0];
}

// Parse court from docsource
function parseCourt(docsource: string): string {
  const lowerSource = docsource.toLowerCase();
  
  if (lowerSource.includes('supreme court')) return 'Supreme Court';
  if (lowerSource.includes('delhi high court')) return 'Delhi High Court';
  if (lowerSource.includes('bombay high court')) return 'Bombay High Court';
  if (lowerSource.includes('calcutta high court')) return 'Calcutta High Court';
  if (lowerSource.includes('madras high court')) return 'Madras High Court';
  if (lowerSource.includes('high court')) return 'High Court';
  if (lowerSource.includes('itat')) return 'ITAT';
  if (lowerSource.includes('tribunal')) return 'Tribunal';
  
  return docsource.split(',')[0] || 'Unknown';
}

// Transform India Kanoon response to our format
function transformResults(docs: any[], baseRelevance: number = 100): SearchResult[] {
  return docs.map((doc, index) => {
    const title = doc.title?.replace(/<[^>]*>/g, '') || 'Untitled';
    const headline = doc.headline?.replace(/<[^>]*>/g, '') || '';
    const docsource = doc.docsource || '';
    
    return {
      id: String(index + 1),
      docId: String(doc.tid || doc.docid || index),
      citation: title.length > 80 ? `${title.substring(0, 80)}...` : title,
      title: title,
      court: parseCourt(docsource),
      date: parseDate(docsource),
      snippet: headline.length > 300 ? `${headline.substring(0, 300)}...` : headline,
      relevance: Math.max(50, baseRelevance - (index * 3)), // Decrease relevance by position
      sections: extractSections(title, headline),
      url: `https://indiankanoon.org/doc/${doc.tid || doc.docid}/`
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    if (authError) {
      return authError;
    }

    console.log(`Authenticated user: ${user.email}`);

    const { query, filters = {} } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate query length
    if (query.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Query exceeds maximum length of 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const INDIA_KANOON_API_KEY = Deno.env.get('INDIA_KANOON_API_KEY');
    
    if (!INDIA_KANOON_API_KEY) {
      console.error('INDIA_KANOON_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'India Kanoon API key not configured. Please add your API key in Settings.',
          results: [],
          totalResults: 0,
          attribution: "Powered by India Kanoon"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching India Kanoon for: "${query}" with filters:`, filters);

    // Build the search query with filters
    let formInput = query;
    
    // Add doctype filter
    const docTypes = getDocTypes(filters.court);
    if (docTypes) {
      formInput += ` doctypes:${docTypes}`;
    }
    
    // Add date filters
    if (filters.fromYear) {
      formInput += ` fromdate:01-01-${filters.fromYear}`;
    }
    if (filters.toYear) {
      formInput += ` todate:31-12-${filters.toYear}`;
    }

    const pagenum = filters.pagenum || 0;
    
    // Build the API URL
    const searchUrl = `${INDIA_KANOON_API_URL}/search/?formInput=${encodeURIComponent(formInput)}&pagenum=${pagenum}`;
    
    console.log(`Calling India Kanoon API: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INDIA_KANOON_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('India Kanoon API error:', response.status, errorText);
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid API key or authentication failed',
            results: [],
            totalResults: 0,
            attribution: "Powered by India Kanoon"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`India Kanoon API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`India Kanoon returned ${data.docs?.length || 0} results`);

    // Transform the results
    const results = transformResults(data.docs || [], 98);
    const totalResults = data.found ? parseInt(data.found.replace(/[^0-9]/g, '')) : results.length;

    return new Response(
      JSON.stringify({
        query: query,
        filters,
        results,
        totalResults,
        pagenum,
        found: data.found,
        attribution: "Powered by India Kanoon"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
        totalResults: 0,
        attribution: "Powered by India Kanoon"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
