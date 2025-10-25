import App from "./App.jsx";
import "./index.css";

// main.jsx
import ReactDOM from "react-dom/client";

// StrictMode 래퍼 제거 (개발 중 일시적으로)
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
