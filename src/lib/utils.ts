import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateEnvironmentVariables() {
  const required = [
    "GOOGLE_API_KEY",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
  ];

  for (const variable of required){
    if(!process.env[variable]){
      throw new Error(`Environment Variables Not Find : ${variable} `)
    }
  }
}