require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.log('MongoDB 연결 실패:', err));

// 1. Todo 스키마 수정 (중요도와 마감일 필드 추가)
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  important: { type: Boolean, default: false }, // 중요 표시 (★)
  dueDate: { type: String } // 마감일 (YYYY-MM-DD 형식)
});
const Todo = mongoose.model('Todo', todoSchema);

// 2. API 엔드포인트 수정

// 목록 조회 (GET)
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: "데이터 조회 실패" });
  }
});

// 할 일 추가 (POST) - 중요도와 날짜를 함께 저장하도록 수정
app.post('/api/todos', async (req, res) => {
  try {
    const { title, important, dueDate } = req.body;
    const newTodo = new Todo({ 
      title, 
      important: important || false, 
      dueDate: dueDate || null 
    });
    await newTodo.save();
    res.json(newTodo);
  } catch (err) {
    res.status(400).json({ message: "데이터 저장 실패" });
  }
});

// 할 일 수정 (PUT) - 완료 여부, 중요도, 제목 등 모든 필드 업데이트 지원
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { title, completed, important, dueDate } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      req.params.id, 
      { title, completed, important, dueDate }, 
      { new: true } // 업데이트된 후의 데이터를 반환
    );
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: "데이터 수정 실패" });
  }
});

// 할 일 삭제 (DELETE)
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(400).json({ message: "데이터 삭제 실패" });
  }
});

// 서버 실행 설정
const PORT = process.env.PORT || 5000;

// Vercel 배포를 고려하여 app.listen을 조건부로 실행하거나 
// 로컬 테스트 시에만 작동하게 합니다.
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
}

module.exports = app;