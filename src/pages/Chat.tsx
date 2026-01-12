import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SourcePanel } from "@/components/research/SourcePanel";
import { RAGSourcesCard, type RAGSource } from "@/components/chat/RAGSourcesCard";
import { ConfidenceMeter } from "@/components/chat/ConfidenceMeter";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { AIResponseLoading } from "@/components/ui/loading-states";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, History, PanelRightClose, PanelRight, Settings2 } from "lucide-react";
import { streamLegalChat, extractCitations, type ChatMessage as ApiChatMessage, type Citation } from "@/lib/api/chat";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  ragSources?: RAGSource[];
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

type ResponseMode = "sources-only" | "balanced" | "creative" | "tribunal";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [activeSourceId, setActiveSourceId] = useState<string>();
  const [sources, setSources] = useState<Source[]>([]);
  const [currentRAGSources, setCurrentRAGSources] = useState<RAGSource[]>([]);
  const [responseMode, setResponseMode] = useState<ResponseMode>("balanced");
  const [loadingSteps, setLoadingSteps] = useState<{ label: string; status: "pending" | "active" | "done" }[]>([]);
  const { toast } = useToast();

  const handleSend = async (content: string, _mode: string) => {
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
    
    // Initialize loading steps
    setLoadingSteps([
      { label: "Retrieving relevant sources", status: "active" },
      { label: "Analyzing legal principles", status: "pending" },
      { label: "Generating response", status: "pending" },
      { label: "Verifying citations", status: "pending" },
    ]);

    // Prepare messages for API
    const apiMessages: ApiChatMessage[] = messages
      .filter(m => m.id !== "1") // Skip initial welcome message
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: "user", content });

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();
    let messageRAGSources: RAGSource[] = [];

    try {
      await streamLegalChat(
        apiMessages,
        responseMode,
        {
          onRAGSources: (sources) => {
            messageRAGSources = sources;
            setCurrentRAGSources(sources);
            // Update loading steps
            setLoadingSteps([
              { label: "Retrieving relevant sources", status: "done" },
              { label: "Analyzing legal principles", status: "active" },
              { label: "Generating response", status: "pending" },
              { label: "Verifying citations", status: "pending" },
            ]);
          },
          onDelta: (text) => {
            // Update loading steps when generation starts
            if (assistantContent === "") {
              setLoadingSteps([
                { label: "Retrieving relevant sources", status: "done" },
                { label: "Analyzing legal principles", status: "done" },
                { label: "Generating response", status: "active" },
                { label: "Verifying citations", status: "pending" },
              ]);
            }
            assistantContent += text;
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === "assistant" && lastMessage.id === assistantId) {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent, ragSources: messageRAGSources } : m
                );
              }
              return [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant" as const,
                  content: assistantContent,
                  ragSources: messageRAGSources,
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
            setLoadingSteps([]);
            // Extract citations from the response
            const citations = extractCitations(assistantContent);
            if (citations.length > 0) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, citations, confidence: "high" as const, ragSources: messageRAGSources }
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
            setLoadingSteps([]);
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
              {/* Mode Selector Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                    <Settings2 className="w-4 h-4" />
                    <span className="capitalize">{responseMode.replace('-', ' ')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <ModeSelector value={responseMode} onChange={setResponseMode} />
                </PopoverContent>
              </Popover>
              
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
              {isLoading && messages[messages.length - 1]?.role === "user" && loadingSteps.length > 0 && (
                <div className="flex gap-4 p-4">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-accent-foreground animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <AIResponseLoading steps={loadingSteps} className="border-0 p-0 bg-transparent" />
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
