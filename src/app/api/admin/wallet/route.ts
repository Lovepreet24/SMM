
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const amount = Number(body.amount);
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (
      !email ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000 ||
      !Number.isInteger(amount) ||
      reason.length < 3 ||
      reason.length > 200
    ) {
      return NextResponse.json(
        { error: "Valid email, whole-number amount, and reason required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "admin_test_wallet_credit",
      {
        p_user_email: email,
        p_amount: amount,
        p_reason: reason,
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, result: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
