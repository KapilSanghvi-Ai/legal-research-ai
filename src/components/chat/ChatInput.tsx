import { useState } from "react";
import { Send, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatInputProps {
  onSend: (message: string, mode: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("balanced");

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message, mode);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Textarea
            placeholder="Ask about case law, statutory interpretation, or request document analysis..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="min-h-[80px] resize-none bg-secondary/30 border-border/50 focus:border-primary/30"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4 mr-1.5" />
                Attach
              </Button>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sources-only">Sources Only</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="tribunal">Tribunal Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className="h-10 px-4 bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
