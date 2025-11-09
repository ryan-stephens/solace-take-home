import { sql } from "drizzle-orm";
import db from "../../../db";
import { advocates } from "../../../db/schema";

export async function POST() {
  try {
    console.log("🗑️  Clearing advocates table...");
    
    // Delete all records from advocates table
    await db.delete(advocates);
    
    // Reset the auto-increment sequence
    await db.execute(sql`ALTER SEQUENCE advocates_id_seq RESTART WITH 1`);
    
    console.log("✅ Database cleared successfully!");
    
    return Response.json({
      success: true,
      message: "All advocate records have been deleted and ID sequence reset",
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return Response.json(
      { 
        error: "Failed to clear database",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
