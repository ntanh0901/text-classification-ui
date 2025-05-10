import * as tf from "@tensorflow/tfjs";
import { ChatHistory } from "@/lib/chatHistory";
import { Chat, IMessage } from "@/lib/mongodb";
import { dbConnect } from "@/lib/mongodb";

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

// API response labels (without diacritics)
const API_LABELS = [
  "Chinh tri Xa hoi",
  "Doi song",
  "Khoa hoc",
  "Kinh doanh",
  "Phap luat",
  "Suc khoe",
  "The gioi",
  "The thao",
  "Van hoa",
  "Vi tinh",
];

// Display labels (with diacritics)
const DISPLAY_LABELS = [
  "Chính trị Xã hội",
  "Đời sống",
  "Khoa học",
  "Kinh doanh",
  "Pháp luật",
  "Sức khỏe",
  "Thế giới",
  "Thể thao",
  "Văn hóa",
  "Vi tính",
];

// Mapping between API labels and display labels
const LABEL_MAPPING: Record<string, string> = {
  "Chinh tri Xa hoi": "Chính trị Xã hội",
  "Doi song": "Đời sống",
  "Khoa hoc": "Khoa học",
  "Kinh doanh": "Kinh doanh",
  "Phap luat": "Pháp luật",
  "Suc khoe": "Sức khỏe",
  "The gioi": "Thế giới",
  "The thao": "Thể thao",
  "Van hoa": "Văn hóa",
  "Vi tinh": "Vi tính",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Chính trị Xã hội": "Politics and Society",
  "Đời sống": "Lifestyle",
  "Khoa học": "Science",
  "Kinh doanh": "Business",
  "Pháp luật": "Law",
  "Sức khỏe": "Health",
  "Thế giới": "World",
  "Thể thao": "Sports",
  "Văn hóa": "Culture",
  "Vi tính": "Technology",
};

export async function* bot(
  userPrompt: string,
  chatId: string,
  modelType: number = 2
) {
  try {
    // Call the API endpoint for classification
    const response = await fetch(
      process.env.NEXT_PUBLIC_CLASSIFICATION_API_URL ||
        "https://text-classification.tuan-anh-sd.software/api/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: userPrompt,
          model_type: modelType,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Classification API request failed");
    }

    const data = await response.json();
    const modelName = modelType === 1 ? "ViT5" : "PhoBERT";
    const apiCategory = data.result;
    const displayCategory = LABEL_MAPPING[apiCategory] || apiCategory;
    const categoryDescription =
      CATEGORY_DESCRIPTIONS[displayCategory] || displayCategory;

    // Construct a more conversational response
    const responseMessage = `I've analyzed your text using the ${modelName} model. Based on the content, this text belongs to the "${displayCategory}" category (${categoryDescription}).\n\nWould you like to try another text or switch to a different model?`;

    // Simulate streaming by yielding one word at a time
    const words = responseMessage.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error("Error in bot function:", error);
    yield "I apologize, but I encountered an error while processing your request. Please try again or switch to a different model.";
  }
}
