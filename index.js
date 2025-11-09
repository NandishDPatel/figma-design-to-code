import FigmaToHTMLConverter from "./figma_convertor.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const FIGMA_URL = process.env.FIGMA_URL;
const ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

async function runCLI() {
  const outputDir = "./output";

  try {

    const converter = new FigmaToHTMLConverter(ACCESS_TOKEN);
    const fileKey = FIGMA_URL;

    const result = await converter.convertFile(fileKey, outputDir);

    console.log('Conversion completed successfully')

  } catch (error) {
    console.error("Conversion failed:", error.message);
    process.exit(1);
  }
}

runCLI();
