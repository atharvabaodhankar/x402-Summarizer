try {
  const x402 = await import("x402-hono");
  console.log("x402-hono loaded via dynamic import");
  console.log("Keys:", Object.keys(x402));
  if (x402.default) console.log("Default keys:", Object.keys(x402.default));
} catch (e) {
  console.error("Failed to load x402-hono:", e);
}
