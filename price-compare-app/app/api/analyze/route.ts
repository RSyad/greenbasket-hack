// 1. Safely unwrap if the frontend sent an array (e.g., [dataUrl]) or object
const rawInput = Array.isArray(body.imageBase64)
  ? body.imageBase64[0]
  : body.imageBase64;

if (!rawInput || typeof rawInput !== "string") {
  return NextResponse.json(
    { error: "Missing or invalid imageBase64 string." },
    { status: 400 }
  );
}

// 2. Detect MIME type dynamically (defaults to image/jpeg) and strip the data URL header
const mimeMatch = rawInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
const mimeType = mimeMatch ? mimeMatch : "image/jpeg";
const cleanBase64 = rawInput
  .replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "")
  .trim();

// 3. Pass `inlineData` (camelCase!) and flat `parts` array to @google/genai
const response = await ai.models.generateContent({
  model: modelName,
  contents: [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64, // Guaranteed to be a single plain base64 string, NEVER an array
          },
        },
        {
          text: prompt,
        },
      ],
    },
  ],
  config: {
    responseMimeType: "application/json",
  },
});
