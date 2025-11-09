import { sql } from "drizzle-orm";
import db from "../../../../db";
import { advocates } from "../../../../db/schema";

export async function GET() {
  try {
    // Get distinct degrees from the database, ordered alphabetically
    const result = await db
      .selectDistinct({ degree: advocates.degree })
      .from(advocates)
      .orderBy(advocates.degree);

    const degrees = result.map((row) => row.degree);

    return Response.json({ degrees });
  } catch (error) {
    console.error("Error fetching degrees:", error);
    return Response.json(
      { error: "Failed to fetch degrees" },
      { status: 500 }
    );
  }
}
