#!/bin/bash
# Script to update DATABASE_URL in .env file to use port 5432 for migrations

echo "🔧 Updating DATABASE_URL in .env file..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy env.example to .env and update it"
    exit 1
fi

# Backup .env
cp .env .env.backup
echo "✅ Backup created: .env.backup"

# Update DATABASE_URL from port 6543 to 5432
sed -i 's/:6543\/postgres.*/:5432\/postgres/g' .env

echo "✅ Updated DATABASE_URL to use port 5432"
echo ""
echo "📋 Next steps:"
echo "   1. Run: npx prisma db push"
echo "   2. Or: npx prisma migrate dev --name init"
echo "   3. Then: npm run prisma:seed"
echo ""

