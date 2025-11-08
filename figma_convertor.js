import fetch from "node-fetch";
import fs from "fs";
import path from "path";

class FigmaToHTMLConverter {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = "https://api.figma.com/v1";
    this.headers = {
      "X-Figma-Token": accessToken,
    };
  }

  async getFile(fileKey) {
    const url = `${this.baseUrl}/files/${fileKey}`;
    const response = await fetch(url, { headers: this.headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch Figma file: ${response.statusText}`);
    }
    return await response.json();
  }

  async getImages(fileKey, nodeIds) {
    const url = `${this.baseUrl}/images/${fileKey}`;
    const params = new URLSearchParams({
      ids: nodeIds.join(","),
      format: "png",
    });

    const response = await fetch(`${url}?${params}`, { headers: this.headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }
    return await response.json();
  }

  convertColor(color, opacity = 1.0) {
    if (!color) return "transparent";

    const r = Math.round((color.r || 0) * 255);
    const g = Math.round((color.g || 0) * 255);
    const b = Math.round((color.b || 0) * 255);
    const a = (color.a || 1) * opacity;

    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }

  convertFills(fills) {
    if (!fills || !Array.isArray(fills) || fills.length === 0) {
      return "transparent";
    }

    const backgroundStyles = [];

    for (const fill of fills) {
      if (fill.visible === false) continue;

      switch (fill.type) {
        case "SOLID":
          const color = this.convertColor(fill.color, fill.opacity);
          backgroundStyles.push(color);
          break;

        case "GRADIENT_LINEAR":
          const gradient = this.convertLinearGradient(fill);
          backgroundStyles.push(gradient);
          break;

        case "GRADIENT_RADIAL":
          const radialGradient = this.convertRadialGradient(fill);
          backgroundStyles.push(radialGradient);
          break;

        case "IMAGE":
          // Handle image fills - would need additional processing
          break;
      }
    }

    return backgroundStyles.length > 0
      ? backgroundStyles.join(", ")
      : "transparent";
  }

  convertLinearGradient(fill) {
    const handlePositions = fill.gradientHandlePositions || [];
    const gradientStops = fill.gradientStops || [];

    if (handlePositions.length < 2) return "transparent";

    // Calculate gradient angle
    const start = handlePositions[0];
    const end = handlePositions[1];
    const angle =
      Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    const stops = gradientStops.map((stop) => {
      const color = this.convertColor(stop.color, stop.opacity);
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    });

    return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
  }

  convertRadialGradient(fill) {
    const gradientStops = fill.gradientStops || [];

    const stops = gradientStops.map((stop) => {
      const color = this.convertColor(stop.color, stop.opacity);
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    });

    return `radial-gradient(circle, ${stops.join(", ")})`;
  }

  convertStrokes(strokes) {
    if (!strokes || !Array.isArray(strokes) || strokes.length === 0) {
      return "none";
    }

    const borderStyles = [];

    for (const stroke of strokes) {
      if (stroke.visible === false) continue;

      if (stroke.type === "SOLID") {
        const color = this.convertColor(stroke.color, stroke.opacity);
        const strokeWeight = stroke.strokeWeight || 1;
        borderStyles.push(`${strokeWeight}px solid ${color}`);
      }
    }

    return borderStyles.length > 0 ? borderStyles.join(", ") : "none";
  }

  convertEffects(effects) {
    if (!effects || !Array.isArray(effects)) return "";

    const boxShadows = [];

    for (const effect of effects) {
      if (effect.visible === false) continue;

      if (effect.type === "DROP_SHADOW") {
        const color = this.convertColor(effect.color, effect.opacity);
        const offsetX = effect.offset?.x || 0;
        const offsetY = effect.offset?.y || 0;
        const radius = effect.radius || 0;
        const spread = effect.spread || 0;

        boxShadows.push(
          `${offsetX}px ${offsetY}px ${radius}px ${spread}px ${color}`
        );
      }
    }

    return boxShadows.length > 0 ? `box-shadow: ${boxShadows.join(", ")};` : "";
  }

  getFontFamily(fontFamily) {
    const fontMap = {
      inter: "Inter, system-ui, sans-serif",
      roboto: "Roboto, sans-serif",
      "open sans": '"Open Sans", sans-serif',
      lato: "Lato, sans-serif",
      montserrat: "Montserrat, sans-serif",
      "source sans pro": '"Source Sans Pro", sans-serif',
      helvetica: "Helvetica, Arial, sans-serif",
      arial: "Arial, sans-serif",
    };

    const lowerFont = fontFamily.toLowerCase();
    for (const [key, value] of Object.entries(fontMap)) {
      if (lowerFont.includes(key)) {
        return value;
      }
    }

    return `'${fontFamily}', sans-serif`;
  }

  convertTextStyles(node) {
    const style = node.style || {};
    const fills = node.fills || [];

    const fontFamily = this.getFontFamily(style.fontFamily || "Arial");
    const fontSize = style.fontSize || 16;
    const fontWeight = style.fontWeight || 400;
    const lineHeight = style.lineHeightPx || fontSize * 1.2;
    const letterSpacing = style.letterSpacing || 0;
    const textAlign = style.textAlign || "center";
    const textColor =
      fills.length > 0 ? this.convertColor(fills[0].color) : "#000000";

    const styles = [
      `font-family: ${fontFamily}`,
      `font-size: ${fontSize}px`,
      `font-weight: ${fontWeight}`,
      `line-height: ${lineHeight}px`,
      `letter-spacing: ${letterSpacing}px`,
      `text-align: ${textAlign}`,
      `color: ${textColor}`,
    ];

    // Handle text decoration
    if (style.textDecoration) {
      styles.push(`text-decoration: ${style.textDecoration}`);
    }

    // Handle text case
    if (style.textCase === "UPPER") {
      styles.push("text-transform: uppercase");
    } else if (style.textCase === "LOWER") {
      styles.push("text-transform: lowercase");
    } else if (style.textCase === "TITLE") {
      styles.push("text-transform: capitalize");
    }

    return styles.join(";\n  ");
  }

  generateCSSForNode(node, className) {
    const styles = [];

    // Layout and positioning
    if (node.absoluteBoundingBox) {
      const bbox = node.absoluteBoundingBox;
      styles.push("position: absolute");
      styles.push(`left: ${bbox.x}px`);
      styles.push(`top: ${bbox.y}px`);
      styles.push(`width: ${bbox.width}px`);
      styles.push(`height: ${bbox.height}px`);
    }

    // Background
    if (node.fills && node.fills.length > 0 && node.type !== "TEXT") {
      const background = this.convertFills(node.fills);
      if (background !== "transparent") {
        styles.push(`background: ${background}`);
      }
    }

    // Borders
    if (node.strokes && node.strokes.length > 0) {
      const border = this.convertStrokes(node.strokes);
      if (border !== "none") {
        styles.push(`border: ${border}`);
      }
    }

    // Border radius
    if (node.cornerRadius) {
      styles.push(`border-radius: ${node.cornerRadius}px`);
    } else if (node.rectangleCornerRadii) {
      const radii = node.rectangleCornerRadii;
      styles.push(
        `border-radius: ${radii[0]}px ${radii[1]}px ${radii[2]}px ${radii[3]}px`
      );
    }

    // Effects (shadows)
    if (node.effects && node.effects.length > 0) {
      const effectsCSS = this.convertEffects(node.effects);
      if (effectsCSS) {
        styles.push(effectsCSS);
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.push(`opacity: ${node.opacity}`);
    }

    // Text styles
    if (node.type === "TEXT") {
      const textStyles = this.convertTextStyles(node);
      styles.push(textStyles);
    }

    // Overflow
    if (node.clipsContent) {
      styles.push("overflow: hidden");
    }

    if (styles.length > 0) {
      return `.${className} {\n  ${styles.join(";\n  ")};\n}\n`;
    }

    return "";
  }

  generateHTMLForNode(node, className) {
    const nodeType = node.type.toLowerCase();

    switch (nodeType) {
      case "text":
        const characters = node.characters || "";
        return `<div class="${className}">${this.escapeHtml(characters)}</div>`;

      case "rectangle":
      case "ellipse":
      case "line":
      case "vector":
        return `<div class="${className}"></div>`;

      case "frame":
      case "group":
      case "instance":
      case "component":
        let childrenHTML = "";
        if (node.children && Array.isArray(node.children)) {
          childrenHTML = node.children
            .map((child) => {
              const childClass = `element-${child.id.replace(/:/g, "-")}`;
            })
            .join("\n");
        }
        return `<div class="${className}">\n${childrenHTML}\n</div>`;

      default:
        return `<div class="${className}"></div>`;
    }
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  processNode(node, cssOutput, htmlOutput) {
    const className = `element-${node.id.replace(/:/g, "-")}`;

    // Generate CSS
    const css = this.generateCSSForNode(node, className);

    if (css) {
      cssOutput.push(css);
    }

    // // Generate HTML 
    const html = this.generateHTMLForNode(node, className);
    htmlOutput.push(html);

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => {
        this.processNode(child, cssOutput, htmlOutput);
      });
    }
  }

  async convertFile(fileKey, outputPath = "output") {
    try {
      // Create output directory
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      console.log("Fetching Figma file...");
      const fileData = await this.getFile(fileKey);
      const document = fileData.document;

      const cssOutput = [];
      const htmlOutput = [];

      cssOutput.push(`* {
  box-sizing: border-box;
}

body {
  padding: 0;
  font-family: system-ui, sans-serif;
  position: relative;
  min-height: 100vh;
  background: white;
}`);

      console.log("Processing nodes...");

      this.processNode(document, cssOutput, htmlOutput);

      // Generate complete HTML file
      console.log("Generating output files...");

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma to HTML Conversion</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css"> 
</head>
<body>
${htmlOutput.join("\n")}
</body>
</html>`;

      // Write output files
      const htmlFilePath = path.join(outputPath, "index.html");
      const cssFilePath = path.join(outputPath, "styles.css");

      fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
      fs.writeFileSync(cssFilePath, cssOutput.join("\n"), "utf8");

      console.log(`\n\nConversion complete!`);
      console.log(`HTML file: ${htmlFilePath}`);
      console.log(`CSS file: ${cssFilePath}`);

      return {
        htmlFile: htmlFilePath,
        cssFile: cssFilePath,
        nodeCount: cssOutput.length,
      };
    } catch (error) {
      console.error("❌ Conversion failed:", error.message);
      throw error;
    }
  }
}

export default FigmaToHTMLConverter;
