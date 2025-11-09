import db from "../../../../db";
import { advocates } from "@/db/schema";

export async function GET() {
  try {
    // Get all degrees from the database
    const result = await db
      .select({ degree: advocates.degree })
      .from(advocates);

    // Extract unique degrees and sort alphabetically
    const degrees = Array.from(new Set(result.map((row: { degree: string }) => row.degree))).sort();

    return Response.json({ degrees });
  } catch (error) {
    console.error("Error fetching degrees:", error);
    return Response.json(
      { error: "Failed to fetch degrees" },
      { status: 500 }
    );
  }
}
