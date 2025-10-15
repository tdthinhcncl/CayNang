// File: server.js
// Vui lòng thay thế toàn bộ nội dung file cũ bằng code này.

// --- 1. Import các thư viện cần thiết ---
import express from 'express';
import { GoogleGenerativeAI} from '@google/generative-ai';
import dotenv from 'dotenv';

// --- 2. Cấu hình môi trường ---
dotenv.config();

// --- 3. Định nghĩa "Hợp đồng JSON" (Schema) ---
// Thay thế toàn bộ khối puzzleSchema cũ bằng khối này
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

// --- 4. Khởi tạo ứng dụng Express và mô hình Gemini ---
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public')); // <--- THÊM DÒNG NÀY VÀO ĐÂY

// Khởi tạo Gemini một cách an toàn với API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cấu hình mô hình để sử dụng chế độ JSON và schema đã định nghĩa
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: puzzleSchema,
  },
});

// --- 5. Xây dựng API Endpoint ---
// Trong file server.js, cập nhật lại hàm app.get

app.get('/api/generate-puzzle', async (req, res) => {
  try {
    // Lấy chủ đề từ request của người dùng, nếu không có thì dùng chủ đề mặc định
    const userTheme = req.query.theme || 'Khoa học vũ trụ';
    
    console.log(`Đang tạo ô chữ mới với chủ đề: "${userTheme}"...`);

    // Cập nhật lại prompt để sử dụng chủ đề của người dùng
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
    res.status(500).send('Lỗi khi tạo ô chữ');
  }
});

// --- 6. Khởi chạy máy chủ ---
app.listen(port, () => {
  console.log(`Máy chủ đang lắng nghe tại http://localhost:${port}`);
});