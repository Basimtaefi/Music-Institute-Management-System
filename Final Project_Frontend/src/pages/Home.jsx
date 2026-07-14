import { Link } from "react-router-dom";
import { getUser } from "../auth";

export default function Home() {
  const user = getUser();

  return (
    <div>
      <h2>Welcome, {user.full_name}</h2>

      {user.role === "student" && (
        <div className="home-links">
          <Link to="/student/classes">Browse & Enroll</Link>
          <Link to="/student/my-classes">My Classes</Link>
          <Link to="/student/reservations">Practice Room Reservations</Link>
          <Link to="/student/instrument-loans">Instrument Loans</Link>
          <Link to="/student/attendance">My Attendance</Link>
          <Link to="/student/profile">Profile</Link>
        </div>
      )}

      {user.role === "teacher" && (
        <div className="home-links">
          <Link to="/teacher/my-classes">My Classes</Link>
          <Link to="/teacher/reservations">Room Reservations</Link>
          <Link to="/teacher/profile">Profile</Link>
        </div>
      )}

      {user.role === "manager" && (
        <div className="home-links">
          <Link to="/manager/students">Students</Link>
          <Link to="/manager/teachers">Teachers</Link>
          <Link to="/manager/classes">Classes</Link>
          <Link to="/manager/rooms">Rooms</Link>
          <Link to="/manager/instruments">Instruments</Link>
          <Link to="/manager/loans">Instrument Loans</Link>
          <Link to="/manager/reservations">Reservations</Link>
          <Link to="/manager/profile">Profile</Link>
        </div>
      )}
    </div>
  );
}




// <div>
//       <h2>Welcome, {user.full_name}</h2>

//       {user.role === "student" && (
//         <div>
//           <Link to="/student/classes">Browse & Enroll</Link>
//           <br />
//           <Link to="/student/my-classes">My Classes</Link>
//           <br />
//           <Link to="/student/reservations">Practice Room Reservations</Link>
//           <br />
//           <Link to="/student/instrument-loans">Instrument Loans</Link>
//           <br />
//           <Link to="/student/attendance">My Attendance</Link>
//           <br />
//           <Link to="/student/profile">Profile</Link>
//         </div>
//       )}

//       {user.role === "teacher" && (
//         <div>
//           <Link to="/teacher/my-classes">My Classes</Link>
//           <br />
//           <Link to="/teacher/reservations">Room Reservations</Link>
//           <br />
//           <Link to="/teacher/profile">Profile</Link>
//         </div>
//       )}

//       {user.role === "manager" && (
//         <div>
//           <Link to="/manager/students">Students</Link>
//           <br />
//           <Link to="/manager/teachers">Teachers</Link>
//           <br />
//           <Link to="/manager/classes">Classes</Link>
//           <br />
//           <Link to="/manager/rooms">Rooms</Link>
//           <br />
//           <Link to="/manager/instruments">Instruments</Link>
//           <br />
//           <Link to="/manager/loans">Instrument Loans</Link>
//           <br />
//           <Link to="/manager/reservations">Reservations</Link>
//           <br />
//           <Link to="/manager/profile">Profile</Link>
//         </div>
//       )}
//     </div>