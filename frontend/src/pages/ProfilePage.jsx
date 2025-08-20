import { useEffect, useState } from "react";
import axios from "axios";


const ProfilePage = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile/${userId}`).then((res) => {
      setUser(res.data);
      setForm(res.data);
    });
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios.put(`${import.meta.env.VITE_API_URL}/api/user/profile/${userId}`, form).then((res) => {
      setUser(res.data);
      setEditing(false);
    });
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto shadow-lg rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      
      {editing ? (
        <>
          <input name="firstName" value={form.firstName} onChange={handleChange} />
          <input name="lastName" value={form.lastName} onChange={handleChange} />
          <input name="phone" value={form.phone} onChange={handleChange} />
          <input name="section" value={form.section} onChange={handleChange} />
          <input name="className" value={form.className} onChange={handleChange} />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <div>
          <p><b>Name:</b> {user.firstName} {user.lastName}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Phone:</b> {user.phone}</p>
          <p><b>Section:</b> {user.section}</p>
          <p><b>Class:</b> {user.className}</p>
          <p><b>Role:</b> {user.role}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
