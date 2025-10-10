#!/usr/bin/env node

/**
 * Clear Database Script
 * 
 * Deletes all data from all tables in the database.
 * USE WITH CAUTION! This will permanently delete all data.
 * 
 * Usage:
 *   npm run clear-db
 *   or
 *   npx tsx scripts/clear-database.ts
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function confirmAction(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.yellow}⚠️  WARNING: This will DELETE ALL DATA from the database!\n` +
      `Are you sure you want to continue? (yes/no): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function clearDatabase() {
  try {
    log('\n🗑️  Starting database cleanup...', 'blue');

    // Delete in order to respect foreign key constraints
    // (Though cascade delete should handle it, we'll be explicit)

    log('\n📊 Deleting PaymentIntents...', 'magenta');
    const paymentIntentsDeleted = await prisma.paymentIntent.deleteMany();
    log(`   ✓ Deleted ${paymentIntentsDeleted.count} payment intents`, 'green');

    log('\n📦 Deleting Products...', 'magenta');
    const productsDeleted = await prisma.product.deleteMany();
    log(`   ✓ Deleted ${productsDeleted.count} products`, 'green');

    log('\n💰 Deleting Wallet Addresses...', 'magenta');
    const walletsDeleted = await prisma.walletAddress.deleteMany();
    log(`   ✓ Deleted ${walletsDeleted.count} wallet addresses`, 'green');

    log('\n👤 Deleting Users...', 'magenta');
    const usersDeleted = await prisma.user.deleteMany();
    log(`   ✓ Deleted ${usersDeleted.count} users`, 'green');

    log('\n✅ Database cleared successfully!', 'green');
    log('\n📈 Summary:', 'blue');
    log(`   - Users: ${usersDeleted.count}`, 'reset');
    log(`   - Wallet Addresses: ${walletsDeleted.count}`, 'reset');
    log(`   - Products: ${productsDeleted.count}`, 'reset');
    log(`   - Payment Intents: ${paymentIntentsDeleted.count}`, 'reset');
    log(`   - Total: ${usersDeleted.count + walletsDeleted.count + productsDeleted.count + paymentIntentsDeleted.count} records deleted\n`, 'reset');

  } catch (error: any) {
    log('\n❌ Error clearing database:', 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('\n🔍 Database Clear Script', 'blue');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    // Check if running in production
    const isProduction = process.env['NODE_ENV'] === 'production';
    if (isProduction) {
      log('❌ CANNOT RUN IN PRODUCTION ENVIRONMENT!', 'red');
      log('This script is disabled in production for safety.\n', 'red');
      process.exit(1);
    }

    // Confirm action
    const confirmed = await confirmAction();
    
    if (!confirmed) {
      log('\n❌ Operation cancelled by user\n', 'yellow');
      process.exit(0);
    }

    // Clear the database
    await clearDatabase();

  } catch (error: any) {
    log('\n💥 Fatal error:', 'red');
    log(error.message, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

