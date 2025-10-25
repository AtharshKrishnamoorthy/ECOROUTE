#!/usr/bin/env node

/**
 * EcoRoute Session Diagnostic Script
 * Run this to check your authentication setup
 * 
 * Usage: node scripts/diagnose-auth.js
 */

console.log('\n🔍 EcoRoute Session Diagnostic Tool\n');
console.log('=' .repeat(50));

// Check 1: Environment Variables
console.log('\n✓ Checking environment variables...');
const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (hasSupabaseUrl && hasSupabaseKey) {
  console.log('  ✅ Supabase environment variables are set');
  console.log(`  📍 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`  🔑 Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
} else {
  console.log('  ❌ Missing Supabase environment variables!');
  console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅' : '❌'}`);
  console.log('\n  Fix: Copy .env.example to .env.local and add your credentials');
}

// Check 2: File Structure
console.log('\n✓ Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/lib/auth-context.tsx',
  'src/lib/supabase.ts',
  'src/components/providers.tsx',
  'src/app/layout.tsx',
  'src/app/dashboard/main/layout.tsx',
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (MISSING!)`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n  Fix: Some required files are missing. Check the SESSION-DEEP-DIVE.md guide.');
}

// Check 3: Dependencies
console.log('\n✓ Checking dependencies...');
const packageJson = require(path.join(process.cwd(), 'package.json'));
const requiredDeps = {
  '@supabase/supabase-js': 'required',
  'next': 'required',
  'react': 'required',
};

Object.entries(requiredDeps).forEach(([dep, _]) => {
  const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  if (version) {
    console.log(`  ✅ ${dep}: ${version}`);
  } else {
    console.log(`  ❌ ${dep} (NOT INSTALLED!)`);
  }
});

// Check 4: Auth Context Implementation
console.log('\n✓ Checking auth context implementation...');
const authContextPath = path.join(process.cwd(), 'src/lib/auth-context.tsx');
if (fs.existsSync(authContextPath)) {
  const authContext = fs.readFileSync(authContextPath, 'utf-8');
  
  const checks = [
    { pattern: /let hasNavigated = false/, desc: 'Navigation guard' },
    { pattern: /storageKey: 'ecoroute-auth-token'/, desc: 'Custom storage key (via supabase.ts)' },
    { pattern: /const \[initialized, setInitialized\] = useState/, desc: 'Initialization tracking' },
    { pattern: /\], \[router\]\);/, desc: 'Correct useEffect dependencies' },
  ];
  
  checks.forEach(check => {
    // Special handling for storage key check - check both files
    if (check.desc.includes('storage key')) {
      const supabasePath = path.join(process.cwd(), 'src/lib/supabase.ts');
      const supabaseContent = fs.existsSync(supabasePath) 
        ? fs.readFileSync(supabasePath, 'utf-8') 
        : '';
      if (check.pattern.test(authContext) || check.pattern.test(supabaseContent)) {
        console.log(`  ✅ ${check.desc}`);
      } else {
        console.log(`  ⚠️  ${check.desc} (may need update)`);
      }
    } else if (check.pattern.test(authContext)) {
      console.log(`  ✅ ${check.desc}`);
    } else {
      console.log(`  ⚠️  ${check.desc} (may need update)`);
    }
  });
}

// Check 5: Provider Setup
console.log('\n✓ Checking provider setup...');
const rootLayoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
if (fs.existsSync(rootLayoutPath)) {
  const rootLayout = fs.readFileSync(rootLayoutPath, 'utf-8');
  
  if (rootLayout.includes('<Providers>')) {
    console.log('  ✅ Providers wrapper in root layout');
  } else {
    console.log('  ❌ Providers wrapper missing in root layout');
    console.log('     Fix: Add <Providers> wrapper in src/app/layout.tsx');
  }
  
  if (rootLayout.includes('from "@/components/providers"')) {
    console.log('  ✅ Providers component imported');
  } else {
    console.log('  ❌ Providers component not imported');
  }
}

// Check 6: Duplicate AuthProviders
console.log('\n✓ Checking for duplicate AuthProviders...');
const layoutsToCheck = [
  'src/app/dashboard/auth/layout.tsx',
  'src/app/dashboard/main/layout.tsx',
];

let foundDuplicates = false;
layoutsToCheck.forEach(layoutPath => {
  const fullPath = path.join(process.cwd(), layoutPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes('<AuthProvider>')) {
      console.log(`  ❌ Duplicate AuthProvider found in ${layoutPath}`);
      console.log(`     Fix: Remove AuthProvider from this file (should only be in root)`);
      foundDuplicates = true;
    } else {
      console.log(`  ✅ ${layoutPath} (no duplicate)`);
    }
  }
});

if (!foundDuplicates) {
  console.log('  ✅ No duplicate AuthProviders found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Diagnostic Summary\n');

if (hasSupabaseUrl && hasSupabaseKey && allFilesExist && !foundDuplicates) {
  console.log('✅ All checks passed! Your authentication setup looks good.\n');
  console.log('If you\'re still experiencing issues:');
  console.log('1. Clear browser localStorage and cookies');
  console.log('2. Restart the dev server: npm run dev');
  console.log('3. Check browser console for error messages');
  console.log('4. View SESSION-DEEP-DIVE.md for advanced troubleshooting\n');
} else {
  console.log('⚠️  Some issues were found. Please fix the items marked with ❌ above.\n');
  console.log('For detailed fixes, see SESSION-DEEP-DIVE.md\n');
}

console.log('💡 Quick Commands:');
console.log('   npm run dev          - Start development server');
console.log('   npm run build        - Build for production');
console.log('   npm run lint         - Check for code issues\n');
