import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config = {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5434/solaceassignment",
  },
  verbose: true,
  strict: true,
};

export default config;
