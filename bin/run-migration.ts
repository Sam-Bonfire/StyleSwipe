import { spawnSync } from "child_process";

function runConvex(func: string, jsonArgs?: any) {
  const cmdArgs = ["convex", "run", func];
  if (jsonArgs) {
    cmdArgs.push(JSON.stringify(jsonArgs));
  }
  
  const result = spawnSync("npx", cmdArgs, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Convex execution failed: ${result.stderr}`);
  }
  return JSON.parse(result.stdout.trim());
}

async function main() {
  console.log("🚀 Starting Widen-Migrate-Narrow Batch Backfill Runner...");
  
  let migratedCount = 0;
  let iteration = 1;
  
  while (true) {
    console.log(`\n🔍 [Iteration ${iteration}] Querying for unmigrated product embeddings...`);
    const unmigrated = runConvex("migrations:getUnmigratedProducts");
    
    if (!unmigrated || unmigrated.length === 0) {
      console.log("🎉 Parity check complete! No unmigrated product embeddings remain.");
      break;
    }
    
    console.log(`📦 Found ${unmigrated.length} unmigrated products. Executing migrateBatch...`);
    runConvex("migrations:migrateBatch", { batch: unmigrated });
    
    migratedCount += unmigrated.length;
    console.log(`✅ Successfully backfilled ${unmigrated.length} products (Total: ${migratedCount})`);
    
    iteration++;
    // Sleep briefly to respect database load limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 Success! Backfilled a total of ${migratedCount} vector embeddings to the product_embeddings table!`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
