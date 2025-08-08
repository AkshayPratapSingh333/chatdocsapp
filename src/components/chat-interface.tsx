import { ChatMessage, DocumentMetadata } from "@/lib/types";
import { useState } from "react";
import { Card } from "./ui/card";
import { FileSearch, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Input } from "./ui/input";
import { SendHorizontal } from "lucide-react";
import Markdown from "react-markdown";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkEmoji from "remark-emoji";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

interface ChatInterfaceProps {
  onSendMessage: (message: string, documentID?: string) => Promise<string>;
  loading: boolean;
  currentDocument?: DocumentMetadata;
}

export function ChatInterface({
  onSendMessage,
  loading,
  currentDocument,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
      documentID: currentDocument?.id || null, // Allow null for general questions
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    //Response from model - pass documentID only if document exists
    const aiResponse = await onSendMessage(input, currentDocument?.id);

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      documentID: currentDocument?.id || null, // Allow null for general questions
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <Card className="w-[45rem] h-[600px] flex flex-col bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-teal-900/20 border-blue-200 dark:border-teal-700 shadow-lg shadow-blue-100/50 dark:shadow-teal-900/20">
      {currentDocument ? (
        <div className="p-3 border-b border-blue-200 dark:border-teal-700 flex items-center justify-between bg-gradient-to-r from-blue-100/80 via-cyan-100/60 to-emerald-100/80 dark:from-slate-800/90 dark:via-blue-800/40 dark:to-teal-800/40 backdrop-blur-sm">
          <div className="flex items-center mt-2 mb-2 gap-2">
            <FileSearch className="size-4 text-teal-600 dark:text-cyan-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {currentDocument.filename}
            </span>
          </div>
          {messages.length > 0 && (
            <Button
              onClick={clearHistory}
              className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Clear History
            </Button>
          )}
        </div>
      ) : (
        <div className="p-3 border-b border-blue-200 dark:border-teal-600 bg-gradient-to-r from-blue-100/80 via-cyan-100/60 to-emerald-100/80 dark:from-slate-800/90 dark:via-blue-800/40 dark:to-teal-800/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center mt-2 mb-2 gap-2">
              <MessageCircle className="size-4 text-teal-600 dark:text-cyan-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                General Chat
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                AI Assistant
              </span>
            </div>
            {messages.length > 0 && (
              <Button
                onClick={clearHistory}
                className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear History
              </Button>
            )}
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 p-2 overflow-y-auto bg-gradient-to-b from-transparent via-blue-25/30 to-teal-25/30 dark:from-transparent dark:via-slate-900/50 dark:to-blue-950/30">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <div className="text-2xl mb-2">👋</div>
                <p className="text-sm">
                  {currentDocument
                    ? `Ask questions about ${currentDocument.filename}`
                    : "Ask me anything!"}
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } `}
            >
              <div
                className={`max-w-[100%] rounded-lg p-3 shadow-md transition-all hover:shadow-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-200 dark:shadow-blue-900/30"
                    : "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 shadow-emerald-200 dark:shadow-teal-900/30"
                }`}
              >
                <Markdown
                  remarkPlugins={[
                    remarkGfm,
                    remarkMath,
                    remarkParse,
                    remarkEmoji,
                  ]}
                  rehypePlugins={[
                    rehypeKatex,
                    rehypeHighlight,
                    rehypeSanitize,
                    rehypeStringify,
                    rehypeSlug,
                    rehypeAutolinkHeadings,
                  ]}
                >
                  {message.content}
                </Markdown>
                <div
                  className={`text-xs mt-1 opacity-75 flex items-center gap-1 ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.documentID && (
                    <span className="ml-1 px-1 py-0.5 bg-black/10 rounded text-xs">
                      📄
                    </span>
                  )}
                  {!message.documentID && message.role === "assistant" && (
                    <span className="ml-1 px-1 py-0.5 bg-black/10 rounded text-xs">
                      🤖
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-blue-200 dark:border-teal-700 bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-emerald-50/80 dark:from-slate-800/90 dark:via-blue-800/30 dark:to-teal-800/30 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              currentDocument
                ? `Ask about ${currentDocument.filename}...`
                : "Ask me anything..."
            }
            disabled={loading}
            className="border-teal-200 dark:border-teal-600 focus:border-cyan-400 dark:focus:border-cyan-500 bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 placeholder:text-teal-500 dark:placeholder:text-teal-400 shadow-sm focus:shadow-md transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-700 dark:hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}