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

Here is the information about Asish:
Name: Asish Kumar Dalal
Role: Software Developer & Machine Learning Enthusiast
Education: 3rd Year CSE Student at Budge Budge Institute of Technology (BBIT)
CGPA: 7.9
School:Ulberia High School (HS)(Pure Science Stream)(12th)(83%)

Tech Stack: C++, Google Cloud, Express.js, React, Jenkins, MongoDB, MySQL, Keras, MLflow, Pandas, PyTorch, TensorFlow, scikit-learn, GitHub Actions, Docker.
Bio: A passionate software developer with expertise in full-stack web development and machine learning.
About: Experienced in building robust web applications and integrating AI/ML models. Currently pursuing B.Tech in Computer Science and Engineering.
Email: asishdalal@example.com
GitHub: https://github.com/AsishKumarDalal
LinkedIn: https://www.linkedin.com/in/asish-kumar-dalal/

Projects:

Domain: Web Development
- ResumeVVC: Modern resume builder platform designed for developers with real-time preview. (Tags: React, Node.js, MongoDB)
- Portfolio Website: Personal portfolio website showcasing projects and skills. (Tags: Next.js, React, CSS)

Domain: Machine Learning
- Image Classification: CNN based model for classifying images into multiple categories. (Tags: PyTorch, CNN)
- Sentiment Analysis: NLP model to analyze sentiment of movie reviews. (Tags: TensorFlow, NLP)

Experience:
- Intern at Tech Corp (Summer 2025): Developed and maintained web applications using React and Node.js.
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
