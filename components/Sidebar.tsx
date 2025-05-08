import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export type ChatHistory = {
  id: string;
  title: string;
  timestamp: Date;
};

type SidebarProps = {
  selectedChatId: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  chatHistory: ChatHistory[];
};

export function Sidebar({
  selectedChatId,
  onChatSelect,
  onNewChat,
  chatHistory,
}: SidebarProps) {
  const { data: session } = useSession();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Text Classification
        </h2>
        <p className="text-sm text-gray-600">
          Analyze text sentiment and intent
        </p>
      </div>

      <div className="flex-grow overflow-y-auto">
        {chatHistory.length > 0 ? (
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center space-x-2 ${
                  selectedChatId === chat.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex-grow truncate">{chat.title}</span>
                <span className="text-xs text-gray-500">
                  {chat.timestamp.toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-4">
            No chat history yet
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Chat</span>
        </button>

        {/* Auth Section */}
        {session?.user && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex flex-col items-start space-y-2">
              <span className="text-xs text-gray-600">
                Signed in as{" "}
                <span className="font-semibold">{session.user.email}</span>
              </span>
              <button
                onClick={() => signOut()}
                className="text-red-600 text-xs hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
