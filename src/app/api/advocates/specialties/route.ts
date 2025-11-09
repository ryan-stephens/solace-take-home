import db from "../../../../db";
import { advocates } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all specialties arrays from the database
    const result = await db
      .select({ specialties: advocates.specialties })
      .from(advocates);

    // Flatten all specialty arrays and get unique values
    const allSpecialties = result.flatMap((row: { specialties: unknown }) => {
      // Handle the specialties field which is JSONB
      if (Array.isArray(row.specialties)) {
        return row.specialties as string[];
      }
      return [];
    });

    // Get unique specialties and sort alphabetically
    const specialties = Array.from(new Set(allSpecialties)).sort();

    return Response.json({ specialties });
  } catch (error) {
    console.error("Error fetching specialties:", error);
    return Response.json(
      { error: "Failed to fetch specialties" },
      { status: 500 }
    );
  }
}
