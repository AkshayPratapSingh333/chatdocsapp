import {Pinecone} from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(req:Request){
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if(!file){
            return new Response("No Documents Provided",{status:400});
        }

        //generating the document id 
        const documentID = crypto.randomUUID();

        //convert file to blob
        const blob = new Blob([await file.arrayBuffer()] , {type:file.type});
        console.log(blob.type);

        let loader;
        if(blob.type=='application/pdf'){
            loader = new PDFLoader(blob);
        }else{
            loader= new DocxLoader(blob)
        }
        //Loading and parsing the Docs
        const docs = await loader?.load();

        //Splitting text into Chunks 
        const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize:1000,
                chunkOverlap:200,
            })

        const splitDocs = await textSplitter.splitDocuments(docs);
        
        //Add documentI to Metadata of chunk
        const DocsWithMetadata = splitDocs.map((doc) => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                documentID
            },
        }));

   

        const gemini = new ChatGoogleGenerativeAI({
            model: "models/gemini-2.0-flash",  // for text
            apiKey: process.env.GOOGLE_API_KEY!,
            });
            // console.log("Using model:", gemini.model);
            

        const rawSummaryResponse = await gemini.invoke(
            `You are smart general purpose , URL ,  document of any type Summarizer have to understand and summarize the docs , urls and other general questions asked by User: ${splitDocs[0].pageContent}
            Instructions:
            -Summarize the key points of the following document in a clear, structured format
            -Don't make up any facts from docs just give what is written in documents
            -If information is not available in document just say information is not available 
            -Also mention the line , clause , heading , page number of what you are summarizing etc 
            -Tone should be professional and calm 
            -If the text contains a list, extract and simplify it.
            -You can ask question to you user if you don't understand regarding the query of user 
            -You are summarizing a technical document. Identify the purpose, key components, and functionality described in the content 
            `

        )


         // Extract the string content from the LangChain message object
        const summaryText = rawSummaryResponse.content; // Access the 'content' property

        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "models/embedding-001",
            apiKey: process.env.GOOGLE_API_KEY!,
            });


        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

        await PineconeStore.fromDocuments(DocsWithMetadata,embeddings,{
            pineconeIndex:index
        })

         return NextResponse.json({
            summary: summaryText, // Send only the string content
            documentID,
            pageCount:docs.length
        });

        // return NextResponse.json({
        //     summary,
        //     documenntID,
        //     pageCount:docs.length
        // })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message:"Unidentified Error Occured";
            console.log(errorMessage);
            return new Response(errorMessage,{status:500});
            
        
    }
}