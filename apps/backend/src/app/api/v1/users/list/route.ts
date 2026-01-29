import { db } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // In real app: Validate session/project ID headers
    // const projectId = req.headers.get("x-project-id");

    const usersList = await db.query.endUsers.findMany({
      with: {
        identities: true, // Fetch linked identities (Google, Email, etc.)
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      limit: 50, // Pagination later
    });

    // Transform for frontend
    const formattedUsers = usersList.map((user) => {
      const primaryIdentity = user.identities[0];
      return {
        id: user.id,
        email: user.email,
        avatar:
          user.lastLoginPhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
        provider: primaryIdentity?.provider || "email",
        mobile: user.mobile,
        location: user.locationLat ? { lat: user.locationLat, lng: user.locationLng } : null,
        lastSignIn: user.lastSignInAt,
        createdAt: user.createdAt,
        status: "active", // Placeholder
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
