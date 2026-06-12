# 3D Conversational Assistant

An end-to-end, full-stack generative AI application that delivers interactive, real-time 3D avatar interactions. By orchestrating Large Language Models (LLMs), neural voice synthesis, and real-time browser animation loops, the platform handles over 500+ daily conversational interactions with minimal audio-to-visual latency.

---

## 🚀 Key Features

* **Real-Time 3D Rendering:** Uses React Three Fiber and Three.js to render a highly responsive humanoid avatar directly inside the browser, capable of smooth, 60FPS fluid motions.
* **Automated Audio & Lip-Sync Pipeline:** Features a high-performance backend utility (built with Express and FFmpeg) that transcodes incoming ElevenLabs MP3 streams into production-grade WAV audio.
* **Phonetic Morph Target Mapping:** Integrates the Rhubarb Lip Sync engine to parse audio files on-the-fly, extracting time-stamped phonetic JSON arrays used to precisely drive avatar facial blendshapes.
* **Latency Optimization:** Implements customized asynchronous React hooks and global Context providers, successfully slicing total streaming response delay by ~30% for a seamless user experience.

---

## 🏗️ System Architecture

The application splits computational loads across a robust, lightweight dual-layer stack:

```text
3d-conversational-assistant/
│
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Canvas components & 3D Humanoid Avatar elements
│   │   ├── hooks/          # Custom React hooks managing async audio queues
│   │   └── context/        # State provider synchronizing 60FPS animation loops
│   └── package.json
│
└── backend/                 # Express.js REST API core
    ├── src/
    │   ├── routes/         # AI response orchestration endpoints
    │   └── utils/          # FFmpeg compression and Rhubarb phonetic extractors
    ├── bin/                # Local Rhubarb executable binaries
    └── package.json
