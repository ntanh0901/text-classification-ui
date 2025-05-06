import * as tf from "@tensorflow/tfjs";
import { ChatHistory } from "@/lib/chatHistory";

// Pre-defined food categories and keywords
const foodCategories = {
  fruits: [
    "apple",
    "banana",
    "orange",
    "grape",
    "strawberry",
    "blueberry",
    "peach",
  ],
  vegetables: ["carrot", "broccoli", "spinach", "potato", "tomato", "cucumber"],
  grains: ["rice", "pasta", "bread", "cereal", "oats", "quinoa"],
  proteins: ["chicken", "beef", "fish", "eggs", "tofu", "beans", "lentils"],
  dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
  desserts: ["cake", "cookie", "ice cream", "pie", "chocolate"],
};

// Simple food extractor function
function extractFoodItems(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foods: string[] = [];

  // Check each category and word
  Object.values(foodCategories)
    .flat()
    .forEach((food) => {
      if (lowerText.includes(food) && !foods.includes(food)) {
        foods.push(food);
      }
    });

  return foods;
}

export async function* bot(
  userPrompt: string,
  chatHistory: ChatHistory,
  chatId: string
) {
  // Extract food items from the user prompt
  const foodItems = extractFoodItems(userPrompt);

  chatHistory.add(chatId, "USER", userPrompt);

  // Generate response based on food items
  let response = "I'm a helpful assistant for food and cooking. ";

  if (foodItems.length > 0) {
    response += `I noticed you mentioned ${foodItems.join(", ")}. `;

    // Add some context based on the food items
    if (foodItems.some((food) => foodCategories["fruits"].includes(food))) {
      response += "Fruits are excellent for snacks and desserts. ";
    }
    if (foodItems.some((food) => foodCategories["vegetables"].includes(food))) {
      response += "Remember to include vegetables for a balanced meal. ";
    }
    // Add more customized responses as needed
  }

  response += "How can I help with your cooking or food questions today?";

  // Simulate streaming response
  const words = response.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise((resolve) => setTimeout(resolve, 50)); // Delay for streaming effect
  }

  chatHistory.add(chatId, "ASSISTANT", response);
}
