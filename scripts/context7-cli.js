#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  isContext7Configured,
  validateContext7Request,
  executeContext7Request
} = require('../lib/context7-service');

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function printUsage() {
  console.log([
    'Pemakaian:',
    '  npm run context7:resolve -- --library "Next.js" --query "app router caching"',
    '  npm run context7:docs -- --library "Supabase" --query "javascript select rows"',
    '  npm run context7:docs -- --library-id "/vercel/next.js" --query "server actions"',
    '',
    'Flags:',
    '  --library      Nama library untuk dicari',
    '  --library-id   Context7 library ID jika sudah diketahui',
    '  --query        Query dokumentasi',
    '  --mode         resolve | docs'
  ].join('\n'));
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = nextValue;
    index += 1;
  }

  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!isContext7Configured()) {
    console.error('CONTEXT7_API_KEY belum diset. Tambahkan ke .env.local atau shell environment.');
    process.exit(1);
  }

  const payload = validateContext7Request({
    mode: args.mode,
    libraryName: args.library,
    libraryId: args['library-id'],
    query: args.query
  });

  if (payload.error) {
    console.error(payload.error);
    printUsage();
    process.exit(1);
  }

  try {
    const result = await executeContext7Request(payload);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Context7 request gagal: ${error.message}`);
    process.exit(1);
  }
}

main();
