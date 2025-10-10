#!/usr/bin/env node

/**
 * Generate Wallets for User Script
 * 
 * Manually triggers wallet generation for a specific user
 * 
 * Usage:
 *   npm run generate:wallets -- --user=<clerkUserId>
 */

import { WalletService } from '../src/services/wallet/walletService';
import { DEFAULT_CHAINS } from '../src/providers/blockradar/walletIdAndTokenManagement/chainsAndTokensHelpers';
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
  const args = process.argv.slice(2);
  let userId = '';
  
  for (const arg of args) {
    if (arg.startsWith('--user=')) {
      userId = arg.substring('--user='.length);
    }
  }
  
  if (!userId) {
    log('\n❌ Error: User ID is required!', 'red');
    log('\nUsage:', 'yellow');
    log('  npm run generate:wallets -- --user=<clerkUserId>\n', 'reset');
    
    // Show available users
    const users = await prisma.user.findMany({
      select: { clerkUserId: true, uniqueName: true, email: true },
      take: 5
    });
    
    if (users.length > 0) {
      log('Available users:', 'cyan');
      users.forEach(user => {
        log(`  ${user.clerkUserId} (${user.uniqueName || user.email})`, 'reset');
      });
      log('', 'reset');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
  
  try {
    log(`\n🔍 Generating wallets for user: ${userId}\n`, 'blue');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });
    
    if (!user) {
      log(`❌ User not found: ${userId}\n`, 'red');
      process.exit(1);
    }
    
    log(`✓ User found: ${user.uniqueName || user.email || user.clerkUserId}`, 'green');
    
    // Check existing wallets
    const existingWallets = await prisma.walletAddress.findMany({
      where: { userId: user.clerkUserId }
    });
    
    if (existingWallets.length > 0) {
      log(`\n⚠️  User already has ${existingWallets.length} wallet(s):`, 'yellow');
      existingWallets.forEach(w => {
        log(`   ${w.chain}: ${w.address}`, 'reset');
      });
      log('\nSkipping generation (wallets already exist)\n', 'yellow');
      process.exit(0);
    }
    
    log(`\n🔄 Generating multi-chain wallets...`, 'cyan');
    log(`   Chains: ${DEFAULT_CHAINS.join(', ')}`, 'reset');
    
    const wallets = await WalletService.generateMultiChainWallets(
      user.clerkUserId,
      user.clerkUserId,
      DEFAULT_CHAINS
    );
    
    log(`\n✅ Successfully generated ${wallets.length} wallet(s)!\n`, 'green');
    
    wallets.forEach(wallet => {
      log(`   ${wallet.chain}: ${wallet.address}`, 'cyan');
    });
    
    log('', 'reset');
    
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

