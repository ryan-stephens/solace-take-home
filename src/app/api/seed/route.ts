import db from "../../../db";
import { advocates } from "@/db/schema";
import { advocateData } from "@/db/seed/advocates";

export async function POST() {
  try {
    const records = await db.insert(advocates).values(advocateData).returning();

    return Response.json({
      success: true,
      message: `Successfully seeded ${records.length} advocate records`,
      advocates: records
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return Response.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
