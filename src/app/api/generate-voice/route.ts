import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

interface ElevenLabsError {
  message?: string;
  details?: string;
}

export async function POST(request: Request) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error - API key missing" },
      { status: 500 }
    );
  }

  try {
    // Check content type before parsing
    const contentType = request.headers.get("content-type");
    if (
      !contentType?.includes("multipart/form-data") &&
      !contentType?.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { error: "Invalid Content-Type header" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const text = formData.get("text")?.toString() || "";
    const voice = formData.get("voice")?.toString();
    const audioFile = formData.get("audioFile") as File | null;

    if (!text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Voice cloning logic
    if (audioFile) {
      if (audioFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Audio file too large (max 10MB)" },
          { status: 400 }
        );
      }

      // Create voice clone
      const cloneFormData = new FormData();
      cloneFormData.append("name", "Cloned Voice");
      cloneFormData.append("files", audioFile);
      cloneFormData.append("description", "Voice cloned from audio sample");

      let clonedVoiceId: string;
      try {
        const cloneResponse = await axios.post<{ voice_id: string }>(
          "https://api.elevenlabs.io/v1/voices/add",
          cloneFormData,
          {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        clonedVoiceId = cloneResponse.data.voice_id;
        if (!clonedVoiceId) {
          throw new Error("No voice_id returned from cloning API");
        }
      } catch (error) {
        const axiosError = error as AxiosError<ElevenLabsError>;
        console.error(
          "Cloning error:",
          axiosError.response?.data || axiosError.message
        );
        return NextResponse.json(
          {
            error: "Voice cloning failed",
            details: axiosError.response?.data?.message || axiosError.message,
          },
          { status: 500 }
        );
      }

      // Generate speech with cloned voice
      try {
        const ttsResponse = await axios.post<ArrayBuffer>(
          `https://api.elevenlabs.io/v1/text-to-speech/${clonedVoiceId}`,
          {
            text,
            model_id: "eleven_monolingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.5,
              speaker_boost: true,
            },
          },
          {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
              accept: "audio/mpeg",
            },
            responseType: "arraybuffer",
          }
        );

        // Clean up cloned voice (don't await to speed up response)
        axios
          .delete(`https://api.elevenlabs.io/v1/voices/${clonedVoiceId}`, {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
          })
          .catch((deleteError) => {
            console.error("Failed to delete cloned voice:", deleteError);
          });

        return new NextResponse(ttsResponse.data, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": 'attachment; filename="cloned-voice.mp3"',
          },
        });
      } catch (error) {
        const axiosError = error as AxiosError<ElevenLabsError>;
        // Attempt to clean up even if TTS fails
        await axios
          .delete(`https://api.elevenlabs.io/v1/voices/${clonedVoiceId}`, {
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
            },
          })
          .catch((deleteError) => {
            console.error(
              "Failed to delete cloned voice after TTS error:",
              deleteError
            );
          });

        const errorDetails =
          axiosError.response?.data?.message ||
          (axiosError.response?.data
            ? JSON.stringify(axiosError.response.data)
            : axiosError.message);
        console.error("TTS error:", errorDetails);
        return NextResponse.json(
          {
            error: "Speech generation failed",
            details: errorDetails,
          },
          { status: 500 }
        );
      }
    }

    // Standard TTS logic
    if (!voice) {
      return NextResponse.json(
        { error: "Voice ID is required for standard TTS" },
        { status: 400 }
      );
    }

    try {
      const response = await axios.post<ArrayBuffer>(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
        {
          text,
          model_id: "eleven_monolingual_v2",
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.7,
            style: 0.5,
            speaker_boost: true,
          },
        },
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            accept: "audio/mpeg",
          },
          responseType: "arraybuffer",
        }
      );

      return new NextResponse(response.data, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'attachment; filename="generated-voice.mp3"',
        },
      });
    } catch (error) {
      const axiosError = error as AxiosError<ElevenLabsError>;
      const errorDetails =
        axiosError.response?.data?.message ||
        (axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message);
      console.error("TTS error:", errorDetails);
      return NextResponse.json(
        {
          error: "Speech generation failed",
          details: errorDetails,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
