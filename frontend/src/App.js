import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import SearchResults from "@/pages/SearchResults";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import BookSchedule from "@/pages/BookSchedule";
import DashboardRouter from "@/pages/DashboardRouter";
import ETicket from "@/pages/ETicket";
import Reschedule from "@/pages/Reschedule";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/book/:scheduleId" element={<BookSchedule />} />
            <Route path="/ticket/:bookingId" element={<ETicket />} />
            <Route path="/reschedule/:bookingId" element={<Reschedule />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton />
      </AuthProvider>
    </div>
  );
}

export default App;
