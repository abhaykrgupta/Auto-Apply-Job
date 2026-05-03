import { discoveryEngine } from '../lib/company-discovery/discovery-engine';

async function main() {
  console.log('🔍 Starting company discovery...\n');

  const result = await discoveryEngine.runFullDiscovery({
    sources: ['seed', 'yc', 'github'],
    skipAtsDetection: false,
  });

  console.log('\n✅ Discovery Complete!');
  console.log(`   Total discovered : ${result.total}`);
  console.log(`   New companies    : ${result.newCompanies}`);
  console.log('\n   By source:');
  for (const [source, count] of Object.entries(result.sources)) {
    console.log(`     ${source.padEnd(12)}: ${count}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
