import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { Edit, Save, X } from "lucide-react";

const ProfilePage = () => {
  const { user, token, updateUser } = useAuthStore();
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setForm(res.data.obj || {});
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchProfile();
  }, [user?._id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm({ ...form, [parent]: { ...form[parent], [child]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setForm(res.data.obj || {});
      updateUser(res.data.obj || {});
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 via-blue-100 to-white">
        <div className="w-80 h-60 bg-white/70 rounded-3xl shadow-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url("/images/profile-back.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-28 -right-28 w-64 h-64 bg-yellow-800 rounded-full opacity-10" />

        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          My <span className="text-yellow-800">Profile</span>
        </h2>

        {editing ? (
          <div className="grid grid-cols-1 gap-4">
            {/* Common Fields */}
            {[
              "firstName",
              "lastName",
              "email",
              "phone",
              "section",
              "className",
              "dateOfBirth",
              "gender",
            ].map((field) => (
              <div key={field} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  {field.replace(/([A-Z])/g, " $1")}
                </label>

                {field === "dateOfBirth" ? (
                  <input
                    type="date"
                    name={field}
                    value={form[field] ? form[field].slice(0, 10) : ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                  />
                ) : field === "gender" ? (
                  <select
                    name={field}
                    value={form[field] || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name={field}
                    value={form[field] || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                    placeholder={field}
                  />
                )}
              </div>
            ))}

            {/* Organisation Section */}
            <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 shadow-sm">
              <h3 className="text-md font-semibold text-gray-800 mb-3">
                Organisation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["name", "address"].map((sub) => (
                  <div key={sub} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Organisation {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </label>
                    <input
                      name={`organisation.${sub}`}
                      value={form.organisation?.[sub] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Role-specific */}
            {form.role === "student" && (
              <>
                {["rollNumber", "gradeLevel", "department"].map((f) => (
                  <div key={f} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {f}
                    </label>
                    <input
                      name={f}
                      value={form[f] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                    />
                  </div>
                ))}
                {["name", "phone"].map((f) => (
                  <div key={f} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Guardian {f.charAt(0).toUpperCase() + f.slice(1)}
                    </label>
                    <input
                      name={`guardian.${f}`}
                      value={form.guardian?.[f] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                    />
                  </div>
                ))}
              </>
            )}

            {form.role === "teacher" && (
              <>
                {[
                  "employeeId",
                  "subjects",
                  "department",
                  "designation",
                  "experienceYears",
                  "joiningDate",
                ].map((f) => (
                  <div key={f} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {f}
                    </label>
                    <input
                      name={f}
                      value={
                        f === "subjects"
                          ? (form.subjects || []).join(", ")
                          : form[f] || ""
                      }
                      onChange={(e) => {
                        if (f === "subjects") {
                          setForm({
                            ...form,
                            subjects: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          });
                        } else {
                          handleChange(e);
                        }
                      }}
                      type={
                        f === "experienceYears"
                          ? "number"
                          : f === "joiningDate"
                          ? "date"
                          : "text"
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-700 focus:border-yellow-700 outline-none"
                    />
                  </div>
                ))}
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-yellow-700 hover:bg-yellow-600 text-white font-semibold shadow"
              >
                <Save size={18} /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-gray-700">
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
              <b>DOB:</b>{" "}
              {form.dateOfBirth
                ? new Date(form.dateOfBirth).toLocaleDateString()
                : "—"}
            </p>
            <p>
              <b>Gender:</b> {form.gender || "—"}
            </p>
            <p>
              <b>Organisation:</b> {form.organisation?.name || "—"},{" "}
              {form.organisation?.address || "—"}
            </p>
            <p>
              <b>Role:</b> {form.role}
            </p>

            {form.role === "student" && (
              <>
                <p>
                  <b>Roll Number:</b> {form.rollNumber || "—"}
                </p>
                <p>
                  <b>Grade Level:</b> {form.gradeLevel || "—"}
                </p>
                <p>
                  <b>Department:</b> {form.department || "—"}
                </p>
                <p>
                  <b>Guardian:</b> {form.guardian?.name || "—"} (
                  {form.guardian?.phone || "—"})
                </p>
              </>
            )}
            {form.role === "teacher" && (
              <>
                <p>
                  <b>Employee ID:</b> {form.employeeId || "—"}
                </p>
                <p>
                  <b>Subjects:</b> {(form.subjects || []).join(", ") || "—"}
                </p>
                <p>
                  <b>Department:</b> {form.department || "—"}
                </p>
                <p>
                  <b>Designation:</b> {form.designation || "—"}
                </p>
                <p>
                  <b>Experience:</b> {form.experienceYears || 0} years
                </p>
                <p>
                  <b>Joining Date:</b>{" "}
                  {form.joiningDate
                    ? new Date(form.joiningDate).toLocaleDateString()
                    : "—"}
                </p>
              </>
            )}

            <button
              onClick={() => setEditing(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2 rounded-md bg-yellow-700 hover:bg-yellow-600 text-white font-semibold shadow transition"
            >
              <Edit size={18} /> Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
