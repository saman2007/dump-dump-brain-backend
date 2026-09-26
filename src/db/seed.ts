import "dotenv/config";
import { hash } from "bcrypt";
import * as d from "drizzle-orm";

import db from "./db.js";
import { usersTable } from "./schemas/users.js";
import { usersInfoTable } from "./schemas/usersInfo.js";
import { followsTable } from "./schemas/follows.js";

interface SeedAuthor {
  username: string;
  email: string;
  role?: "user" | "admin";
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  feeling: {
    emoji: string;
    desc: string;
  };
  socialMedias: Record<string, string>;
}

const SEED_PASSWORD_PLAIN = "Password123!";

const SEED_AUTHORS: SeedAuthor[] = [
  {
    username: "alex_rivera",
    email: "alex.rivera@example.com",
    role: "admin",
    displayName: "Alex Rivera",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    banner:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    bio: "Staff Distributed Systems Engineer. Writing about Go internals, PostgreSQL optimization, and high-throughput microservices.",
    feeling: {
      emoji: "⚡",
      desc: "Profiling database latency",
    },
    socialMedias: {
      github: "https://github.com/alexrivera",
      twitter: "https://x.com/alexrivera_dev",
      linkedin: "https://linkedin.com/in/alexrivera",
    },
  },
  {
    username: "sarah_chen",
    email: "sarah.chen@example.com",
    displayName: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    banner:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    bio: "Frontend Architect & Design Systems Lead. Passionate about web standards, CSS subgrid, and building accessible UI components.",
    feeling: {
      emoji: "🎨",
      desc: "Polishing component design tokens",
    },
    socialMedias: {
      github: "https://github.com/sarahchen",
      twitter: "https://x.com/sarahcodes",
      website: "https://sarahchen.design",
    },
  },
  {
    username: "marcus_vance",
    email: "marcus.vance@example.com",
    displayName: "Dr. Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    banner:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    bio: "AI researcher & engineer. Working on autonomous agent architectures, retrieval-augmented generation (RAG), and evaluation frameworks.",
    feeling: {
      emoji: "🧠",
      desc: "Evaluating LLM tool calls",
    },
    socialMedias: {
      github: "https://github.com/marcusvance",
      twitter: "https://x.com/marcus_ai",
      linkedin: "https://linkedin.com/in/marcusvance",
    },
  },
  {
    username: "elena_devops",
    email: "elena.rostova@example.com",
    displayName: "Elena Rostova",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    banner:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    bio: "SRE & Platform Engineer. Kubernetes fanatic, Terraform maintainer, and advocate for zero-downtime canary deployments.",
    feeling: {
      emoji: "🚀",
      desc: "Automating cloud telemetry pipelines",
    },
    socialMedias: {
      github: "https://github.com/elenarostova",
      twitter: "https://x.com/elena_sre",
    },
  },
  {
    username: "david_k",
    email: "david.kim@example.com",
    displayName: "David Kim",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    banner:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    bio: "Indie hacker & full-stack builder. Documenting my journey building developer tools with TypeScript, Node.js, and Postgres.",
    feeling: {
      emoji: "🔥",
      desc: "Shipping v1.2 release notes",
    },
    socialMedias: {
      github: "https://github.com/davidkimdev",
      twitter: "https://x.com/davidk_builds",
      website: "https://davidkim.dev",
    },
  },
];

// Mapping of: followerUsername -> [followingUsernames]
const FOLLOW_RELATIONSHIPS: Record<string, string[]> = {
  alex_rivera: ["sarah_chen", "elena_devops", "david_k"],
  sarah_chen: ["alex_rivera", "david_k"],
  marcus_vance: ["alex_rivera", "david_k"],
  elena_devops: ["alex_rivera", "david_k"],
  david_k: ["alex_rivera", "sarah_chen"],
};

async function seed() {
  console.log("Starting database seeding...");

  const hashedPassword = await hash(SEED_PASSWORD_PLAIN, 10);
  const seedUsernames = SEED_AUTHORS.map((a) => a.username);

  // Clean up existing seed data (Cascade automatically deletes usersInfo and follows)
  console.log("Cleaning up previous seed authors...");
  await db
    .delete(usersTable)
    .where(d.inArray(usersTable.username, seedUsernames));

  // Insert Users and UsersInfo
  console.log("Creating seed users and user info profiles...");
  const userMap = new Map<string, string>(); // username -> userId

  for (const author of SEED_AUTHORS) {
    const [{ id: userId }] = await db
      .insert(usersTable)
      .values({
        email: author.email,
        username: author.username,
        password: hashedPassword,
        role: author.role ?? "user",
        isAccountVerified: true,
        isTwoFactorEnabled: false,
      })
      .returning({ id: usersTable.id });

    userMap.set(author.username, userId);

    await db.insert(usersInfoTable).values({
      userId,
      displayName: author.displayName,
      avatar: author.avatar,
      banner: author.banner,
      bio: author.bio,
      feeling: author.feeling,
      socialMedias: author.socialMedias,
    });
  }

  // Insert Follows Relationships
  const followInserts: { followerId: string; followingId: string }[] = [];

  for (const [followerUsername, followingList] of Object.entries(
    FOLLOW_RELATIONSHIPS,
  )) {
    const followerId = userMap.get(followerUsername);
    if (!followerId) continue;

    for (const targetUsername of followingList) {
      const followingId = userMap.get(targetUsername);
      if (!followingId || followerId === followingId) continue;

      followInserts.push({ followerId, followingId });
    }
  }

  if (followInserts.length > 0) {
    await db.insert(followsTable).values(followInserts);
  }

  console.log("Database seeding completed successfully. Default password for users: Password123!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
