import mongoose, { Document, Model, Schema, Types } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI)
  throw new Error("Please define the MONGODB_URI environment variable");

export async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String, // For demo only; use hashing in production!
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

export interface IMessage {
  from: string;
  content: string;
  timestamp: Date;
  modelType?: number; // 1 for ViT5, 2 for PhoBERT
  classification?: {
    result: string;
    confidence?: number;
  };
}

export interface IChat extends Document {
  userId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  from: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
  modelType: { type: Number, enum: [1, 2], required: false }, // 1 for ViT5, 2 for PhoBERT
  classification: {
    result: { type: String, required: false },
    confidence: { type: Number, required: false },
  },
});

const ChatSchema = new Schema<IChat>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  messages: { type: [MessageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
