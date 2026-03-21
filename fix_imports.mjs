import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const replacements = [
  {
    from: /import\s+{\s*useWallet\s*}\s+from\s+['"]@\/contexts\/WalletContext['"]/g,
    to: "import { useAlgorandWallet as useWallet } from '@/contexts/AlgorandWalletContext'"
  },
  {
    from: /import\s+{\s*WalletProvider\s*}\s+from\s+['"]@\/contexts\/WalletContext['"]/g,
    to: "import { AlgorandWalletProvider as WalletProvider } from '@/contexts/AlgorandWalletContext'"
  },
  {
    from: /from\s+['"]@\/config\/network['"]/g,
    to: "from '@/config/walletConfig'"
  }
];

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    for (const { from, to } of replacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return false;
}

function processDirectory(dir) {
  const files = readdirSync(dir);
  let count = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.old')) {
      count += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!file.includes('.old') && processFile(filePath)) {
        count++;
      }
    }
  }

  return count;
}

console.log('🔧 Fixing imports...\n');
const fixed = processDirectory('./frontend/src');
console.log(`\n✅ Fixed ${fixed} files`);
