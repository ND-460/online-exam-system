import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";
import "./Register.css"; 

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[A-Za-z]+$/, "First name must contain only alphabets")
    .required("First name is required"),
  lastName: Yup.string()
    .matches(/^[A-Za-z]+$/, "Last name must contain only alphabets")
    .required("Last name is required"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm your password"),
  phone: Yup.string()
    .matches(/^\+?\d{10,15}$/, "Invalid phone number")
    .required("Phone number is required"),
  section: Yup.string(),
  className: Yup.string().required("Class is required"),
  dateOfBirth: Yup.date().max(new Date(), "Date of birth cannot be in the future").required("Date of birth is required"),
  gender: Yup.string().oneOf(["Male", "Female", "Other"], "Invalid gender").required("Gender is required"),
  organisationName: Yup.string(),
  organisationAddress: Yup.string(),
});

export default function Register() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="decorative-circle"></div>

        <div className="logo">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <path d="M13 2L4 18H14L11 30L28 10H17L20 2H13Z" fill="#2563EB" />
          </svg>
          <span className="logo-text">
            Exam<span className="logo-highlight">Volt</span>
          </span>
        </div>

        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join ExamVolt and start your journey</p>

        {/* Role Selection */}
        <div className="role-selection">
          {["student", "teacher", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`role-button ${selectedRole === role ? "active" : ""}`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        {/* Google OAuth */}
        <div className="google-login">
          <a href={`${import.meta.env.VITE_API_URL}/api/user/auth/google?role=${selectedRole}`} className="google-button">
            Continue with Google
          </a>
          <div className="or-text">or</div>
        </div>

        {/* Formik Form */}
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
            if ((selectedRole === "student" || selectedRole === "teacher") && !values.className) {
              setError("Class is required for students and teachers");
              setSubmitting(false);
              return;
            }
            setError("");
            setSuccess("");
            try {
              const payload = {
                ...values,
                role: selectedRole,
                organisation: {
                  name: values.organisationName,
                  address: values.organisationAddress,
                },
              };
              const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/signup`, payload);
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
            <Form className="form-grid">
              <div className="form-column">
                <FieldGroup label="First Name" name="firstName" type="text" placeholder="Enter your first name" />
                <FieldGroup label="Last Name" name="lastName" type="text" placeholder="Enter your last name" />
                <FieldGroup label="Email" name="email" type="email" placeholder="Enter your email" />
                <FieldGroup label="Phone" name="phone" type="text" placeholder="Enter your phone number" />
                <FieldGroup label="Date of Birth" name="dateOfBirth" type="date" />

                <div>
                  <label className="field-label">Gender</label>
                  <Field as="select" name="gender" className="field-input">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Field>
                  <ErrorMessage name="gender" component="div" className="field-error" />
                </div>
              </div>

              <div className="form-column">
                <FieldGroup label="Password" name="password" type="password" placeholder="Enter your password" />
                <FieldGroup label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" />

                {(selectedRole === "student" || selectedRole === "teacher") && (
                  <>
                    <FieldGroup label="Section" name="section" type="text" placeholder="Enter your section" />
                    <FieldGroup label="Class" name="className" type="text" placeholder="Enter your class" />
                  </>
                )}

                {selectedRole === "teacher" && (
                  <>
                    <FieldGroup label="Organisation Name" name="organisationName" type="text" placeholder="Enter organisation name" />
                    <FieldGroup label="Organisation Address" name="organisationAddress" type="text" placeholder="Enter organisation address" />
                  </>
                )}
              </div>

              <div className="form-feedback">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
              </div>

              <div className="form-submit">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Sign Up"}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <p className="register-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}

// Reusable Field
function FieldGroup({ label, name, type, placeholder }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <Field type={type} name={name} placeholder={placeholder} className="field-input" />
      <ErrorMessage name={name} component="div" className="field-error" />
    </div>
  );
}
