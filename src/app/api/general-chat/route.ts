import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || !question.trim()) {
      return new Response("Missing or empty question", { status: 400 });
    }

    const gemini = new ChatGoogleGenerativeAI({
      model: "models/gemini-2.0-flash", // Or use pro model if needed
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    const response = await gemini.invoke(`You are a helpful and knowledgeable assistant.

The user asked: ${question}

Answer:`);
    
    return NextResponse.json({ answer: response.content });

  } catch (error) {
    console.error("Error in general-chat API:", error);
    return NextResponse.json({
      answer: "An error occurred while processing your request."
    }, { status: 500 });
  }
}