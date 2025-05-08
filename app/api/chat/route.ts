"use server";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbConnect, Chat, IChat, IMessage } from "@/lib/mongodb";
import { bot } from "@/lib/bot";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as { id?: string })?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const { userPrompt, chatId } = await request.json();
  await dbConnect();

  // Find or create the chat for this user
  let chat: IChat | null = null;
  if (chatId) {
    // Only try to find if chatId is provided and is a valid ObjectId
    try {
      chat = await Chat.findOne({
        _id: chatId,
        userId: (session.user as { id: string }).id,
      });
    } catch {
      // ignore invalid ObjectId errors
    }
  }
  if (!chat) {
    chat = await Chat.create({
      userId: (session.user as { id: string }).id,
      title: "New Chat",
      messages: [],
    });
  }
  if (!chat) {
    return new Response(
      JSON.stringify({ error: "Chat not found or created" }),
      { status: 500 }
    );
  }

  // Only add a message if userPrompt is not empty
  if (userPrompt && userPrompt.trim() !== "") {
    const userMessage: IMessage = {
      from: "USER",
      content: userPrompt,
      timestamp: new Date(),
    };
    chat.messages.push(userMessage);

    // Generate bot response
    let botResponse = "";
    for await (const chunk of bot(userPrompt, String(chat._id))) {
      botResponse += typeof chunk === "string" ? chunk : "";
    }
    if (botResponse.trim() !== "") {
      chat.messages.push({
        from: "ASSISTANT",
        content: botResponse,
        timestamp: new Date(),
      });
    }
  }

  await chat.save();

  // Respond as before (or with the updated chat)
  return new Response(JSON.stringify(chat), { status: 200 });
}

function iteratorToSSEStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        const data = { content: value };
        const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(sseMessage);
      }
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as { id?: string })?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  await dbConnect();
  const chats = await Chat.find({
    userId: (session.user as { id: string }).id,
  });
  return new Response(JSON.stringify(chats), { status: 200 });
}
