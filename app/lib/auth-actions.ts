"use server";

import { signIn } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const prisma = new PrismaClient();

// Sign up action
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  // Validate input
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
  });

  const validation = schema.safeParse({ email, password, name });

  if (!validation.success) {
    const errorMessage = encodeURIComponent(
      "Please check your input and try again."
    );
    redirect(`/auth/signup?error=${errorMessage}`);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const errorMessage = encodeURIComponent(
        "User with this email already exists."
      );
      redirect(`/auth/signup?error=${errorMessage}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Sign in the user after successful registration
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Check if it's a redirect error (which is expected behavior)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      // This is expected - signIn successfully redirected
      throw error;
    }

    console.error("Sign up error:", error);
    const errorMessage = encodeURIComponent(
      "Something went wrong. Please try again."
    );
    redirect(`/auth/signup?error=${errorMessage}`);
  }
}

// Credentials sign in action
export async function credentialsSignIn(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // Check if it's a redirect error (which is expected behavior)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      // This is expected - signIn successfully redirected
      throw error;
    }

    const errorMessage = encodeURIComponent(
      "Invalid email or password. Please check your credentials and try again."
    );
    redirect(`/auth/signin?error=${errorMessage}`);
  }
}

// Individual OAuth provider actions
export async function githubSignIn() {
  "use server";
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function microsoftSignIn() {
  "use server";
  await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
}
