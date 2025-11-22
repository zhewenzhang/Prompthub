import { GoogleGenAI } from "@google/genai";
import { Role, Scenario } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const optimizePromptWithGemini = async (
  rawPrompt: string,
  role: Role,
  scenario: Scenario
): Promise<string> => {
  const client = getClient();
  if (!client) {
    throw new Error("API Key not configured");
  }

  const systemInstruction = `You are an expert Prompt Engineer specializing in LLM optimization. 
  Your goal is to rewrite user drafts into high-performance, structured prompts using best practices (Chain of Thought, clear delimiters, persona adoption).`;

  const userContent = `
  I need you to optimize a prompt for an LLM.
  
  CONTEXT INFORMATION:
  - Target Persona (Role): ${role.name} (${role.description})
  - Specific Scenario: ${scenario.title} (${scenario.goal})
  
  DRAFT PROMPT:
  "${rawPrompt}"
  
  INSTRUCTIONS:
  1. Analyze the draft against the persona and scenario.
  2. Rewrite the prompt to be more effective, precise, and robust.
  3. Maintain the original intent but improve clarity and structure.
  4. Return ONLY the optimized prompt text. Do not add conversational filler.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Failed to generate optimization.";
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    throw error;
  }
};

export const generateIdeasForScenario = async (role: Role): Promise<Array<{title: string, goal: string}>> => {
   const client = getClient();
  if (!client) return [];

  const prompt = `Based on the persona "${role.name}" (${role.description}), suggest 3 distinct, useful scenarios where an AI could assist. 
  Return the result as a JSON array of objects with 'title' and 'goal' keys.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if(!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error(e);
    return [];
  }
}
