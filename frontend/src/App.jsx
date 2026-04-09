import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

const API = "/api/todos";

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const NAV = [
  { id: "calendar",  icon: "📅",  label: "캘린더",       bg: "from-blue-600 to-blue-400", placeholder: "일정 및 할 일 추가..." },
  { id: "today",     icon: "☀️",  label: "오늘 할 일",   bg: "from-amber-400 to-orange-400", placeholder: "오늘 할 일 입력..." },
  { id: "important", icon: "⭐",  label: "중요",         bg: "from-pink-500 to-rose-500", placeholder: "중요한 작업 추가..." },
  { id: "tasks",     icon: "🏠",  label: "모든 작업",     bg: "from-sky-400 to-blue-500", placeholder: "새 작업 입력..." },
  { id: "completed", icon: "✅",  label: "완료된 작업",   bg: "from-emerald-500 to-teal-400", placeholder: "" },
];

const STYLE = `
  .react-calendar { width: 100% !important; border: none !important; font-family: 'Segoe UI', system-ui, sans-serif; background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .react-calendar__navigation button { font-size: 16px; font-weight: 700; color: #1e293b; transition: 0.2s; border-radius: 8px; }
  .react-calendar__navigation button:hover { background: #f1f5f9; }
  .react-calendar__month-view__weekdays { font-weight: 600; font-size: 13px; color: #94a3b8; text-decoration: none !important; }
  .react-calendar__tile { height: 75px !important; font-size: 14px; border-radius: 10px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 2px; }
  .has-pending-task { background: #f0f9ff !important; color: #0284c7 !important; font-weight: 700; border: 1px solid #bae6fd; }
  .react-calendar__tile--active { background: #2563eb !important; color: white !important; }
  .react-calendar__tile--now { background: #fffbeb !important; color: #d97706 !important; font-weight: 800; border: 1px solid #fde68a !important; }
  
  input[type="checkbox"]:disabled { opacity: 1; cursor: default; }
`;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [view, setView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTitle, setNewTitle] = useState("");
  const [inputDate, setInputDate] = useState(formatDate(new Date()));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      const { data } = await axios.get(API);
      setTodos(data);
    } catch { setTodos([]); }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  useEffect(() => {
    if (view === "today") setInputDate(formatDate(new Date()));
    else if (view === "calendar") setInputDate(formatDate(selectedDate));
  }, [view, selectedDate]);

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    const payload = { 
      title: newTitle.trim(), 
      important: view === "important", 
      dueDate: inputDate, 
      completed: false 
    };
    try {
      const { data } = await axios.post(API, payload);
      setTodos((prev) => [...prev, data]);
    } catch {
      setTodos((prev) => [...prev, { ...payload, _id: Date.now().toString() }]);
    }
    setNewTitle("");
  };

  const toggleTodo = async (todo) => {
    const updated = { ...todo, completed: !todo.completed };
    try { await axios.put(`${API}/${todo._id}`, updated); } catch {}
    setTodos((prev) => prev.map((t) => (t._id === todo._id ? updated : t)));
  };

  const deleteTodo = async (id) => {
    try { await axios.delete(`${API}/${id}`); } catch {}
    setTodos((prev) => prev.filter((t) => t._id !== id));
  };

  const getGroupedTodos = () => {
    const today = formatDate(new Date());
    let filteredList = [];

    // 필터링 로직 수정: 모든 일반 뷰에서 !t.completed 조건 강제 적용
    switch (view) {
      case "calendar":  
        // 캘린더에서 선택한 날짜의 '미완료' 작업만 표시
        filteredList = todos.filter((t) => t.dueDate === formatDate(selectedDate) && !t.completed);
        break;
      case "today":     
        filteredList = todos.filter((t) => t.dueDate === today && !t.completed);
        break;
      case "important": 
        filteredList = todos.filter((t) => t.important && !t.completed);
        break;
      case "tasks":     
        filteredList = todos.filter((t) => !t.completed);
        break;
      case "completed": 
        filteredList = todos.filter((t) => t.completed);
        break;
      default:          
        filteredList = todos;
    }

    filteredList.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    const groups = {};
    filteredList.forEach(todo => {
      let groupKey = "기한 없음";
      if (todo.dueDate) {
        const [year, month] = todo.dueDate.split("-");
        groupKey = `${year}년 ${parseInt(month)}월`;
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(todo);
    });

    return groups;
  };

  const getTileClassName = ({ date, view: v }) => {
    if (v === 'month') {
      const dateStr = formatDate(date);
      // 캘린더 타일 강조 표시도 '미완료'된 항목이 있을 때만 나타나도록 수정
      const hasPending = todos.some(t => t.dueDate === dateStr && !t.completed);
      return hasPending ? "has-pending-task" : null;
    }
    return null;
  };

  const currentNav = NAV.find((n) => n.id === view);
  const groupedTodos = getGroupedTodos();

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{STYLE}</style>

      <aside style={{ width: sidebarOpen ? 280 : 0, transition: "0.3s", background: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div onClick={() => setView("calendar")} style={{ padding: "30px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>✓</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#1e293b", letterSpacing: "-0.5px" }}>To Do List</span>
        </div>
        <nav style={{ flex: 1, padding: "10px" }}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 15, padding: "12px 18px", borderRadius: 12, border: "none", cursor: "pointer",
              background: view === item.id ? "#eff6ff" : "transparent", color: view === item.id ? "#2563eb" : "#64748b",
              textAlign: "left", marginBottom: 4, transition: "0.2s", fontWeight: view === item.id ? 700 : 500
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "18px 25px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}>☰</button>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#334155", margin: 0 }}>{currentNav?.label}</h2>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "30px 25px" }}>
          <div style={{ maxWidth: 850, margin: "0 auto" }}>
            
            {view === "calendar" && (
              <div style={{ marginBottom: "35px" }}>
                <Calendar onChange={setSelectedDate} value={selectedDate} tileClassName={getTileClassName} locale="ko-KR" calendarType="gregory" />
              </div>
            )}

            {view !== "completed" && (
              <div style={{ background: "white", borderRadius: 14, padding: "10px 15px", display: "flex", alignItems: "center", gap: 12, marginBottom: 25, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} placeholder={currentNav?.placeholder} style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1e293b", padding: "10px" }} />
                {(view === "important" || view === "tasks") && (
                  <input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 10px", fontSize: "13px", color: "#475569", outline: "none", cursor: "pointer" }} />
                )}
                <button onClick={addTodo} style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>추가</button>
              </div>
            )}

            {Object.keys(groupedTodos).length > 0 ? (
              Object.entries(groupedTodos).map(([group, list]) => (
                <div key={group} style={{ marginBottom: "30px" }}>
                  {view !== "calendar" && (
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "12px", paddingLeft: "5px", borderLeft: "4px solid #cbd5e1" }}>
                      {group}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {list.map((todo) => (
                      <TodoItem 
                        key={todo._id} 
                        todo={todo} 
                        onToggle={toggleTodo} 
                        onDelete={deleteTodo} 
                        isCompletedView={view === "completed"} 
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                <p style={{ fontSize: "15px" }}>{view === "completed" ? "아직 완료된 작업이 없습니다." : "진행 중인 작업이 없습니다."}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, isCompletedView }) {
  const importantStyle = todo.important && !todo.completed ? { borderLeft: "5px solid #f59e0b" } : { borderLeft: "5px solid transparent" };

  return (
    <div style={{ 
      display: "flex", alignItems: "center", gap: 15, background: "white", borderRadius: 12, padding: "14px 20px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", transition: "0.2s",
      ...importantStyle
    }}>
      <input 
        type="checkbox" 
        checked={todo.completed} 
        onChange={() => onToggle(todo)} 
        disabled={isCompletedView}
        style={{ width: 22, height: 22, cursor: isCompletedView ? "default" : "pointer", accentColor: "#2563eb" }} 
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: todo.completed ? "#cbd5e1" : (todo.important ? "#b45309" : "#334155") }}>
          {todo.title}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{todo.dueDate}</div>
      </div>
      <button onClick={() => onDelete(todo._id)} style={{ background: "none", border: "none", color: "#fda4af", cursor: "pointer", fontSize: 18 }}>✕</button>
    </div>
  );
}