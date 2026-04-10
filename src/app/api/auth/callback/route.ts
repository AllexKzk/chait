import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { clearAnonId, syncUserAndMigrateAnonChat } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/security";

const otpTypeSchema = z.enum(["signup", "email"]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeRedirectPath(searchParams.get("next"));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Handle PKCE code exchange (OAuth or magic link)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const anonId = cookieStore.get("anon_id")?.value ?? null;
    await syncUserAndMigrateAnonChat(data.user.id, data.user.email!, anonId);
    await clearAnonId();

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle email confirmation via token_hash
  if (tokenHash && type) {
    const parsedType = otpTypeSchema.safeParse(type);
    if (!parsedType.success) {
      return NextResponse.redirect(`${origin}/login?error=verification_failed`);
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: parsedType.data,
    });

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=verification_failed`);
    }

    const anonId = cookieStore.get("anon_id")?.value ?? null;
    await syncUserAndMigrateAnonChat(data.user.id, data.user.email!, anonId);
    await clearAnonId();

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=missing_params`);
}
