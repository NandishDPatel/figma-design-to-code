import FigmaToHTMLConverter from "./figma_convertor.js";
import dotenv from "dotenv";
import { extractFileKeyFromUrl } from "./utils/file_key_extractor.js";

// Load environment variables
dotenv.config();

const FIGMA_URL = process.env.FIGMA_URL;
const ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

async function runCLI() {
  const outputDir = "./output";

  if (!FIGMA_URL || !ACCESS_TOKEN) {
    console.log(
      " Please provide both FIGMA_URL and FIGMA_ACCESS_TOKEN in .env file"
    );
    process.exit(1);
  }

  // Validate that it's a Figma URL
  if (!FIGMA_URL.includes("figma.com")) {
    console.log(" Please provide a valid Figma URL");
    console.log(" Example: https://figma.com/design/ABC123/Project-Name");
    process.exit(1);
  }

  try {
    console.log("\nProcessing Figma URL...");
    const fileKey = extractFileKeyFromUrl(FIGMA_URL);
    console.log(`Extracted file key: ${fileKey}`);

    const converter = new FigmaToHTMLConverter(ACCESS_TOKEN);
    console.log("Starting conversion...");

    const result = await converter.convertFile(fileKey, outputDir);

    console.log(`\n\nConversion successful!`);
    console.log(`Output Directory: ${outputDir}/`);
    console.log(`Total Elements converted: ${result.nodeCount}`);
  } catch (error) {
    console.error("Conversion failed:", error.message);
    process.exit(1);
  }
}

runCLI();
