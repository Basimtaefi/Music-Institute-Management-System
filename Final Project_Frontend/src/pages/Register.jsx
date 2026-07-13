import { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../api";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("student");
  const [instrumentFocus, setInstrumentFocus] = useState("Piano");
  const [specialization, setSpecialization] = useState("Piano");
  const [error, setError] = useState("");
    
  const handleFullNameChange = (event) => {
    const newText = event.target.value
    setFullName(newText)
  }

  const handleEmailChange = (event) => {
    const newText = event.target.value
    setEmail(newText)
  }

  const handlePasswordChange = (event) => {
    const newText = event.target.value
    setPassword(newText)
  }

  const handlePhoneChange = (event) => {
    const newText = event.target.value
    setPhone(newText)
  }

  const handleRoleChange = (event) => {
    const newText = event.target.value
    setRole(newText)
  }

  const handleInstrumentFocusChange = (event) => {
    const newText = event.target.value
    setInstrumentFocus(newText)
  }

  const handleSpecializationChange = (event) => {
    const newText = event.target.value
    setSpecialization(newText)
  }

  const handleRegister = async (event) => {

    try {
      await post('/register', {
        full_name: fullName,
        email,
        password,
        phone,
        role,
        instrument_focus: instrumentFocus,
        specialization,
      })
      window.location.href = '/login'
    } catch (err) {
      setError(err.message)
    }
  }  

   return (
    <div className="registration-page">
      <h2>Register</h2>

      <div className="register-fields">
        {error && <p className="error-text">{error}</p>}

        <label>Full Name:</label>
        <input type="text" placeholder="Enter full name" value={fullName} onChange={handleFullNameChange} />

        <label>Email:</label>
        <input type="email" placeholder="Enter email" value={email} onChange={handleEmailChange} />

        <label>Password:</label>
        <input type="password" placeholder="Enter password" value={password} onChange={handlePasswordChange} />

        <label>Phone:</label>
        <input type="text" placeholder="Enter phone number" value={phone} onChange={handlePhoneChange} />

        <label>Role:</label>
        <label>
          <input type="radio" name="role" value="student" checked={role === "student"} onChange={handleRoleChange}/>
          Student
        </label>
        <label>
          <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={handleRoleChange}/>
          Teacher
        </label>

        {role === 'student' && (
          <>
            <label>Instrument Focus:</label>
            <select value={instrumentFocus} onChange={handleInstrumentFocusChange}>
              <option value="Piano">Piano</option>
              <option value="Violin">Violin</option>
              <option value="Guitar">Guitar</option>
              <option value="Vocal Training">Vocal</option>
              <option value="Drums">Drums</option>
            </select>
          </>
        )}

        {role === 'teacher' && (
          <>
            <label>Specialization:</label>
            <select value={specialization} onChange={handleSpecializationChange}>
              <option value="Piano">Piano</option>
              <option value="Violin">Violin</option>
              <option value="Guitar">Guitar</option>
              <option value="Vocal Training">Vocal</option>
              <option value="Drums">Drums</option>
            </select>
          </>
        )}

        <button type="button" onClick={handleRegister}>Register</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>

      </div>
    </div>
  );
}
