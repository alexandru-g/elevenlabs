const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ 
          error: "ElevenLabs API key not configured",
          message: "Please set ELEVENLABS_API_KEY in your Supabase Edge Function secrets"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Received audio file:", audioFile.name, "size:", audioFile.size, "type:", audioFile.type);

    if (audioFile.size < 100) {
      return new Response(
        JSON.stringify({ error: "Audio file too small. Please speak longer." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: audioFile.type || "audio/webm" });

    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append("audio", audioBlob, audioFile.name || "recording.webm");
    elevenlabsFormData.append("model_id", "scribe_v1");

    console.log("Sending to ElevenLabs STT API...");

    const response = await fetch(
      "https://api.elevenlabs.io/v1/speech-to-text",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenlabsFormData,
      }
    );

    console.log("ElevenLabs response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT API error:", response.status, errorText);
      
      let errorMessage = "Speech recognition failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail?.message || errorJson.message || errorJson.error || errorText;
      } catch {
        errorMessage = errorText || "Unknown error from ElevenLabs";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: response.status 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();
    console.log("STT result:", result);
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("STT Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});