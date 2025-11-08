export function extractFileKeyFromUrl(url) {
  const patterns = [
    /figma\.com\/design\/([a-zA-Z0-9]{20,30})/,
    /figma\.com\/file\/([a-zA-Z0-9]{20,30})/,
    /figma\.com\/proto\/([a-zA-Z0-9]{20,30})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error(
    "Could not extract file key from URL. Please check the URL format."
  );
}
