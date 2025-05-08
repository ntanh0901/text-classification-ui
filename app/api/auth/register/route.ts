import { NextRequest } from "next/server";
import { dbConnect, User } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response("Invalid email format", { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return new Response("Password must be at least 6 characters long", {
        status: 400,
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return new Response("An account with this email already exists", {
        status: 400,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    await User.create({
      email,
      password: hashedPassword,
    });

    return new Response("Account created successfully", { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response("An error occurred during registration", {
      status: 500,
    });
  }
}
