import { GoogleGenAI } from "@google/genai";
import { Role, Scenario, AppSettings } from "../types";

export const optimizePromptWithAI = async (
  rawPrompt: string,
  role: Role,
  scenario: Scenario,
  settings: AppSettings
): Promise<string> => {
  
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

  if (settings.aiProvider === 'gemini') {
    return optimizeWithGemini(userContent, systemInstruction, settings);
  } else {
    return optimizeWithSiliconFlow(userContent, systemInstruction, settings);
  }
};

export const generateIdeasWithAI = async (
    role: Role,
    settings: AppSettings
  ): Promise<Array<{title: string, goal: string}>> => {
    
    const prompt = `Based on the persona "${role.name}" (${role.description}), suggest 3 distinct, useful scenarios where an AI could assist. 
    Return the result as a JSON array of objects with 'title' and 'goal' keys. Do not include markdown formatting like \`\`\`json.`;
  
    try {
      let text = "";
      if (settings.aiProvider === 'gemini') {
         const client = getGeminiClient(settings.gemini.apiKey);
         if (!client) throw new Error("Gemini API Key missing");
         
         const response = await client.models.generateContent({
            model: settings.gemini.model || 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
         });
         text = response.text || "";
      } else {
         text = await optimizeWithSiliconFlow(prompt, "You are a creative assistant. Respond in JSON only.", settings);
      }

      // Clean up potential markdown
      const jsonString = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Idea Generation Error:", e);
      return [];
    }
}

// --- Gemini Implementation ---

const getGeminiClient = (apiKey: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const optimizeWithGemini = async (
  userPrompt: string,
  systemInstruction: string,
  settings: AppSettings
): Promise<string> => {
  const client = getGeminiClient(settings.gemini.apiKey);
  if (!client) throw new Error("Gemini API Key is missing. Please configure it in Settings.");

  try {
    const response = await client.models.generateContent({
      model: settings.gemini.model || 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "Failed to generate optimization.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- SiliconFlow (OpenAI Compatible) Implementation ---

const optimizeWithSiliconFlow = async (
    userPrompt: string,
    systemInstruction: string,
    settings: AppSettings
  ): Promise<string> => {
    const apiKey = settings.siliconFlow.apiKey;
    const baseUrl = settings.siliconFlow.baseUrl || "https://api.siliconflow.cn/v1";
    const model = settings.siliconFlow.model || "Qwen/Qwen2.5-7B-Instruct";
  
    if (!apiKey) throw new Error("SiliconFlow API Key is missing. Please configure it in Settings.");
  
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`API Error: ${errData.error?.message || response.statusText}`);
      }
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response content.";
    } catch (error) {
      console.error("SiliconFlow Error:", error);
      throw error;
    }
  };
