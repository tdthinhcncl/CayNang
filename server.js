// File: server.js - PHIÊN BẢN HOÀN CHỈNH CUỐI CÙNG

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Cấu hình môi trường ---
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Định nghĩa "Hợp đồng JSON" (Schema) ---
const puzzleSchema = {
  type: "OBJECT",
  properties: {
    theme: { type: "STRING", description: "Chủ đề tổng thể của trò chơi ô chữ." },
    vertical_keyword: {
      type: "OBJECT",
      properties: {
        word: { type: "STRING" },
        clue: { type: "STRING" },
      },
      required: ['word', 'clue'],
    },
    horizontal_clues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          clue_number: { type: "INTEGER" },
          word: { type: "STRING" },
          clue: { type: "STRING" },
          intersection_index_vertical: {
            type: "INTEGER",
            description: "Chỉ số (bắt đầu từ 0) của chữ cái trong từ khóa hàng dọc nơi từ này giao nhau.",
          },
        },
        required: ['clue_number', 'word', 'clue', 'intersection_index_vertical'],
      },
    },
  },
  required: ['theme', 'vertical_keyword', 'horizontal_clues'],
};

// --- Khởi tạo ứng dụng và mô hình AI ---
const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro", // Sử dụng model ổn định
  generationConfig: {
    responseMimeType: "application/json",
  },
  responseSchema: puzzleSchema, // Đặt schema ở cấp ngoài cùng
});

// --- Phục vụ các tệp Frontend ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Xây dựng API Endpoint ---
app.get('/api/generate-puzzle', async (req, res) => {
  try {
    const userTheme = req.query.theme || 'Khoa học vũ trụ';
    console.log(`Đang tạo ô chữ mới với chủ đề: "${userTheme}"...`);

    const prompt = `
      Hãy tạo một trò chơi ô chữ theo phong cách "Đường lên đỉnh Olympia" với các quy tắc sau:
      1. Chủ đề: ${userTheme}.
      2. Từ khóa hàng dọc: Dài từ 8-12 chữ cái, liên quan chặt chẽ đến chủ đề.
      3. Các từ hàng ngang: Phải liên quan đến chủ đề và giao với từ khóa hàng dọc tại đúng một chữ cái.
      4. Gợi ý: Các gợi ý phải thông minh, mang tính đố vui, không được chứa từ đáp án.
      5. Định dạng: Xuất kết quả theo đúng cấu trúc JSON đã được cung cấp.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const puzzleJson = response.text();

    console.log("Đã tạo ô chữ thành công!");
    res.json(JSON.parse(puzzleJson));

  } catch (error) {
    console.error("Lỗi khi tạo ô chữ:", error);
    res.status(500).send('Lỗi máy chủ khi tạo ô chữ');
  }
});

// --- Khởi chạy máy chủ ---
app.listen(port, () => {
  console.log(`Máy chủ đang lắng nghe tại http://localhost:${port}`);
});