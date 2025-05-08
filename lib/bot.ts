import * as tf from "@tensorflow/tfjs";
import { ChatHistory } from "@/lib/chatHistory";

// Pre-defined text categories and their keywords
const textCategories = {
  positive: [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "happy",
    "love",
    "fantastic",
    "perfect",
    "best",
  ],
  negative: [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "poor",
    "disappointing",
    "wrong",
    "failed",
  ],
  neutral: [
    "okay",
    "fine",
    "alright",
    "normal",
    "average",
    "regular",
    "standard",
    "typical",
    "usual",
    "common",
  ],
  question: [
    "what",
    "when",
    "where",
    "who",
    "why",
    "how",
    "?",
    "can",
    "could",
    "would",
    "should",
    "is",
    "are",
    "do",
    "does",
  ],
};

// Simple text classifier function
function classifyText(text: string): { category: string; confidence: number } {
  const lowerText = text.toLowerCase();
  let maxMatches = 0;
  let bestCategory = "neutral";

  // Count matches for each category
  Object.entries(textCategories).forEach(([category, keywords]) => {
    const matches = keywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  });

  // Calculate a simple confidence score
  const totalKeywords = Object.values(textCategories).flat().length;
  const confidence = maxMatches / totalKeywords;

  return {
    category: bestCategory,
    confidence: Math.min(confidence * 2, 1), // Scale confidence to be between 0 and 1
  };
}

export async function* bot(userPrompt: string, chatId: string) {
  // Hard-coded response for demo
  const response = `You said: "${userPrompt}". This is a hard-coded bot response.`;
  // Simulate streaming by yielding one word at a time
  const words = response.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
