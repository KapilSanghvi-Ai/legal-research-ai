import { User, Bot, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Citation {
  id: number;
  citation: string;
  paragraph?: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp?: string;
  confidence?: "high" | "medium" | "low";
}

export function ChatMessage({
  role,
  content,
  citations = [],
  timestamp,
  confidence,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse content for citation references like [1], [2]
  const renderContent = () => {
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationNum = parseInt(match[1]);
        return (
          <button
            key={index}
            className="citation-badge mx-0.5 hover:scale-105 transition-transform"
            title={citations.find((c) => c.id === citationNum)?.citation}
          >
            {citationNum}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-4 animate-fade-in",
        role === "user" ? "bg-secondary/30" : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          role === "user" ? "bg-primary" : "bg-accent"
        )}
      >
        {role === "user" ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-accent-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {role === "user" ? "You" : "Legal AI"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
          {confidence && role === "assistant" && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                confidence === "high" && "bg-success/15 text-success",
                confidence === "medium" && "bg-warning/15 text-warning",
                confidence === "low" && "bg-destructive/15 text-destructive"
              )}
            >
              {confidence} confidence
            </span>
          )}
        </div>

        <div className="text-sm text-foreground/90 leading-relaxed legal-body">
          {renderContent()}
        </div>

        {/* Citations List */}
        {citations.length > 0 && role === "assistant" && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Sources
            </p>
            <div className="space-y-1.5">
              {citations.map((citation) => (
                <div
                  key={citation.id}
                  className="flex items-center gap-2 text-xs group cursor-pointer"
                >
                  <span className="citation-badge">{citation.id}</span>
                  <span className="text-primary hover:underline">
                    {citation.citation}
                  </span>
                  {citation.paragraph && (
                    <span className="text-muted-foreground">
                      ¶{citation.paragraph}
                    </span>
                  )}
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {role === "assistant" && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3 h-3 mr-1.5" />
              ) : (
                <Copy className="w-3 h-3 mr-1.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
