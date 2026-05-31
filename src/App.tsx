import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import ContentArea from "./components/layout/ContentArea";
import Toast from "./components/common/Toast";
import Generate from "./routes/Generate";
import Edit from "./routes/Edit";
import Library from "./routes/Library";
import Templates from "./routes/Templates";
import Settings from "./routes/Settings";

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <ContentArea>
        <Routes>
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/edit" element={<Edit />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </ContentArea>
      <Toast />
    </div>
  );
}

export default App;
