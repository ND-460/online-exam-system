import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const ProfilePage = () => {
  const { user, token, updateUser } = useAuthStore();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // fetch full user profile when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // backend response = { obj }
        updateUser(res.data.obj); // update Zustand
        setForm(res.data.obj); // set local state
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setLoading(false);
      }
    };

    if (user?._id) fetchProfile();
  }, [user?._id, token, updateUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // if the field belongs to profileInfo
    if (form.profileInfo && name in form.profileInfo) {
      setForm({
        ...form,
        profileInfo: { ...form.profileInfo, [name]: value },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
  try {
    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
      form,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    updateUser(res.data.obj); 
    setEditing(false);
  } catch (err) {
    console.error("Error updating profile:", err);
  }
};


  if (loading) return <p className="text-center mt-6">Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto shadow-lg rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      {editing ? (
        <div className="flex flex-col gap-2">
          {/* Basic Fields */}
          <input
            name="firstName"
            value={form.firstName || ""}
            onChange={handleChange}
            placeholder="First Name"
            className="border p-2 rounded"
          />
          <input
            name="lastName"
            value={form.lastName || ""}
            onChange={handleChange}
            placeholder="Last Name"
            className="border p-2 rounded"
          />
          <input
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            placeholder="Phone"
            className="border p-2 rounded"
          />

          {/* ProfileInfo Subfields */}
          <input
            name="section"
            value={form.profileInfo?.section || ""}
            onChange={handleChange}
            placeholder="Section"
            className="border p-2 rounded"
          />
          <input
            name="className"
            value={form.profileInfo?.className || ""}
            onChange={handleChange}
            placeholder="Class"
            className="border p-2 rounded"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p>
            <b>Name:</b> {form.firstName} {form.lastName}
          </p>
          <p>
            <b>Email:</b> {form.email}
          </p>
          <p>
            <b>Phone:</b> {form.phone || "—"}
          </p>
          <p>
            <b>Section:</b> {form.section || "—"}
          </p>
          <p>
            <b>Class:</b> {form.className || "—"}
          </p>
          <p>
            <b>Role:</b> {form.role}    
          </p>

          <button
            onClick={() => setEditing(true)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-3"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
