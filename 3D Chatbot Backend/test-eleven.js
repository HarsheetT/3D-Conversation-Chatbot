import { ElevenLabsClient } from "elevenlabs";
import { createWriteStream } from "fs";
import { Readable } from "stream"; // Needed to convert the stream

// --- CONFIGURATION ---
const ELEVEN_LABS_API_KEY = "sk_6694d59a50ef82898b0f99a87c2ebbd8201fd1db6455f042"; 
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; 

const client = new ElevenLabsClient({
  apiKey: ELEVEN_LABS_API_KEY,
});

async function testWithSDK() {
  console.log("Testing ElevenLabs using Official SDK...");

  try {
    const audio = await client.textToSpeech.convert(VOICE_ID, {
      model_id: "eleven_flash_v2",
      text: "Success! The 3D Chatbot is now authenticated and generating audio.",
    });

    const fileName = "test-audio.mp3";
    const fileStream = createWriteStream(fileName);
    
    // Convert Web Stream to Node Stream so .pipe() works
    Readable.fromWeb(audio).pipe(fileStream);

    fileStream.on("finish", () => {
      console.log(`✅ Success! Audio saved to ${fileName}`);
      console.log("You can now play this file to hear the chatbot.");
    });

    fileStream.on("error", (err) => {
      console.error("❌ File System Error:", err);
    });

  } catch (error) {
    console.error("❌ SDK Error:", error.message);
  }
}

testWithSDK();