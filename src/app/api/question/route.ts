import {Pinecone} from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { NextResponse } from "next/server";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(req:Request){
    try {
        const {question,documentID} = await req.json();
        if(!question.trim() || !documentID){
            return new Response("Questiona or Document Id Not Found" , {status:400})
        }
        
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "models/embedding-001",
            apiKey: process.env.GOOGLE_API_KEY!,});

        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!); 
        
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings,{
            pineconeIndex:index,
            filter:{documentID}
        });

        const result = await vectorStore.similaritySearch(question,4);
        if(result.length === 0){
            return NextResponse.json({
                answer:"I don't Know the answer of this question "
            });
        }

        const contentText = result.map((r) => r.pageContent).join("\n");
        
         const gemini = new ChatGoogleGenerativeAI({
            model: "models/gemini-2.0-flash",  // for text
            apiKey: process.env.GOOGLE_API_KEY!,
            });

        const prompt = await gemini.invoke (`You are smart general purpose , URL ,  document of any type Summarizer have to understand and summarize the docs , urls and other general questions asked by User

        Context : ${contentText}

        Question: ${question}
        Answer : `);

        const response = prompt.content;
        return NextResponse.json({
            answer:response
        });
    } catch (error) {
        console.error("Error Processing Question ", error);
        return NextResponse.json({
            answer:"An Error Occured while Processing the Question "
        })
        
    }
}