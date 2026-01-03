import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { SourcePanel } from "@/components/research/SourcePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, History, PanelRightClose, PanelRight } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { id: number; citation: string; paragraph?: number }[];
  timestamp: string;
  confidence?: "high" | "medium" | "low";
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to LegalRAG. I can help you research case law, analyze judgments, and draft legal documents. Ask me about any tax litigation issue, and I'll provide citations from relevant judgments.\n\nFor example, you could ask:\n• What are the principles for addition under Section 68?\n• Find judgments on bogus purchase additions\n• Explain the burden of proof in reassessment cases",
    timestamp: "10:00 AM",
  },
];

const mockSources = [
  {
    id: "1",
    citation: "CIT vs. Lovely Exports (P) Ltd [2008] 216 CTR 195 (SC)",
    title:
      "Supreme Court on Cash Credits u/s 68 - Identity, Creditworthiness and Genuineness",
    court: "Supreme Court",
    date: "2008",
    relevance: 95,
    isBookmarked: true,
  },
  {
    id: "2",
    citation: "Pr. CIT vs. NRA Iron & Steel [2019] 412 ITR 161 (SC)",
    title: "Burden of Proof on Assessee in Section 68 Cases - Three Conditions",
    court: "Supreme Court",
    date: "2019",
    relevance: 92,
  },
  {
    id: "3",
    citation: "DCIT vs. Rohini Builders [2023] ITAT Mumbai",
    title: "Estimation of Profit on Bogus Purchases - 12.5% GP Addition",
    court: "ITAT Mumbai",
    date: "2023",
    relevance: 88,
  },
  {
    id: "4",
    citation: "CIT vs. Orissa Corporation (P) Ltd [1986] 159 ITR 78 (SC)",
    title: "Principle of Onus in Income Tax - Foundational Case",
    court: "Supreme Court",
    date: "1986",
    relevance: 75,
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [activeSourceId, setActiveSourceId] = useState<string>();

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

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on my analysis of relevant judgments, here are the key principles regarding your query:\n\n**Section 68 - Cash Credits**\n\nThe Hon'ble Supreme Court in CIT vs. Lovely Exports [1] established that where the assessee furnishes the complete details of shareholders including their PAN, the initial onus stands discharged.\n\nHowever, in the later decision of Pr. CIT vs. NRA Iron & Steel [2], the Supreme Court clarified that the assessee must prove three ingredients:\n1. Identity of the creditor\n2. Creditworthiness of the creditor\n3. Genuineness of the transaction\n\nThe ITAT Mumbai in DCIT vs. Rohini Builders [3] applied these principles to bogus purchase cases, holding that where purchases are not verifiable but sales are accepted, only the profit element (12.5% GP) can be added.\n\n**Recommendation**: For your case, ensure documentation of all three ingredients is available. If dealing with share capital, bank statements of subscribers along with their returns would strengthen the position.`,
        citations: [
          {
            id: 1,
            citation: "CIT vs. Lovely Exports (P) Ltd [2008] 216 CTR 195 (SC)",
            paragraph: 12,
          },
          {
            id: 2,
            citation: "Pr. CIT vs. NRA Iron & Steel [2019] 412 ITR 161 (SC)",
            paragraph: 28,
          },
          {
            id: 3,
            citation: "DCIT vs. Rohini Builders [2023] ITAT Mumbai",
            paragraph: 45,
          },
        ],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        confidence: "high",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
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
              <span className="text-sm font-medium">New Research Session</span>
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
              {isLoading && (
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
              sources={mockSources}
              activeSourceId={activeSourceId}
              onSourceClick={(source) => setActiveSourceId(source.id)}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
