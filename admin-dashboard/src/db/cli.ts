import { ensureReady, getClient } from "./index";

await ensureReady();
const { resetAndSeed } = await import("./seed");
await resetAndSeed();
getClient().close();
console.log("Grace High School Gayaza sample library reloaded.");
