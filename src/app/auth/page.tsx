"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ArrowLeft } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    (searchParams.get("type") as Mode) || "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const supabase = getSupabaseBrowser();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(
          "Check your email for a confirmation link, or sign in if email confirmation is disabled.",
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Sync user to our DB
        await fetch("/api/auth/sync", {
          method: "POST",
          cache: "no-store",
        });
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-3 left-3"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="w-full max-w-sm flex flex-col gap-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            CH<i>AI</i>T
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === "signin"
              ? "Sign in to your account"
              : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
          {mode === "signin" ? (
            <Button
              variant="ghost"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccess(null);
              }}
              className="w-full"
            >
              Sign up
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccess(null);
              }}
              className="w-full"
            >
              Sign in
            </Button>
          )}
        </form>
      </div>
    </main>
  );
}
