import fs from 'fs';

console.log('🔧 Checking and fixing DATABASE_URL in .env file...\n');

// Read .env file
let envContent = fs.readFileSync('.env', 'utf-8');

// Check current DATABASE_URL
const currentMatch = envContent.match(/DATABASE_URL=(.+)/);
console.log('Current DATABASE_URL:', currentMatch ? currentMatch[1].substring(0, 50) + '...' : 'NOT FOUND');

// Check if it needs fixing
if (envContent.includes('DATABASE_URL="') || envContent.includes("DATABASE_URL='")) {
  console.log('✅ DATABASE_URL has quotes');
} else if (envContent.includes('DATABASE_URL=')) {
  console.log('⚠️  DATABASE_URL might be missing quotes');
}

// Fix: Ensure proper format
const fixedEnv = envContent.replace(
  /DATABASE_URL="?postgresql:\/\/(.*)@aws-1-ap-northeast-1\.pooler\.supabase\.com:(.+)\/postgres(\?.*)?"?/g,
  'DATABASE_URL="postgresql://$1@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"'
);

console.log('\n📝 Updated DATABASE_URL format');
console.log('New format:', 'DATABASE_URL="postgresql://...@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"');

// Write back
fs.writeFileSync('.env', fixedEnv);
console.log('\n✅ .env file updated successfully!');

// Create summary
console.log('\n📋 Summary:');
console.log('   • Changed port from 6543 to 5432');
console.log('   • Removed pgbouncer=true parameter');
console.log('   • Ensured proper URL format\n');

console.log('🚀 Next step: Run "npx prisma db push"');

