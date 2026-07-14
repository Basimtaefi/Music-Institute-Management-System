import { useState, useEffect } from "react";
import { get, put } from "../../api";

export default function Profile() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await get("/manager/profile");
      setFullName(data.full_name);
      setPhone(data.phone);
      setEmail(data.email);
      setPassword(data.password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFullNameChange = (event) => {
    const newText = event.target.value;
    setFullName(newText);
  };

  const handlePhoneChange = (event) => {
    const newText = event.target.value;
    setPhone(newText);
  };

  const handleEmailChange = (event) => {
    const newText = event.target.value;
    setEmail(newText);
  };

  const handlePasswordChange = (event) => {
    const newText = event.target.value;
    setPassword(newText);
  };

  const handleSubmit = async () => {
    setError("");

    try {
      await put("/manager/profile", {
        full_name: fullName,
        phone: phone,
        email: email,
        password: password,
      });
      window.alert("Profile has been updated!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>My Profile</h2>
      {error && <p className="error-text">{error}</p>}

      <div>
        <label>Full Name:</label>
        <input type="text" value={fullName} onChange={handleFullNameChange} />

        <label>Phone:</label>
        <input type="text" value={phone} onChange={handlePhoneChange} />

        <label>Email:</label>
        <input type="email" value={email} onChange={handleEmailChange} />

        <label>Password:</label>
        <input type="password" value={password} onChange={handlePasswordChange} />

        <button type="button" onClick={handleSubmit}>Update Profile</button>
      </div>
    </div>
  );
}