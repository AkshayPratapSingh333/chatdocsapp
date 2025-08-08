"use client";

import { Card } from "@/components/ui/card";
import { useCallback, useState } from "react";
import { Loader2, FileText, Upload, Sparkles } from "lucide-react";
import { useDropzone } from "react-dropzone";
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
import { ChatInterface } from "@/components/chat-interface";
import { DocumentMetadata } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [currentDocument, setCurrentDocument] = useState<DocumentMetadata>();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setError("");
      setUploadProgress(true);
      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed while uploading file");
      }
      const data = await response.json();
      setSummary(data.summary);

      const newDoc: DocumentMetadata = {
        id: data.documentID,
        filename: acceptedFiles[0].name,
        uploadedAt: new Date(),
        summary: data.summary,
        pageCount: data.pageCount,
        fileSize: acceptedFiles[0].size,
      };
      setDocuments((prev) => [...prev, newDoc]);
      setCurrentDocument(newDoc);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unidentified Error Occurred"
      );
    } finally {
      setUploadProgress(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/docx": [".docx"],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
  });

  const handleMessage = async (
    message: string,
    documentID?: string
  ): Promise<string> => {
    try {
      setLoading(true);

      const endpoint = documentID ? "/api/question" : "/api/general-chat";

      const requestBody = documentID
        ? { question: message, documentID }
        : { question: message };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to Send Query");
      }

      const data = await response.json();
      return data.answer || "Sorry, I couldn't process your request.";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unidentified Error";
      setError(errorMessage);
      return `Error: ${errorMessage}`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-teal-950">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-blue-200 dark:border-teal-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-teal-500 dark:to-cyan-500 rounded-xl shadow-lg">
              <FileText className="size-8 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 dark:from-cyan-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Docs Assistant
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <Card className="p-4 mb-6 bg-gradient-to-br from-white/80 via-blue-50/60 to-cyan-50/60 dark:from-slate-800/90 dark:via-blue-900/30 dark:to-teal-900/30 border-blue-200 dark:border-teal-700 shadow-lg shadow-blue-100/50 dark:shadow-teal-900/20 backdrop-blur-sm">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? "border-cyan-500 dark:border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 scale-105 shadow-lg"
                    : "border-teal-300 dark:border-teal-600 bg-gradient-to-br from-slate-50/50 to-emerald-50/50 dark:from-slate-700/50 dark:to-teal-800/30 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md"
                }`}
              >
                <input {...getInputProps()} />
                {uploadProgress ? (
                  <div className="flex flex-col justify-center items-center gap-4">
                    <div className="relative">
                      <Loader2 className="animate-spin size-6 text-cyan-600 dark:text-cyan-400" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        Processing Document
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Please wait while we analyze your file...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-800/50 dark:to-cyan-800/50 rounded-full">
                      <Upload className="size-6 text-teal-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Drag and Drop Files Here
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Or click to select • PDF files up to 20MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {error && (
              <Card className="p-4 mb-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-red-100 dark:bg-red-800/50 rounded-full">
                    <div className="size-3 bg-red-500 rounded-full"></div>
                  </div>
                  <p className="text-red-700 dark:text-red-300 font-medium">
                    {error}
                  </p>
                </div>
              </Card>
            )}

            {summary && (
              <Card className="p-6 mb-8 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/60 dark:from-slate-800/90 dark:via-emerald-900/20 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-700 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 rounded-lg shadow-md">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Document Summary
                  </h2>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="h-64 overflow-y-auto bg-white/60 dark:bg-slate-700/50 rounded-lg border border-emerald-200 dark:border-emerald-800 scroll-smooth">
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed p-4">
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
                        {summary.trim()}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex">
            <ChatInterface
              onSendMessage={handleMessage}
              loading={loading}
              currentDocument={currentDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}