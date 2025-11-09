import { sql } from "drizzle-orm";
import { ilike, or } from "drizzle-orm";
import db from "../../../db";
import { advocates } from "../../../db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const search = searchParams.get("search") || "";
  
  // Sorting parameters
  const sortBy = searchParams.get("sortBy") || "lastName";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  
  // Filter parameters
  const degreeFilters = searchParams.getAll("degrees");
  const cityFilters = searchParams.getAll("cities");
  const minExperience = searchParams.get("minExperience") || "";
  const maxExperience = searchParams.get("maxExperience") || "";
  const specialtyFilters = searchParams.getAll("specialties");

  // Validate pagination parameters
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100); // Max 100 per page
  const offset = (validPage - 1) * validPageSize;
  
  // Validate sort parameters
  const validSortFields = ["firstName", "lastName", "city", "degree", "yearsOfExperience"];
  const validSortBy = validSortFields.includes(sortBy) ? sortBy : "lastName";
  const validSortOrder = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";

  try {
    // Build filter conditions array
    const conditions = [];
    
    // Search condition
    if (search) {
      conditions.push(
        or(
          ilike(advocates.firstName, `%${search}%`),
          ilike(advocates.lastName, `%${search}%`),
          // Support full name search (e.g., "Laura Clark")
          sql`CONCAT(${advocates.firstName}, ' ', ${advocates.lastName}) ILIKE ${`%${search}%`}`,
          ilike(advocates.city, `%${search}%`),
          ilike(advocates.degree, `%${search}%`),
          sql`${advocates.specialties}::text ILIKE ${`%${search}%`}`
        )
      );
    }
    
    // Degree filters (multiple)
    if (degreeFilters.length > 0) {
      // Match advocates that have ANY of the selected degrees (OR logic)
      const degreeConditions = degreeFilters.map(degree =>
        ilike(advocates.degree, degree)
      );
      conditions.push(sql`(${sql.join(degreeConditions, sql` OR `)})`);
    }
    
    // City filters (multiple)
    if (cityFilters.length > 0) {
      // Match advocates in ANY of the selected cities (OR logic)
      const cityConditions = cityFilters.map(city =>
        ilike(advocates.city, city)
      );
      conditions.push(sql`(${sql.join(cityConditions, sql` OR `)})`);
    }
    
    // Experience range filters
    if (minExperience) {
      const minExp = parseInt(minExperience, 10);
      if (!isNaN(minExp)) {
        conditions.push(sql`${advocates.yearsOfExperience} >= ${minExp}`);
      }
    }
    if (maxExperience) {
      const maxExp = parseInt(maxExperience, 10);
      if (!isNaN(maxExp)) {
        conditions.push(sql`${advocates.yearsOfExperience} <= ${maxExp}`);
      }
    }
    
    // Specialty filters (multiple)
    if (specialtyFilters.length > 0) {
      // Match advocates that have AT LEAST ONE of the selected specialties (OR logic)
      const specialtyConditions = specialtyFilters.map(specialty =>
        sql`${advocates.specialties}::text ILIKE ${`%${specialty}%`}`
      );
      conditions.push(sql`(${sql.join(specialtyConditions, sql` OR `)})`);
    }
    
    // Combine all conditions with AND
    const whereConditions = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    // Get total count for pagination metadata
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(advocates)
      .where(whereConditions);
    
    const totalCount = Number(countResult[0]?.count || 0);

    // Build sort order
    const sortColumn = advocates[validSortBy as keyof typeof advocates];
    const orderByClause = validSortOrder === "desc" 
      ? sql`${sortColumn} DESC` 
      : sql`${sortColumn} ASC`;

    // Get paginated data with sorting
    const data = await db
      .select()
      .from(advocates)
      .where(whereConditions)
      .orderBy(orderByClause)
      .limit(validPageSize)
      .offset(offset);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validPageSize);
    const hasNextPage = validPage < totalPages;
    const hasPreviousPage = validPage > 1;

    return Response.json({
      data,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Error fetching advocates:", error);
    return Response.json(
      { error: "Failed to fetch advocates" },
      { status: 500 }
    );
  }
}
