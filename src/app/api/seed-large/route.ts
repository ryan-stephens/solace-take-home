import { seedLargeDataset } from "@/db/seed/generateLargeDataset";

export async function POST(request: Request) {
  try {
    // Parse request body to get count (optional)
    const body = await request.json().catch(() => ({}));
    const count = body.count || 5000;
    
    // Validate count
    if (count < 1 || count > 100000) {
      return Response.json(
        { error: "Count must be between 1 and 100,000" },
        { status: 400 }
      );
    }
    
    console.log(`Starting large dataset seed with ${count} records...`);
    
    // Generate and insert records
    const data = await seedLargeDataset(count);
    
    return Response.json({
      success: true,
      message: `Successfully seeded ${count} advocate records`,
      count: data.length,
    });
  } catch (error) {
    console.error("Error seeding large dataset:", error);
    return Response.json(
      { 
        error: "Failed to seed large dataset",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
