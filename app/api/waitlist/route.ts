// app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { fullName, email, phone, roleIntent } = await request.json();

    if (!fullName || !email || !phone || !roleIntent) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("waitlist")
      .insert({
        full_name: fullName,
        email: email,
        phone: phone,
        role_intent: roleIntent,
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already registered on our waitlist!" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}