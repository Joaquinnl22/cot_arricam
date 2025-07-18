import { NextResponse } from "next/server";

export async function POST(request) {
  const { user, pass } = await request.json();

  if (
    user === process.env.BASIC_AUTH_USER &&
    pass === process.env.BASIC_AUTH_PASS
  ) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("auth_token", process.env.SECRET_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 años
    });

    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
