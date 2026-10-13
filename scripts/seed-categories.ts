import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import type { CategoryKind } from "../src/types/database";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

if (process.env.NODE_ENV === "production") {
  console.error("REFUSED: Category seeding script must not be executed in production.");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("REFUSED: Missing Supabase credentials in .env.local.");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedCategory {
  kind: CategoryKind;
  name: string;
  slug: string;
  sort_order: number;
}

const seedData: SeedCategory[] = [
  // Branches
  { kind: "branch", name: "Computer Science and Engineering (CSE)", slug: "cse", sort_order: 1 },
  { kind: "branch", name: "Information Science and Engineering (ISE)", slug: "ise", sort_order: 2 },
  { kind: "branch", name: "CSE (AI and Machine Learning)", slug: "cse-aiml", sort_order: 3 },
  { kind: "branch", name: "Electronics and Communication (ECE)", slug: "ece", sort_order: 4 },
  { kind: "branch", name: "Electrical and Electronics (EEE)", slug: "eee", sort_order: 5 },
  { kind: "branch", name: "Mechanical Engineering", slug: "mechanical", sort_order: 6 },
  { kind: "branch", name: "Civil Engineering", slug: "civil", sort_order: 7 },

  // Semesters
  { kind: "semester", name: "1st Semester", slug: "sem-1", sort_order: 1 },
  { kind: "semester", name: "2nd Semester", slug: "sem-2", sort_order: 2 },
  { kind: "semester", name: "3rd Semester", slug: "sem-3", sort_order: 3 },
  { kind: "semester", name: "4th Semester", slug: "sem-4", sort_order: 4 },
  { kind: "semester", name: "5th Semester", slug: "sem-5", sort_order: 5 },
  { kind: "semester", name: "6th Semester", slug: "sem-6", sort_order: 6 },
  { kind: "semester", name: "7th Semester", slug: "sem-7", sort_order: 7 },
  { kind: "semester", name: "8th Semester", slug: "sem-8", sort_order: 8 },

  // Schemes
  { kind: "scheme", name: "2018 Scheme", slug: "2018", sort_order: 1 },
  { kind: "scheme", name: "2021 Scheme", slug: "2021", sort_order: 2 },
  { kind: "scheme", name: "2022 Scheme", slug: "2022", sort_order: 3 },
  { kind: "scheme", name: "2025 Scheme", slug: "2025", sort_order: 4 },

  // Domains
  { kind: "domain", name: "Web Applications", slug: "web", sort_order: 1 },
  { kind: "domain", name: "Mobile Applications", slug: "mobile", sort_order: 2 },
  { kind: "domain", name: "AI and Machine Learning", slug: "ai-ml", sort_order: 3 },
  { kind: "domain", name: "Internet of Things (IoT)", slug: "iot", sort_order: 4 },
  { kind: "domain", name: "Blockchain & Cryptography", slug: "blockchain", sort_order: 5 },
  { kind: "domain", name: "Cybersecurity & Network Defense", slug: "cybersecurity", sort_order: 6 },
  { kind: "domain", name: "Data Science & Analytics", slug: "data-science", sort_order: 7 },
  { kind: "domain", name: "Embedded Systems", slug: "embedded", sort_order: 8 },
  { kind: "domain", name: "Networking & Distributed Systems", slug: "networking", sort_order: 9 },
];

async function seed() {
  console.log("Seeding starting categories into Supabase...");

  let insertedCount = 0;
  for (const item of seedData) {
    const { error } = await adminClient.from("categories").upsert(
      {
        kind: item.kind,
        name: item.name,
        slug: item.slug,
        sort_order: item.sort_order,
      },
      { onConflict: "kind,slug" }
    );

    if (error) {
      console.error(`Error inserting category ${item.kind}:${item.slug}:`, error.message);
    } else {
      insertedCount++;
    }
  }

  console.log(`Successfully seeded ${insertedCount} / ${seedData.length} categories.`);
}

seed().catch((err) => {
  console.error("Seeding script error:", err);
  process.exit(1);
});
