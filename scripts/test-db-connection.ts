#!/usr/bin/env ts-node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");
    
    // Try a simple query
    const boardCount = await prisma.board.count();
    console.log(`✅ Database is accessible. Current boards: ${boardCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
