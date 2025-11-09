import { config as dotenvConfig } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { advocates } from "../schema";

// Load environment variables
dotenvConfig();

// Realistic data pools
const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
  "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
  "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
  "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
  "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra",
  "Frank", "Rachel", "Alexander", "Catherine", "Patrick", "Carolyn", "Jack", "Janet",
  "Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane",
  "Jose", "Virginia", "Adam", "Julie", "Henry", "Joyce", "Nathan", "Victoria",
  "Douglas", "Olivia", "Zachary", "Kelly", "Peter", "Christina", "Kyle", "Lauren",
  "Walter", "Joan", "Ethan", "Evelyn", "Jeremy", "Judith", "Harold", "Megan",
  "Keith", "Cheryl", "Christian", "Andrea", "Roger", "Hannah", "Noah", "Martha",
  "Gerald", "Jacqueline", "Carl", "Frances", "Terry", "Gloria", "Sean", "Ann",
  "Austin", "Teresa", "Arthur", "Kathryn", "Lawrence", "Sara", "Jesse", "Janice",
  "Dylan", "Jean", "Bryan", "Alice", "Joe", "Madison", "Jordan", "Doris",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
  "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
  "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
  "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
  "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",
  "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
  "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham",
  "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant",
  "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray",
  "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "McDonald", "Woods",
  "Washington", "Kennedy", "Wells", "Vargas", "Henry", "Chen", "Freeman", "Webb",
  "Tucker", "Guzman", "Burns", "Crawford", "Olson", "Simpson", "Porter", "Hunter",
];

const cities = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio",
  "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus",
  "San Francisco", "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington",
  "Boston", "El Paso", "Detroit", "Nashville", "Portland", "Memphis", "Oklahoma City",
  "Las Vegas", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno",
  "Sacramento", "Kansas City", "Long Beach", "Mesa", "Atlanta", "Colorado Springs",
  "Virginia Beach", "Raleigh", "Omaha", "Miami", "Oakland", "Minneapolis", "Tulsa",
  "Wichita", "New Orleans", "Arlington", "Cleveland", "Bakersfield", "Tampa", "Aurora",
  "Honolulu", "Anaheim", "Santa Ana", "Corpus Christi", "Riverside", "St. Louis",
];

const degrees = ["MD", "PhD", "PsyD", "MSW", "LCSW", "LMFT", "LPC", "NP"];

const specialties = [
  "Bipolar",
  "LGBTQ",
  "Medication/Prescribing",
  "Suicide History/Attempts",
  "General Mental Health (anxiety, depression, stress, grief, life transitions)",
  "Men's issues",
  "Relationship Issues (family, friends, couple, etc)",
  "Trauma & PTSD",
  "Personality disorders",
  "Personal growth",
  "Substance use/abuse",
  "Pediatrics",
  "Women's issues (post-partum, infertility, family planning)",
  "Chronic pain",
  "Weight loss & nutrition",
  "Eating disorders",
  "Diabetic Diet and nutrition",
  "Coaching (leadership, career, academic and wellness)",
  "Life coaching",
  "Obsessive-compulsive disorders",
  "Neuropsychological evaluations & testing (ADHD testing)",
  "Attention and Hyperactivity (ADHD)",
  "Sleep issues",
  "Schizophrenia and psychotic disorders",
  "Learning disorders",
  "Domestic abuse",
];

// Helper functions
const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomSpecialties = (): string[] => {
  const count = randomInt(1, 5); // 1-5 specialties per advocate
  const selected = new Set<string>();
  
  while (selected.size < count) {
    selected.add(randomItem(specialties));
  }
  
  return Array.from(selected);
};

const generatePhoneNumber = (): number => {
  // Generate a valid 10-digit US phone number
  const areaCode = randomInt(200, 999);
  const prefix = randomInt(200, 999);
  const lineNumber = randomInt(1000, 9999);
  return parseInt(`${areaCode}${prefix}${lineNumber}`);
};

// Generate advocates
export const generateAdvocates = (count: number) => {
  const advocates = [];
  
  for (let i = 0; i < count; i++) {
    advocates.push({
      firstName: randomItem(firstNames),
      lastName: randomItem(lastNames),
      city: randomItem(cities),
      degree: randomItem(degrees),
      specialties: randomSpecialties(),
      yearsOfExperience: randomInt(1, 40),
      phoneNumber: generatePhoneNumber(),
    });
  }
  
  return advocates;
};

// Seed function
export const seedLargeDataset = async (count: number = 5000) => {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please ensure your .env file contains DATABASE_URL."
    );
  }

  console.log(`🌱 Generating ${count} advocate records...`);
  
  const advocateData = generateAdvocates(count);
  
  console.log(`📊 Inserting ${count} records into database...`);
  console.log(`⏳ This may take a minute...`);
  
  // Create database connection
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);
  
  const startTime = Date.now();
  
  // Insert in batches of 500 for better performance
  const batchSize = 500;
  let inserted = 0;
  
  for (let i = 0; i < advocateData.length; i += batchSize) {
    const batch = advocateData.slice(i, i + batchSize);
    await db.insert(advocates).values(batch);
    inserted += batch.length;
    console.log(`✅ Inserted ${inserted}/${count} records...`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`✨ Successfully seeded ${count} advocates in ${duration} seconds!`);
  console.log(`📈 Database now contains ${count} records for testing.`);
  
  // Close the connection
  await queryClient.end();
  
  return advocateData;
};

// Run if executed directly
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 5000;
  
  seedLargeDataset(count)
    .then(() => {
      console.log("🎉 Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error seeding database:", error);
      process.exit(1);
    });
}
