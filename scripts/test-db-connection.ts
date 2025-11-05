import prisma from '../src/prisma/client';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database\n');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    const vaultCount = await prisma.vault.count();
    console.log(`📦 Vaults in database: ${vaultCount}`);

    const policyCount = await prisma.policy.count();
    console.log(`📜 Policies in database: ${policyCount}`);

    const proposalCount = await prisma.proposal.count();
    console.log(`💼 Proposals in database: ${proposalCount}`);

    const auditCount = await prisma.auditEvent.count();
    console.log(`📝 Audit events in database: ${auditCount}\n`);

    console.log('✅ Database connection test completed successfully!\n');

  } catch (error: any) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. DATABASE_URL is set correctly in .env file');
    console.error('2. Database server is running');
    console.error('3. Network connectivity');
    console.error('4. Credentials are correct');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

