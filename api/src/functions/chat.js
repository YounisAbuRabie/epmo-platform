const { app } = require("@azure/functions");

app.http("chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return { status: 204, headers };
    }

    try {
      const body = await request.json();
      const { messages, system } = body;

      if (!messages || !Array.isArray(messages)) {
        return { status: 400, headers, body: JSON.stringify({ error: "messages array required" }) };
      }

      // Azure OpenAI config — key stays server-side, never exposed to frontend
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://younis-openai.openai.azure.com";
      const apiKey = process.env.AZURE_OPENAI_KEY;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt4o-mini";
      const apiVersion = "2024-12-01-preview";

      if (!apiKey) {
        return { status: 500, headers, body: JSON.stringify({ error: "API key not configured" }) };
      }

      // Build Azure OpenAI request
      const apiMessages = system
        ? [{ role: "developer", content: system }, ...messages]
        : messages;

      const response = await fetch(
        `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body: JSON.stringify({
            messages: apiMessages,
            max_completion_tokens: 4000,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        return { status: response.status, headers, body: JSON.stringify({ error: `Azure OpenAI error: ${errText}` }) };
      }

 const data = await response.json();
      console.log("Azure OpenAI raw response:", JSON.stringify(data));
      const reply = data.choices?.[0]?.message?.content || "No response.";

      // Return in a format matching what the frontend expects
      return {
        status: 200,
        headers,
        body: JSON.stringify({ content: [{ type: "text", text: reply }] }),
      };
    } catch (err) {
      return { status: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  },
});
