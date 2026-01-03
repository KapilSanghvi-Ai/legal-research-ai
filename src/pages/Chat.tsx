import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SourcePanel } from "@/components/research/SourcePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, History, PanelRightClose, PanelRight, AlertCircle } from "lucide-react";
import { streamLegalChat, extractCitations, type ChatMessage as ApiChatMessage, type Citation } from "@/lib/api/chat";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
  confidence?: "high" | "medium" | "low";
}

interface Source {
  id: string;
  citation: string;
  title: string;
  court: string;
  date: string;
  relevance: number;
  isBookmarked?: boolean;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to LegalRAG. I can help you research case law, analyze judgments, and draft legal documents. Ask me about any tax litigation issue, and I'll provide citations from relevant judgments.\n\nFor example, you could ask:\n• What are the principles for addition under Section 68?\n• Find judgments on bogus purchase additions\n• Explain the burden of proof in reassessment cases",
    timestamp: "Just now",
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [activeSourceId, setActiveSourceId] = useState<string>();
  const [sources, setSources] = useState<Source[]>([]);
  const { toast } = useToast();

  const handleSend = async (content: string, mode: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare messages for API
    const apiMessages: ApiChatMessage[] = messages
      .filter(m => m.id !== "1") // Skip initial welcome message
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content });

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    try {
      await streamLegalChat(
        apiMessages,
        mode as 'sources-only' | 'balanced' | 'creative' | 'tribunal',
        {
          onDelta: (text) => {
            assistantContent += text;
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === "assistant" && lastMessage.id === assistantId) {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant" as const,
                  content: assistantContent,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ];
            });
          },
          onDone: () => {
            setIsLoading(false);
            // Extract citations from the response
            const citations = extractCitations(assistantContent);
            if (citations.length > 0) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, citations, confidence: "high" as const }
                    : m
                )
              );
              // Add citations as sources
              const newSources: Source[] = citations.map((c, i) => ({
                id: `source-${Date.now()}-${i}`,
                citation: c.citation,
                title: c.citation.split(' - ')[1] || c.citation,
                court: c.citation.includes('(SC)') ? 'Supreme Court' : 
                       c.citation.includes('(HC)') ? 'High Court' : 'ITAT',
                date: c.citation.match(/\[(\d{4})\]/)?.[1] || 'Unknown',
                relevance: 95 - i * 5,
              }));
              setSources((prev) => {
                const existing = new Set(prev.map(s => s.citation));
                const unique = newSources.filter(s => !existing.has(s.citation));
                return [...unique, ...prev].slice(0, 20);
              });
            }
          },
          onError: (error) => {
            setIsLoading(false);
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          },
        }
      );
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Failed to get response",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="AI Research Chat">
      <div className="h-[calc(100vh-56px)] flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Legal Research Session</span>
              <Badge variant="secondary" className="text-xs">
                Tax Litigation
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <History className="w-4 h-4 mr-1.5" />
                History
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSources(!showSources)}
                className="text-muted-foreground"
              >
                {showSources ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} {...message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-4 p-4">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent-foreground animate-pulse-subtle" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Legal AI</span>
                      <span className="text-xs text-muted-foreground">
                        Researching...
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>

        {/* Sources Panel */}
        {showSources && (
          <div className="w-[360px] flex-shrink-0">
            <SourcePanel
              sources={sources}
              activeSourceId={activeSourceId}
              onSourceClick={(source) => setActiveSourceId(source.id)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
