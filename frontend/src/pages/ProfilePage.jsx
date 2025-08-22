import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Reuse Crystal Animation
const CrystalElement = ({
  className,
  delay = 0,
  duration = 10,
  size = "w-4 h-4",
  movementType = "float",
}) => {
  const getMovementStyle = () => {
    switch (movementType) {
      case "float":
        return {
          animation: `float ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        };
      case "drift":
        return {
          animation: `drift ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        };
      case "sway":
        return {
          animation: `sway ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        };
      default:
        return {
          animation: `float ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        };
    }
  };
  return (
    <div
      className={`${className} ${size} bg-gradient-to-br from-black/80 to-zinc-900/70 rounded-lg backdrop-blur-sm border border-zinc-700/60 shadow-xl`}
      style={getMovementStyle()}
    />
  );
};

// Floating Crystals
const FloatingCrystals = () => (
  <>
    <CrystalElement
      className="absolute top-20 left-20"
      delay={0}
      duration={8}
      size="w-8 h-8"
      movementType="float"
    />
    <CrystalElement
      className="absolute top-40 right-32"
      delay={1}
      duration={10}
      size="w-6 h-6"
      movementType="drift"
    />
    <CrystalElement
      className="absolute bottom-40 left-32"
      delay={2}
      duration={12}
      size="w-7 h-7"
      movementType="sway"
    />
    <CrystalElement
      className="absolute bottom-20 right-20"
      delay={0.5}
      duration={9}
      size="w-5 h-5"
      movementType="float"
    />
  </>
);

const ProfilePage = () => {
  const { user, token, updateUser } = useAuthStore();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updateUser(res.data.obj);
        setForm(res.data.obj);
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
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(res.data.obj);
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (loading) return <p className="text-center mt-6 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden flex items-center justify-center p-6">
      {/* Background animations */}
      <FloatingCrystals />

      {/* Profile Card */}
      <div className="w-full max-w-lg p-6 rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 relative z-20">
        <h2
          className="text-4xl font-extrabold text-transparent bg-clip-text 
               bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
               drop-shadow-md mb-6 text-center"
        >
          My Profile
        </h2>

        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-white mb-1">First Name</label>
              <input
                name="firstName"
                value={form.firstName || ""}
                onChange={handleChange}
                placeholder="First Name"
                className="border border-zinc-700 rounded-lg p-2 bg-zinc-900/60 text-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-1">Last Name</label>
              <input
                name="lastName"
                value={form.lastName || ""}
                onChange={handleChange}
                placeholder="Last Name"
                className="border border-zinc-700 rounded-lg p-2 bg-zinc-900/60 text-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-1">Phone</label>
              <input
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
                placeholder="Phone"
                className="border border-zinc-700 rounded-lg p-2 bg-zinc-900/60 text-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-1">Section</label>
              <input
                name="section"
                value={form.section || ""}
                onChange={handleChange}
                placeholder="Section"
                className="border border-zinc-700 rounded-lg p-2 bg-zinc-900/60 text-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white mb-1">Class</label>
              <input
                name="className"
                value={form.className || ""}
                onChange={handleChange}
                placeholder="Class"
                className="border border-zinc-700 rounded-lg p-2 bg-zinc-900/60 text-white"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-zinc-300">
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
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
             text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl 
             transition-all duration-300 ease-in-out"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes drift {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, -20px);
          }
        }
        @keyframes sway {
          0%,
          100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
