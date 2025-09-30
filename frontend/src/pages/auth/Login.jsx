import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";

const LoginSchema = Yup.object().shape({
  role: Yup.string().required("Role is required"),
  email: Yup.string()
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, fetchProfileGoogle, fetchProfile } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("googleSuccess") === "true" && params.get("token")) {
      const token = params.get("token");
      localStorage.setItem("token", token);
      const payload = JSON.parse(atob(token.split(".")[1]));
      login(payload, token);
      fetchProfileGoogle();
      navigate(`/${payload.role}`);
    }
  }, [login, navigate, fetchProfileGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 via-blue-100 to-white px-4"
    style={{
    backgroundImage: `url("/images/back-image-min.jpg")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}>
      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-yellow-800 rounded-full opacity-20"></div>

        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <svg
            width="36"
            height="36"
            viewBox="0 0 32 32"
            fill="none"
            className="text-blue-600"
          >
            <path
              d="M13 2L4 18H14L11 30L28 10H17L20 2H13Z"
              fill="currentColor"
            />
          </svg>
          <span className="ml-2 text-2xl font-bold text-gray-800">
            Exam<span className="text-blue-600">Volt</span>
          </span>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sign in to your account
        </p>

        {/* Role Selection */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          {["student", "teacher", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                selectedRole === role
                  ? "bg-yellow-800 text-white shadow"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
        {/* Google Sign-In Section */}
        <div className="flex flex-col gap-3 mb-4">
          <a
            href={`${
              import.meta.env.VITE_API_URL
            }/api/user/auth/google?role=${selectedRole}`}
            className="w-full py-2 rounded-md bg-yellow-700 hover:bg-yellow-600 text-white text-center font-semibold shadow-sm"
          >
            Continue with Google
          </a>
          <div className="text-center text-gray-400 text-sm">or</div>
        </div>

        {/* Formik Form */}
        <Formik
          initialValues={{ role: selectedRole, email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setError("");
            try {
              const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/user/login`,
                {
                  email: values.email,
                  password: values.password,
                  role: selectedRole,
                }
              );
              localStorage.setItem("token", res.data.token);
              login(res.data.user, res.data.token);
              await fetchProfile();
              toast.success("Login Successful");
              navigate(`/${selectedRole}`);
            } catch (err) {
              setError(err.response?.data?.message || "Login failed");
              toast.error("Login Failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email Address
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Password
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter your password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {error && (
                <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 rounded-md bg-yellow-700 hover:bg-yellow-600 text-white font-semibold shadow-sm"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </Form>
          )}
        </Formik>

        {/* Footer */}
        <p className="mt-5 text-xs text-gray-500 text-center">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
