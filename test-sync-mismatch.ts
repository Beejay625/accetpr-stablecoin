import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Sync with Status Mismatch\n');
  console.log('This simulates a missed webhook scenario\n');

  // Find an existing payment intent
  const paymentIntents = await prisma.paymentIntent.findMany({
    take: 1,
    orderBy: { createdAt: 'desc' }
  });

  if (paymentIntents.length === 0) {
    console.log('❌ No payment intents found in database');
    console.log('   Please create a payment intent first');
    process.exit(1);
  }

  const paymentIntent = paymentIntents[0]!;
  
  console.log('📋 Found Payment Intent:');
  console.log('   Payment Intent ID:', paymentIntent.paymentIntentId);
  console.log('   Client Secret:', paymentIntent.clientSecret);
  console.log('   Current DB Status:', paymentIntent.status);
  console.log('');

  // Simulate a missed webhook by manually changing status to SUCCEEDED
  // (even though Stripe might have a different status)
  console.log('🔧 Simulating missed webhook...');
  console.log('   Manually setting DB status to SUCCEEDED (fake status)');
  
  await prisma.paymentIntent.update({
    where: { id: paymentIntent.id },
    data: { status: 'SUCCEEDED' }
  });

  console.log('   ✓ Database updated with wrong status\n');

  // Verify database status
  const updatedIntent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntent.id }
  });

  console.log('📊 Current State:');
  console.log('   DB Status:', updatedIntent?.status);
  console.log('   (Stripe probably has different status)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Now call the sync endpoint to auto-correct:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`curl -X POST 'http://localhost:3000/api/v1/public/payment/intent/sync' \\`);
  console.log(`  -H 'Content-Type: application/json' \\`);
  console.log(`  -d '{`);
  console.log(`    "clientSecret": "${paymentIntent.clientSecret}"`);
  console.log(`  }'`);
  console.log('');

  console.log('Expected behavior:');
  console.log('  1. Sync fetches status from Stripe');
  console.log('  2. Compares with DB status (SUCCEEDED)');
  console.log('  3. Finds mismatch');
  console.log('  4. Updates DB to match Stripe');
  console.log('  5. Returns synced status');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

