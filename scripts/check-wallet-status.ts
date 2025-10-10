#!/usr/bin/env node

/**
 * Check Wallet Status Script
 * 
 * Quick script to check if a user has wallet addresses in the database
 * 
 * Usage:
 *   npm run check:wallets
 */

import { prisma } from '../src/db/prisma';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  try {
    log('\n🔍 Checking Wallet Status...\n', 'blue');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        clerkUserId: true,
        uniqueName: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    if (users.length === 0) {
      log('❌ No users found in database\n', 'red');
      process.exit(0);
    }
    
    log(`Found ${users.length} users:\n`, 'cyan');
    
    for (const user of users) {
      log(`👤 User: ${user.uniqueName || user.email || user.clerkUserId}`, 'cyan');
      log(`   Clerk ID: ${user.clerkUserId}`, 'reset');
      log(`   Created: ${user.createdAt.toISOString()}`, 'reset');
      
      // Check wallet addresses for this user
      const wallets = await prisma.walletAddress.findMany({
        where: {
          userId: user.clerkUserId
        },
        select: {
          chain: true,
          address: true,
          addressId: true,
          createdAt: true
        }
      });
      
      if (wallets.length === 0) {
        log(`   ⚠️  No wallets generated yet`, 'yellow');
      } else {
        log(`   ✅ ${wallets.length} wallet(s) found:`, 'green');
        wallets.forEach(wallet => {
          log(`      → ${wallet.chain}: ${wallet.address.substring(0, 20)}...`, 'reset');
          log(`         Created: ${wallet.createdAt.toISOString()}`, 'reset');
        });
      }
      
      log('', 'reset');
    }
    
    // Overall stats
    const totalWallets = await prisma.walletAddress.count();
    log(`📊 Total wallets in database: ${totalWallets}\n`, 'blue');
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

