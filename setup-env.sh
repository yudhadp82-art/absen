#!/bin/bash

echo "========================================="
echo "Setup Supabase Environment Variables"
echo "========================================="
echo ""
echo "Instructions:"
echo "1. Open your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → API"
echo "4. Copy the Project URL and Anon Key"
echo ""
echo "Press Enter to continue..."
read

echo -n "Enter SUPABASE_URL: "
read SUPABASE_URL

echo -n "Enter SUPABASE_ANON_KEY: "
read SUPABASE_ANON_KEY

echo ""
echo "Adding to main app (absen)..."
vercel env add SUPABASE_URL "$SUPABASE_URL" --scope yudhadp82s-projects -y <<EOF
absen
EOF

vercel env add SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" --scope yudhadp82s-projects -y <<EOF
absen
EOF

echo ""
echo "Adding to admin dashboard..."
vercel env add SUPABASE_URL "$SUPABASE_URL" --scope yudhadp82s-projects -y <<EOF
admin
EOF

vercel env add SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" --scope yudhadp82s-projects -y <<EOF
admin
EOF

echo ""
echo "✅ Environment variables added successfully!"
echo "Please deploy both projects:"
echo "  cd /d/absen && vercel --prod"
echo "  cd admin/admin && vercel --prod"
