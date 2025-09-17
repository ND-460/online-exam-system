import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[A-Za-z]+$/, "First name must contain only alphabets")
    .required("First name is required"),

  lastName: Yup.string()
    .matches(/^[A-Za-z]+$/, "Last name must contain only alphabets")
    .required("Last name is required"),

  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm your password"),

  phone: Yup.string()
    .matches(/^\+?\d{10,15}$/, "Invalid phone number")
    .required("Phone number is required"),

  section: Yup.string(),
  className: Yup.string().required("Class is required"),

  dateOfBirth: Yup.date()
    .max(new Date(), "Date of birth cannot be in the future")
    .required("Date of birth is required"),

  gender: Yup.string()
    .oneOf(["Male", "Female", "Other"], "Invalid gender")
    .required("Gender is required"),

  organisationName: Yup.string(),
  organisationAddress: Yup.string(),
});

// Minimal crystal/animated background components omitted for brevity
// Include your CrystalElement, FloatingCrystals, AnimatedBackground here if needed

export default function Register() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleMouseMove = (e) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden flex items-center justify-center p-4">
      {/* AnimatedBackground and FloatingCrystals can be added here */}

      <div className="w-full max-w-sm py-5 px-5 rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 relative overflow-hidden z-20">
        <h2 className="text-xl font-bold text-white mb-3 text-center">
          Create Account
        </h2>
        <p className="text-zinc-400 text-center mb-4 text-sm">
          Join ExamVolt and start your journey
        </p>

        {/* Role Selection */}
        <div className="mb-4">
          <label className="block mb-2 font-medium text-zinc-400 text-center text-sm">
            I am a
          </label>
          <div className="flex gap-2">
            {["student", "teacher", "admin"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm ${
                  selectedRole === role
                    ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg"
                    : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/80"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Google OAuth */}
        <div className="flex flex-col gap-3 mb-3 w-full">
          <a
            href={`${
              import.meta.env.VITE_API_URL
            }/api/user/auth/google?role=${selectedRole}`}
            className="w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-center font-bold shadow-md transition-transform hover:scale-105"
          >
            Continue with Google
          </a>
          <div className="text-center text-zinc-500 font-medium text-sm">
            or
          </div>
        </div>

        {/* Registration Form */}
        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
            phone: "",
            section: "",
            className: "",
            dateOfBirth: "",
            gender: "Other",
            organisationName: "",
            organisationAddress: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            if (
              (selectedRole === "student" || selectedRole === "teacher") &&
              !values.className
            ) {
              setError("Class is required for students and teachers");
              setSubmitting(false);
              return;
            }

            setError("");
            setSuccess("");
            try {
              const payload = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                password: values.password,
                phone: values.phone,
                section: values.section,
                className: values.className,
                dateOfBirth: values.dateOfBirth,
                gender: values.gender,
                role: selectedRole,
                organisation: {
                  name: values.organisationName,
                  address: values.organisationAddress,
                },
              };

              const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/user/signup`,
                payload
              );
              const { token, user } = res.data;
              login(user, token);
              toast.success("Registration Successful, Redirecting to login...");
              setSuccess("Registration successful! Redirecting to login...");
              resetForm();
              setTimeout(() => navigate("/login"), 2000);
            } catch (err) {
              console.error("Signup error:", err.response?.data);
              toast.error("Registration failed");
              setError(err.response?.data?.message || "Registration failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-3 w-full">
              {/* Name, Email, Password Fields */}
              <FieldGroup
                label="First Name"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
              />
              <FieldGroup
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
              />
              <FieldGroup
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
              />
              <FieldGroup
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
              />
              <FieldGroup
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
              />

              {/* Additional Fields */}
              <FieldGroup
                label="Phone"
                name="phone"
                type="text"
                placeholder="Enter your phone number"
              />
              {(selectedRole === "student" || selectedRole === "teacher") && (
                <>
                  <FieldGroup
                    label="Section"
                    name="section"
                    type="text"
                    placeholder="Enter your section"
                  />
                  <FieldGroup
                    label="Class"
                    name="className"
                    type="text"
                    placeholder="Enter your class"
                  />
                </>
              )}
              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Date of Birth
                </label>
                <Field
                  type="date"
                  name="dateOfBirth"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                />
                <ErrorMessage
                  name="dateOfBirth"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Gender
                </label>
                <Field
                  as="select"
                  name="gender"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Field>
                <ErrorMessage
                  name="gender"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

              {selectedRole === "teacher" && (
                <>
                  <FieldGroup
                    label="Organisation Name"
                    name="organisationName"
                    type="text"
                    placeholder="Enter organisation name"
                  />
                  <FieldGroup
                    label="Organisation Address"
                    name="organisationAddress"
                    type="text"
                    placeholder="Enter organisation address"
                  />
                </>
              )}

              {error && (
                <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-400 text-xs bg-green-900/20 p-2 rounded-lg border border-green-500/30">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-black to-zinc-900 text-white font-bold shadow-lg hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Sign Up"}
              </button>
            </Form>
          )}
        </Formik>

        <p className="mt-3 text-xs text-zinc-400 text-center">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-zinc-300 font-semibold hover:text-zinc-200"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

// Helper FieldGroup component
function FieldGroup({ label, name, type, placeholder }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-zinc-400 text-sm">
        {label}
      </label>
      <Field
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
      />
      <ErrorMessage
        name={name}
        component="div"
        className="text-red-400 text-xs mt-1"
      />
    </div>
  );
}
