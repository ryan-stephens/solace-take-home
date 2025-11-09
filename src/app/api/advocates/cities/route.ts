import db from "../../../../db";
import { advocates } from "@/db/schema";

export async function GET() {
  try {
    // Get all cities from the database
    const result = await db
      .select({ city: advocates.city })
      .from(advocates);

    // Extract unique cities and sort alphabetically
    const cities = Array.from(new Set(result.map((row: { city: string }) => row.city))).sort();

    return Response.json({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return Response.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
