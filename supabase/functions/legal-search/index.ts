import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// India Kanoon API base URL (they don't have a formal API, but we can search their site)
// We'll simulate a search API using their search endpoint structure
const INDIA_KANOON_SEARCH_URL = 'https://indiankanoon.org/search/';

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

// Mock search results based on common Indian tax law cases
// In production, this would call India Kanoon's API or scrape their results
function getMockSearchResults(query: string, filters: SearchFilters): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  
  const allResults: SearchResult[] = [
    {
      id: "1",
      docId: "1947381",
      citation: "CIT vs. Lovely Exports (P) Ltd [2008] 216 CTR 195 (SC)",
      title: "Share Application Money - Section 68 - Identity of Shareholders - Burden of Proof",
      court: "Supreme Court",
      date: "2008-01-15",
      snippet: "Where the assessee has received subscriptions to share capital and has furnished complete particulars of the share applicants including their PAN, the initial onus to prove the identity of creditors stands discharged. It is then for the Assessing Officer to proceed further in the matter.",
      relevance: 98,
      sections: ["Section 68", "Section 69"],
      url: "https://indiankanoon.org/doc/1947381/"
    },
    {
      id: "2",
      docId: "191165",
      citation: "Pr. CIT vs. NRA Iron & Steel [2019] 412 ITR 161 (SC)",
      title: "Section 68 - Three Ingredients - Identity, Creditworthiness, Genuineness",
      court: "Supreme Court",
      date: "2019-03-05",
      snippet: "The assessee is under a legal obligation to prove the receipt of share capital/premium to the satisfaction of the AO, failure of which, the AO is entitled to treat the same as income of the assessee. The three ingredients of Section 68 are identity, creditworthiness, and genuineness of the transaction.",
      relevance: 95,
      sections: ["Section 68"],
      url: "https://indiankanoon.org/doc/191165/"
    },
    {
      id: "3",
      docId: "1627622",
      citation: "CIT vs. Orissa Corporation (P) Ltd [1986] 159 ITR 78 (SC)",
      title: "Burden of Proof in Income Tax - Foundational Principles",
      court: "Supreme Court",
      date: "1986-08-12",
      snippet: "The onus of proving that a particular receipt is not taxable or is exempt from tax rests on the assessee who claims exemption. This principle has been consistently followed in income tax proceedings.",
      relevance: 88,
      sections: ["General Principles"],
      url: "https://indiankanoon.org/doc/1627622/"
    },
    {
      id: "4",
      docId: "89721453",
      citation: "DCIT vs. Rohini Builders [2023] 152 ITD 234 (Mum)",
      title: "Bogus Purchases - Estimation of Profit - 12.5% GP Rate",
      court: "ITAT Mumbai",
      date: "2023-07-20",
      snippet: "Where purchases are found to be from non-genuine parties but corresponding sales are not disputed, the entire purchase amount cannot be disallowed. Only profit element embedded in such purchases can be added. A rate of 12.5% gross profit is reasonable.",
      relevance: 85,
      sections: ["Section 69C", "Bogus Purchases"],
      url: "https://indiankanoon.org/doc/89721453/"
    },
    {
      id: "5",
      docId: "171298",
      citation: "CIT vs. Calcutta Discount Co Ltd [1973] 91 ITR 1 (SC)",
      title: "Cash Credits - Burden of Proof - Initial Onus",
      court: "Supreme Court",
      date: "1973-09-15",
      snippet: "When a person is shown to have advanced money, one has necessarily to conclude that the amount belonged to him. The burden is on the Revenue to show that the amount did not belong to the person who advanced it.",
      relevance: 82,
      sections: ["Section 68", "Cash Credits"],
      url: "https://indiankanoon.org/doc/171298/"
    },
    {
      id: "6",
      docId: "92345123",
      citation: "PCIT vs. Abhisar Buildwell (P) Ltd [2023] 454 ITR 212 (SC)",
      title: "Reassessment - Section 148 - Validity of Notice",
      court: "Supreme Court",
      date: "2023-04-24",
      snippet: "In case of search assessments, no addition can be made unless there is incriminating material found during search. The Revenue cannot make additions based on information available prior to search.",
      relevance: 80,
      sections: ["Section 148", "Section 153A"],
      url: "https://indiankanoon.org/doc/92345123/"
    },
    {
      id: "7",
      docId: "1674185",
      citation: "Vodafone International Holdings BV vs. UOI [2012] 341 ITR 1 (SC)",
      title: "Capital Gains - Transfer - Indirect Transfer of Assets",
      court: "Supreme Court",
      date: "2012-01-20",
      snippet: "The transaction of sale of shares in a foreign company having underlying assets in India cannot be taxed in India as capital gains. The Revenue has to look at the transaction as a whole and not just at its form.",
      relevance: 75,
      sections: ["Section 9", "Capital Gains"],
      url: "https://indiankanoon.org/doc/1674185/"
    },
    {
      id: "8",
      docId: "87654321",
      citation: "Malabar Industrial Co Ltd vs. CIT [2000] 243 ITR 83 (SC)",
      title: "Revision by CIT - Section 263 - Erroneous Order Prejudicial to Revenue",
      court: "Supreme Court",
      date: "2000-02-10",
      snippet: "For invoking Section 263, two conditions must be satisfied: the order must be erroneous and it must be prejudicial to the interests of the Revenue. Both conditions are cumulative and not alternative.",
      relevance: 72,
      sections: ["Section 263"],
      url: "https://indiankanoon.org/doc/87654321/"
    }
  ];

  // Filter results based on query
  let results = allResults.filter(r => {
    const searchText = `${r.citation} ${r.title} ${r.snippet} ${r.sections.join(' ')}`.toLowerCase();
    const queryTerms = lowerQuery.split(/\s+/).filter(t => t.length > 2);
    return queryTerms.some(term => searchText.includes(term));
  });

  // Apply court filter
  if (filters.court && filters.court !== 'all') {
    const courtMap: Record<string, string> = {
      'sc': 'Supreme Court',
      'hc': 'High Court',
      'itat': 'ITAT'
    };
    const courtFilter = courtMap[filters.court] || filters.court;
    results = results.filter(r => r.court.toLowerCase().includes(courtFilter.toLowerCase()));
  }

  // Apply year filter
  if (filters.fromYear) {
    results = results.filter(r => {
      const year = parseInt(r.date.split('-')[0]);
      return year >= filters.fromYear!;
    });
  }

  if (filters.toYear) {
    results = results.filter(r => {
      const year = parseInt(r.date.split('-')[0]);
      return year <= filters.toYear!;
    });
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  // Return top 10 results
  return results.slice(0, 10);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters = {} } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for: "${query}" with filters:`, filters);

    // Get mock search results
    // In production, this would call India Kanoon's API
    const results = getMockSearchResults(query, filters);

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({
        query,
        filters,
        results,
        totalResults: results.length,
        attribution: "Powered by India Kanoon"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
