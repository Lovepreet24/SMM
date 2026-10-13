
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookies may be read-only in this context.
          }
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Please log in first." },
      { status: 401 }
    );
  }

  let body: {
    serviceId?: number;
    targetUrl?: string;
    quantity?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const serviceId = Number(body.serviceId);
  const quantity = Number(body.quantity);
  const targetUrl =
    typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";

  if (
    !Number.isInteger(serviceId) ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !/^https?:\/\/\S+$/i.test(targetUrl)
  ) {
    return NextResponse.json(
      { error: "Enter a valid service, URL and quantity." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("place_smm_order", {
    p_service_id: serviceId,
    p_target_url: targetUrl,
    p_quantity: quantity,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: data,
  });
}
