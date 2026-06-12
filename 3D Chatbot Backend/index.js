import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import { createWriteStream } from "fs"; // Added for streaming
import { Readable } from "stream";      // Added to bridge ElevenLabs stream
import OpenAI from "openai";
import { ElevenLabsClient } from "elevenlabs"; // Using the Official SDK

dotenv.config();
console.log("API Key loaded:", process.env.ELEVEN_LABS_API_KEY ? "YES" : "NO");

// Initialize OpenAI (OpenRouter)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Initialize ElevenLabs Official SDK
const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

const voiceID = "21m00Tcm4TlvDq8ikWAM"; // Your specific voice ID
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// Ensure audios directory exists
const ensureDir = async () => {
  try {
    await fs.mkdir("audios", { recursive: true });
  } catch (err) {
    console.error("Error creating audios directory", err);
  }
};
ensureDir();

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (index) => {
  const time = new Date().getTime();
  console.log(`Starting LipSync processing for message ${index}...`);
  
  try {
    // 1. Convert MP3 to WAV for Rhubarb (Required for accuracy)
    await execCommand(
      `ffmpeg -y -i audios/message_${index}.mp3 audios/message_${index}.wav`
    );
    
    // 2. Run Rhubarb (Ensure bin\rhubarb.exe exists in your project root)
    await execCommand(
      `bin\\rhubarb.exe -f json -o audios/message_${index}.json audios/message_${index}.wav -r phonetic`
    );
    
    console.log(`✅ Lip sync finished in ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error(`❌ LipSync Error for message ${index}:`, error);
  }
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
      ],
    });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        {
          role: "system",
          content: `
            You are a 3D Chatbot assistant.
            You always reply with a JSON object containing a "messages" array. Max 2 messages.
            Each message has text, facialExpression, and animation.
            Expressions: smile, sad, angry, surprised, funnyFace, default.
            Animations: Talking_0, Talking_1, Talking_2, Crying, Laughing, Idle, Angry.
            Example: {"messages": [{"text": "Hello!", "facialExpression": "smile", "animation": "Talking_1"}]}
          `,
        },
        { role: "user", content: userMessage },
      ],
    });

    let content = completion.choices[0].message.content;
    let parsed = JSON.parse(content);
    let messages = parsed.messages || parsed;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const fileName = `audios/message_${i}.mp3`;

      try {
        console.log(`Generating Audio: ${message.text.substring(0, 30)}...`);

        // 1. Generate ElevenLabs Speech using the SDK
        const audioResponse = await elevenLabsClient.textToSpeech.convert(voiceID, {
          text: message.text,
          model_id: "eleven_flash_v2", // Faster & cheaper for chatbots
        });

        // 2. Save Stream to File
        const fileStream = createWriteStream(fileName);
        await new Promise((resolve, reject) => {
          Readable.fromWeb(audioResponse).pipe(fileStream);
          fileStream.on("finish", resolve);
          fileStream.on("error", reject);
        });

        // 3. Process LipSync
        await lipSyncMessage(i);

        // 4. Attach data to message
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);

      } catch (err) {
        console.error("Error in Voice/LipSync loop:", err.message);
      }
    }

    res.send({ messages });
    console.log("Chat response sent!");

  } catch (error) {
    console.error("Critical Route Error:", error);
    res.status(500).send({ error: "Server Error" });
  }
});

const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return { mouthCues: [] }; // Fallback if file doesn't exist
  }
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`🚀 3D Chatbot Backend running on http://localhost:${port}`);
});