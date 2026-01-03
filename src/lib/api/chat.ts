import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Citation {
  id: number;
  citation: string;
  paragraph?: number;
}

export interface RAGSource {
  id: number;
  citation: string;
  court: string;
  content: string;
  similarity: number;
  sourceId: string;
}

interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
  onRAGSources?: (sources: RAGSource[]) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`;

export async function streamLegalChat(
  messages: ChatMessage[],
  mode: 'sources-only' | 'balanced' | 'creative' | 'tribunal' = 'balanced',
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (response.status === 402) {
        throw new Error('Usage limit reached. Please add credits to your workspace.');
      }
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process line by line
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        // Handle CRLF
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }

        // Skip empty lines and comments
        if (!line || line.startsWith(':')) continue;

        // Skip non-data lines
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        
        // Check for stream end
        if (jsonStr === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Handle RAG sources event
          if (parsed.type === 'rag_sources' && parsed.sources) {
            callbacks.onRAGSources?.(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            callbacks.onDelta(content);
          }
        } catch {
          // Incomplete JSON, put back and wait for more data
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Process any remaining data
    if (buffer.trim()) {
      for (const raw of buffer.split('\n')) {
        if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) callbacks.onDelta(content);
        } catch {
          // Ignore
        }
      }
    }

    callbacks.onDone();
  } catch (error) {
    console.error('Stream error:', error);
    callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

// Extract citations from assistant response
export function extractCitations(content: string): Citation[] {
  const citations: Citation[] = [];
  const citationPattern = /\[(\d+)\]\s*([A-Z][^[\]]+(?:\[\d{4}\][^[\]]+)?(?:\([^)]+\))?)/g;
  
  let match;
  while ((match = citationPattern.exec(content)) !== null) {
    citations.push({
      id: parseInt(match[1]),
      citation: match[2].trim(),
    });
  }
  
  // Also look for citations in a "Sources:" or "Citations:" section
  const sourcesSection = content.match(/(?:Sources|Citations|References):\s*([\s\S]*?)(?:\n\n|$)/i);
  if (sourcesSection) {
    const sourceLines = sourcesSection[1].split('\n');
    for (const line of sourceLines) {
      const lineMatch = line.match(/\[(\d+)\]\s*(.+)/);
      if (lineMatch && !citations.find(c => c.id === parseInt(lineMatch[1]))) {
        citations.push({
          id: parseInt(lineMatch[1]),
          citation: lineMatch[2].trim(),
        });
      }
    }
  }
  
  return citations.sort((a, b) => a.id - b.id);
}

export type { ChatMessage, Citation };
