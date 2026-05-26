import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import ContentArea from "./components/layout/ContentArea";
import Toast from "./components/common/Toast";
import ChatMode from "./routes/ChatMode";
import Settings from "./routes/Settings";

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <ContentArea>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatMode />} />
          <Route path="/chat/:conversationId" element={<ChatMode />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </ContentArea>
      <Toast />
    </div>
  );
}

export default App;
