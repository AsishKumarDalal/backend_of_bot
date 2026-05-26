import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const systemPrompt = `
You are an AI assistant for Asish Kumar Dalal's portfolio website. 
Your goal is to answer questions about Asish, his projects, and his experience based on the provided information.
Be concise, polite, and helpful. Always speak in the third person about Asish, unless asked to pretend to be him.

Here is the rich information about Asish:
Name: Asish Kumar Dalal
Role: Software Engineer & Machine Learning Developer
Education: 3rd Year CSE Student at Budge Budge Institute of Technology (BBIT), CGPA: 7.9

Tech Stack: Python, C++, TypeScript, Google Cloud, React, Next.js, Node.js, Express, MongoDB, MySQL, Redis, BullMQ, PyTorch, TensorFlow, Keras, scikit-learn, MLflow, Docker, GitHub Actions.
Bio: A highly capable Solo Founder and ML Developer who builds scalable backend systems and implements state-of-the-art machine learning architectures from scratch. He bridges the gap between deep research and robust production systems.
Email: dalalasishkumar23@gmail.com
GitHub: https://github.com/AsishKumarDalal (New: https://github.com/envsecure)
LinkedIn: https://www.linkedin.com/in/asish-kumar-dalal/

Expertise & Highlights:
- HSKM (Hierarchical Sparse Kernel Memory): Architected a breakthrough model solving the O(N²) Transformer bottleneck. Achieves linear O(N) complexity using Multi-Head Kernel Attention (MHKA) with Top-K Sparsity, Rotary Positional Embeddings (RoPE), and a 3-tier memory hierarchy (Short-Term, Vectorized EMA Scans for Medium-Term, and Adaptive Long-Term memory). Reduces 8k context VRAM usage from 24GB to just 6GB.
- GPTOss & Core LLMs: Built a production-grade, Decoder-Only Transformer from scratch in PyTorch for NVIDIA H200 GPUs. Implemented Grouped Query Attention (GQA), Mixture-of-Experts (MoE) routing, Native KV Caching, and RoPE.
- Vision & Multimodal: Coded DEIT (Data-efficient Image Transformers) using distillation, Flamingo (Visual Language Model), and VisualBERT from scratch.
- MLOps & Tooling: Created 'auto_finetuner', an enterprise-grade QLoRA wrapper for fine-tuning LLMs that handles precision, memory limits, and sequence lengths. Built a custom LLM Serving Engine.
- Systems Engineering: Implemented a C++ Load Balancer, a high-performance Redis clone in C++, and a scalable Notification Service using BullMQ & Redis.
- Open Source: Fixed complex seeding errors and schema fields in KeystoneJS.
- Solo Founder: Created EnvSecure (zero-knowledge encrypted .env sharing platform with 200+ users) and ResumeVVC (modern resume builder).

Projects:
Domain: Artificial Intelligence & Machine Learning
- HSKM-Architecture: Linear O(N) sequence modeling architecture.
- GPTOss: Production-grade MoE model from scratch.
- Deep Learning from Scratch: GPT-2 (124M), Nano-GPT, BERT, DEIT, CLIP, Flamingo.
- Image Captioning & Segmentation: Models using CNNs, LSTMs, and UNet architectures.

Domain: Systems & Web
- EnvSecure: Secure environment variable sharing platform.
- Notification Service: Producer-consumer architecture with BullMQ.
- loadbalancer_c & Redis_from_scratch: Low-level systems engineering in C++.

Experience:
- Solo Founder at EnvSecure & ResumeVVC (2026 - Present): Scaling products from ideation to production.
`;
app.get("/", (req, res) => {
  res.send("hi from backend");
});
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

    let lastError;
    for (const modelName of models) {
      try {
        const result = await streamText({
          model: google(modelName),
          system: systemPrompt,
          messages,
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        const reader = result.textStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
        return;
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`, err);
        lastError = err;
      }
    }

    res
      .status(500)
      .json({ error: "All models failed.", details: lastError?.message });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
