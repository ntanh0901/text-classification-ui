"use server";

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect, Chat, IChat, IMessage, User } from "@/lib/mongodb";
import { bot } from "@/lib/bot";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { userPrompt, chatId } = await request.json();
  await dbConnect();

  // Find the user first
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  // Find or create the chat for this user
  let chat: IChat | null = null;
  if (chatId) {
    try {
      chat = await Chat.findOne({
        _id: chatId,
        userId: user._id,
      });
    } catch {
      // ignore invalid ObjectId errors
    }
  }
  if (!chat) {
    chat = await Chat.create({
      userId: user._id,
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
  const session = await getServerSession();
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  await dbConnect();

  // Find the user first
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const chats = await Chat.find({
    userId: user._id,
  }).sort({ createdAt: -1 }); // Sort by newest first

  return new Response(JSON.stringify(chats), { status: 200 }); //
}
