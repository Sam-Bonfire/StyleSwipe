/**
 * Pins the Android Gradle wrapper to a version compatible with our native modules.
 *
 * Expo prebuild regenerates android/gradle/wrapper/gradle-wrapper.properties from
 * the React Native template (currently Gradle 9.3.1), which breaks:
 * - onnxruntime-react-native (removed internal VersionNumber API)
 * - expo-modules-core publishing (SoftwareComponent 'release' not found)
 *
 * Gradle 8.13 is compatible with AGP 8.12 (shipped by RN 0.86 / Expo 57).
 * Cross-platform: pure Node file IO, no sed.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const GRADLE_VERSION = "8.13";

function main(): void {
  const propsPath = join(
    process.cwd(),
    "apps",
    "consumer-app",
    "android",
    "gradle",
    "wrapper",
    "gradle-wrapper.properties",
  );
  if (!existsSync(propsPath)) {
    console.error(`[pin-gradle] wrapper properties not found at ${propsPath}. Run mobile:prebuild first.`);
    process.exit(1);
  }
  const before: string = readFileSync(propsPath, "utf8");
  const after: string = before.replace(/gradle-.*-bin\.zip/, `gradle-${GRADLE_VERSION}-bin.zip`);
  if (after === before) {
    console.error("[pin-gradle] distributionUrl pattern not found, nothing changed.");
    process.exit(1);
  }
  writeFileSync(propsPath, after);
  const line: string | undefined = after.split("\n").find((l: string) => l.startsWith("distributionUrl"));
  console.log(`[pin-gradle] ${line}`);
}

main();
