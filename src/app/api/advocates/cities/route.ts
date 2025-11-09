import { sql } from "drizzle-orm";
import db from "../../../../db";
import { advocates } from "../../../../db/schema";

export async function GET() {
  try {
    // Get distinct cities from the database, ordered alphabetically
    const result = await db
      .selectDistinct({ city: advocates.city })
      .from(advocates)
      .orderBy(advocates.city);

    const cities = result.map((row) => row.city);

    return Response.json({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return Response.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
