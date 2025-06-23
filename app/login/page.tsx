import { redirect } from "next/navigation";

export default function LoginPage() {
  // Redirect to the new authentication system
  redirect("/auth/signin");
}
