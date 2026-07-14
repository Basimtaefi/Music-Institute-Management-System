import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from "./pages/Home";
import Layout from "./components/Layout";
import CheckLogin from './components/CheckLogin';
import Rooms from './pages/manager/Rooms';
import Instruments from "./pages/manager/Instruments";
import Students from "./pages/manager/Students";
import Teachers from "./pages/manager/Teachers";
import Classes from "./pages/manager/Classes";
import Loans from "./pages/manager/Loans";
import Reservations from "./pages/manager/Reservations";
import Profile from "./pages/manager/Profile";
import BrowseClasses from "./pages/student/BrowseClasses";
import MyClasses from "./pages/student/MyClasses";
import StudentReservations from "./pages/student/Reservations";
import InstrumentLoans from "./pages/student/InstrumentLoans";
import Attendance from "./pages/student/Attendance";
import StudentProfile from "./pages/student/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<CheckLogin><Layout /></CheckLogin>}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

          <Route path="/manager/rooms" element={<Rooms />} />
          <Route path="/manager/instruments" element={<Instruments />} />
          <Route path="/manager/students" element={<Students />} />
          <Route path="/manager/teachers" element={<Teachers />} />
          <Route path="/manager/classes" element={<Classes />} />
          <Route path="/manager/loans" element={<Loans />} />
          <Route path="/manager/reservations" element={<Reservations />} />
          <Route path="/manager/profile" element={<Profile />} />
          
          <Route path="/student/classes" element={<BrowseClasses />} />
          <Route path="/student/my-classes" element={<MyClasses />} />
          <Route path="/student/reservations" element={<StudentReservations />} />
          <Route path="/student/instrument-loans" element={<InstrumentLoans />} />
          <Route path="/student/attendance" element={<Attendance />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}