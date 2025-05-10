"use client";

import { useState, useEffect, useRef } from "react";
import { useEnterSubmit } from "@/lib/hooks/useEnterSubmit";
import { sb } from "substrate";
import { SendIcon } from "@/components/icons/SendIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { SubstrateIcon } from "@/components/icons/SubstrateIcon";
import { Sidebar, type ChatHistory } from "@/components/Sidebar";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "next-auth/react";

type SubstrateStream = Awaited<ReturnType<typeof sb.streaming.fromSSEResponse>>;

type MessageItem =
  | { from: "USER"; content: string; timestamp: Date }
  | {
      from: "ASSISTANT";
      content: string;
      timestamp: Date;
      isStreaming?: boolean;
    };

type ChatState = {
  messages: MessageItem[];
  title: string;
};

type ModelType = 1 | 2; // 1 for ViT5, 2 for PhoBERT

const CATEGORIES = [
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

function GuideMessage() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-blue-800 mb-2">
        How to use this chat:
      </h3>
      <ul className="list-disc list-inside space-y-2 text-blue-700">
        <li>Select a model (ViT5 or PhoBERT) from the top buttons</li>
        <li>Enter any Vietnamese text to classify</li>
        <li>
          The AI will analyze and categorize your text into one of these
          categories:
        </li>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {CATEGORIES.map((category) => (
            <div key={category} className="bg-white rounded px-3 py-1 text-sm">
              {category}
            </div>
          ))}
        </div>
      </ul>
    </div>
  );
}

function UserMessage({
  content,
  timestamp,
}: {
  content: string;
  timestamp: Date;
}) {
  return (
    <div className="flex flex-row space-x-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <UserIcon />
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-gray-700">You</div>
          <div className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-gray-800 whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

function AIMessage({
  content,
  timestamp,
  isStreaming,
}: {
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}) {
  const [displayContent, setDisplayContent] = useState(content);

  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  return (
    <div className="flex flex-row space-x-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <SubstrateIcon />
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-gray-700">AI Assistant</div>
          <div className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-gray-800 prose prose-sm max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{displayContent}</Markdown>
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const { data: session, status } = useSession();
  const { formRef, onKeyDown } = useEnterSubmit();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [chats, setChats] = useState<Record<string, ChatState>>({});
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(2); // Default to PhoBERT
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats[selectedChatId]?.messages]);

  // Fetch chats from MongoDB when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/chat", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const chatsFromDb = Array.isArray(data) ? data : [];
          const chatMap: Record<string, ChatState> = {};
          const chatHist: ChatHistory[] = [];

          for (const chat of chatsFromDb) {
            chatMap[chat._id] = { messages: chat.messages, title: chat.title };
            chatHist.push({
              id: chat._id,
              title: chat.title,
              timestamp: new Date(chat.createdAt),
            });
          }
          setChats(chatMap);
          setChatHistory(chatHist);
          if (chatHist.length > 0) setSelectedChatId(chatHist[0].id);
        })
        .catch((error) => {
          console.error("Error fetching chats:", error);
        });
    }
  }, [status]);

  // Create a new chat in MongoDB
  const handleNewChat = async () => {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const chat = await res.json();
      setChats((prev) => ({
        ...prev,
        [chat._id]: { messages: chat.messages, title: chat.title },
      }));
      setChatHistory((prev) => [
        {
          id: chat._id,
          title: chat.title,
          timestamp: new Date(chat.createdAt),
        },
        ...prev,
      ]);
      setSelectedChatId(chat._id);
      setUserPrompt("");
    }
  };

  // Select a chat
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    setUserPrompt("");
  };

  // Send a message and update chat in MongoDB
  async function submitPrompt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userPrompt.trim() || isProcessing || !selectedChatId) return;

    setIsProcessing(true);

    try {
      const request = new Request("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: selectedChatId,
          userPrompt,
          modelType: selectedModel,
        }),
      });
      const response = await fetch(request);

      if (response.ok) {
        const chat = await response.json();
        setChats((prev) => ({
          ...prev,
          [chat._id]: { messages: chat.messages, title: chat.title },
        }));
        setChatHistory((prev) =>
          prev.map((c) =>
            c.id === chat._id
              ? { ...c, timestamp: new Date(chat.createdAt) }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUserPrompt("");
      setIsProcessing(false);
    }
  }

  const currentChat = chats[selectedChatId];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        selectedChatId={selectedChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
      />

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col">
        {/* Model Switch Button */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex justify-end">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  selectedModel === 1
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border border-gray-200`}
                onClick={() => setSelectedModel(1)}
                disabled={isProcessing}
              >
                ViT5
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  selectedModel === 2
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border border-gray-200`}
                onClick={() => setSelectedModel(2)}
                disabled={isProcessing}
              >
                PhoBERT
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {!selectedChatId || !currentChat?.messages.length ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center text-gray-500 mb-8">
                <h3 className="text-lg font-medium mb-2">
                  Welcome to Vietnamese Text Classification
                </h3>
                <p className="text-sm">
                  Select a model and enter some Vietnamese text to analyze its
                  category.
                </p>
              </div>
              <GuideMessage />
            </div>
          ) : (
            <>
              {currentChat.messages.map((message, i) =>
                message.from === "USER" ? (
                  <UserMessage
                    key={i}
                    content={message.content}
                    timestamp={new Date(message.timestamp)}
                  />
                ) : (
                  <AIMessage
                    key={i}
                    content={message.content}
                    timestamp={new Date(message.timestamp)}
                    isStreaming={message.isStreaming}
                  />
                )
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            ref={formRef}
            onSubmit={submitPrompt}
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              <input
                name="prompt"
                autoFocus={true}
                placeholder="Enter Vietnamese text to analyze..."
                value={userPrompt}
                onChange={(event) => setUserPrompt(event.target.value)}
                type="text"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={onKeyDown}
                disabled={isProcessing || !selectedChatId}
              />
              <button
                type="submit"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg ${
                  isProcessing || !selectedChatId
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
                disabled={isProcessing || !selectedChatId}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
