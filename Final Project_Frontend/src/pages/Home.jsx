import { Link } from "react-router-dom";
import { getUser } from "../auth";

export default function Home() {
  const user = getUser();

  return (
    <div>
      <h2>Welcome, {user.full_name}</h2>

      {user.role === "student" && (
        <div>
          <Link to="/student/classes">Browse & Enroll</Link>
          <br />
          <Link to="/student/my-classes">My Classes</Link>
          <br />
          <Link to="/student/reservations">Practice Room Reservations</Link>
          <br />
          <Link to="/student/instrument-loans">Instrument Loans</Link>
          <br />
          <Link to="/student/attendance">My Attendance</Link>
          <br />
          <Link to="/student/profile">Profile</Link>
        </div>
      )}

      {user.role === "teacher" && (
        <div>
          <Link to="/teacher/my-classes">My Classes</Link>
          <br />
          <Link to="/teacher/reservations">Room Reservations</Link>
          <br />
          <Link to="/teacher/profile">Profile</Link>
        </div>
      )}

      {user.role === "manager" && (
        <div>
          <Link to="/manager/students">Students</Link>
          <br />
          <Link to="/manager/teachers">Teachers</Link>
          <br />
          <Link to="/manager/classes">Classes</Link>
          <br />
          <Link to="/manager/rooms">Rooms</Link>
          <br />
          <Link to="/manager/instruments">Instruments</Link>
          <br />
          <Link to="/manager/loans">Instrument Loans</Link>
          <br />
          <Link to="/manager/reservations">Reservations</Link>
          <br />
          <Link to="/manager/profile">Profile</Link>
        </div>
      )}
    </div>
  );
}
