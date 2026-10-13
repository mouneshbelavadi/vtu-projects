import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function makeIcons() {
  const root = process.cwd();
  const designAssetsDir = path.join(root, "design-assets");

  let sourcePath = path.join(root, "src", "app", "icon.svg");

  if (fs.existsSync(designAssetsDir)) {
    const customFiles = fs.readdirSync(designAssetsDir);
    const logoFile = customFiles.find((f) => f.startsWith("logo."));
    if (logoFile) {
      sourcePath = path.join(designAssetsDir, logoFile);
      console.log(`Using custom logo from design-assets: ${logoFile}`);
    }
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source icon file not found at ${sourcePath}`);
    process.exit(1);
  }

  console.log(`Generating icons from: ${sourcePath}`);
  const svgBuffer = fs.readFileSync(sourcePath);

  // 1. Generate 180x180 Apple Touch Icon
  const appleIcon180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();

  fs.writeFileSync(path.join(root, "src", "app", "apple-icon.png"), appleIcon180);
  const publicDir = path.join(root, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), appleIcon180);
  console.log("Created apple-icon.png (180x180)");

  // 2. Generate 32x32 Favicon
  const favicon32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

  fs.writeFileSync(path.join(root, "src", "app", "favicon.ico"), favicon32);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), favicon32);
  fs.writeFileSync(path.join(root, "src", "app", "icon.png"), favicon32);
  console.log("Created favicon.ico (32x32)");

  console.log("All icon assets generated successfully.");
}

makeIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
