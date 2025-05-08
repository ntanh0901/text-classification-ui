import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { dbConnect, User } from "@/lib/mongodb";
import type { SessionStrategy } from "next-auth";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await dbConnect();
          if (!credentials) return null;
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No account found with this email address");
          }

          // Compare password with hashed password
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) {
            throw new Error("Incorrect password");
          }

          return { id: user._id.toString(), email: user.email };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  session: { strategy: "jwt" as SessionStrategy },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // (optional) custom sign-in page
  },
});

export { handler as GET, handler as POST };
