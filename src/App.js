import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App dark" data-testid="app-root">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:section" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(10,10,12,0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f4f4f5",
            backdropFilter: "blur(14px)",
          },
        }}
      />
    </div>
  );
}

export default App;
