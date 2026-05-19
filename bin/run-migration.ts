import { spawnSync } from "child_process";

function runConvex(func: string, jsonArgs?: any) {
  const cmdArgs = ["convex", "run", func];
  if (jsonArgs) {
    cmdArgs.push(JSON.stringify(jsonArgs));
  }
  
  const result = spawnSync("npx", cmdArgs, { 
    encoding: "utf8",
    cwd: "c:\\Users\\Sam\\Consusson\\Projects\\StyleSwipe\\packages\\convex"
  });
  if (result.status !== 0) {
    throw new Error(`Convex execution failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout.trim());
}

async function main() {
  console.log("🚀 Starting Widen-Migrate-Narrow Batch Backfill Runner...");
  
  let migratedCount = 0;
  let iteration = 1;
  let cursor: number | undefined = undefined;
  
  while (true) {
    console.log(`\n🔍 [Iteration ${iteration}] Executing migrateBatch...`);
    const result = runConvex("migrations:migrateBatch", { 
      cursor, 
      limit: 50 
    });
    
    const { count, lastCursor, evaluated } = result;
    
    if (count > 0) {
      migratedCount += count;
      console.log(`✅ Successfully backfilled ${count} products in this batch (Total: ${migratedCount})`);
    } else {
      console.log(`ℹ️ Evaluated ${evaluated} products, 0 backfilled.`);
    }
    
    if (evaluated === 0 || lastCursor === undefined) {
      console.log("🎉 Complete! Reached the end of the catalog.");
      break;
    }
    
    cursor = lastCursor;
    iteration++;
    // Sleep briefly to respect database load limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  
  console.log(`\n🎉 Success! Backfilled a total of ${migratedCount} vector embeddings to the product_embeddings table!`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
