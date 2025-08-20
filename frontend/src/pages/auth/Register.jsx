// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Formik, Form, Field, ErrorMessage } from 'formik';
// import * as Yup from 'yup';
// import axios from 'axios';
// import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

// const RegisterSchema = Yup.object().shape({
//   name: Yup.string().required('Name is required'),
//   email: Yup.string().email('Invalid email').required('Email is required'),
//   password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
//   confirmPassword: Yup.string()
//     .oneOf([Yup.ref('password'), null], 'Passwords must match')
//     .required('Confirm your password'),
// });

// // Crystal Animation Component
// const CrystalElement = ({ className, delay = 0, duration = 10, size = 'w-4 h-4', movementType = 'float' }) => {
//   const getMovementStyle = () => {
//     switch (movementType) {
//       case 'float':
//         return {
//           animation: `float ${duration}s ease-in-out infinite`,
//           animationDelay: `${delay}s`
//         };
//       case 'drift':
//         return {
//           animation: `drift ${duration}s ease-in-out infinite`,
//           animationDelay: `${delay}s`
//         };
//       case 'sway':
//         return {
//           animation: `sway ${duration}s ease-in-out infinite`,
//           animationDelay: `${delay}s`
//         };
//       default:
//         return {
//           animation: `float ${duration}s ease-in-out infinite`,
//           animationDelay: `${delay}s`
//         };
//     }
//   };

//   return (
//     <div
//       className={`${className} ${size} bg-gradient-to-br from-black/80 to-zinc-900/70 rounded-lg backdrop-blur-sm border border-zinc-700/60 shadow-xl`}
//       style={getMovementStyle()}
//     />
//   );
// };

// // Floating Crystal Elements
// const FloatingCrystals = () => (
//   <>
//     {/* Large Crystals */}
//     <CrystalElement
//       className="absolute top-20 left-20"
//       delay={0}
//       duration={8}
//       size="w-8 h-8"
//       movementType="float"
//     />
//     <CrystalElement
//       className="absolute top-40 right-32"
//       delay={1}
//       duration={10}
//       size="w-6 h-6"
//       movementType="drift"
//     />
//     <CrystalElement
//       className="absolute bottom-40 left-32"
//       delay={2}
//       duration={12}
//       size="w-7 h-7"
//       movementType="sway"
//     />
//     <CrystalElement
//       className="absolute bottom-20 right-20"
//       delay={0.5}
//       duration={9}
//       size="w-5 h-5"
//       movementType="float"
//     />

//     {/* Medium Crystals */}
//     <CrystalElement
//       className="absolute top-1/3 left-1/4"
//       delay={1.5}
//       duration={11}
//       size="w-4 h-4"
//       movementType="drift"
//     />
//     <CrystalElement
//       className="absolute top-1/2 right-1/4"
//       delay={2.5}
//       duration={7}
//       size="w-6 h-6"
//       movementType="sway"
//     />
//     <CrystalElement
//       className="absolute bottom-1/3 right-1/3"
//       delay={0.8}
//       duration={13}
//       size="w-5 h-5"
//       movementType="float"
//     />
//     <CrystalElement
//       className="absolute top-1/4 right-1/6"
//       delay={1.2}
//       duration={9}
//       size="w-3 h-3"
//       movementType="drift"
//     />

//     {/* Small Crystals */}
//     <CrystalElement
//       className="absolute top-1/6 left-1/3"
//       delay={2.8}
//       duration={14}
//       size="w-2 h-2"
//       movementType="sway"
//     />
//     <CrystalElement
//       className="absolute bottom-1/6 right-1/4"
//       delay={1.8}
//       duration={11}
//       size="w-3 h-3"
//       movementType="float"
//     />
//     <CrystalElement
//       className="absolute top-2/3 left-1/6"
//       delay={0.3}
//       duration={12}
//       size="w-4 h-4"
//       movementType="drift"
//     />
//     <CrystalElement
//       className="absolute bottom-1/4 left-1/6"
//       delay={2.2}
//       duration={8}
//       size="w-2 h-2"
//       movementType="sway"
//     />
//   </>
// );

// // Animated Background Component
// const AnimatedBackground = () => (
//   <>
//     {/* Animated Orbs - now dark/black theme */}
//     <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-black/60 to-zinc-900/40 rounded-full animate-pulse blur-xl" style={{ animationDuration: '6s' }}></div>
//     <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-zinc-900/50 to-black/30 rounded-full animate-pulse blur-xl" style={{ animationDuration: '8s' }}></div>
//     <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-black/40 to-zinc-800/30 rounded-full animate-pulse blur-xl" style={{ animationDuration: '7s' }}></div>
//     <div className="absolute bottom-1/3 left-1/3 w-36 h-36 bg-gradient-to-br from-zinc-900/30 to-black/20 rounded-full animate-pulse blur-xl" style={{ animationDuration: '9s' }}></div>
//     {/* Animated Lines - now dark/gray theme */}
//     <div className="absolute top-1/3 left-0 w-48 h-1 bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
//     <div className="absolute bottom-1/3 right-0 w-36 h-1 bg-gradient-to-l from-transparent via-zinc-800/35 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
//     <div className="absolute top-1/2 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
//     <div className="absolute top-1/3 right-1/3 w-40 h-1 bg-gradient-to-l from-transparent via-zinc-700/25 to-transparent animate-pulse" style={{ animationDuration: '7s' }}></div>
//   </>
// );

// export default function Register() {
//   const [selectedRole, setSelectedRole] = useState('student');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleMouseMove = (e) => {
//       setMousePosition({ x: e.clientX, y: e.clientY });
//     };

//     window.addEventListener('mousemove', handleMouseMove, { passive: true });
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, []);

//   const handleGoogleLogin = async (credentialResponse) => {
//     setError('');
//     try {
//       await axios.post('/api/user/google-login', {
//         credential: credentialResponse.credential,
//         role: selectedRole,
//       });
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Google login failed');
//     }
//   };

//   return (
//     <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
//       <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden flex items-center justify-center p-4">
//         <AnimatedBackground />
//         <FloatingCrystals />

//         {/* Mouse Follow Effect - now dark */}
//         <div
//           className="absolute w-[400px] h-[400px] bg-gradient-to-r from-black/60 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out"
//           style={{
//             left: mousePosition.x - 200,
//             top: mousePosition.y - 200,
//             transform: 'translate(-50%, -50%)',
//           }}
//         />

//         {/* Logo */}
//         <div className="absolute top-6 left-8 flex items-center z-10">
//           <div className="flex items-center">
//             <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <defs>
//                 <linearGradient id="bolt-gradient" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
//                   <stop stopColor="#FFB347" />
//                   <stop offset="1" stopColor="#FF5F6D" />
//                 </linearGradient>
//               </defs>
//               <path d="M13 2L4 18H14L11 30L28 10H17L20 2H13Z" fill="url(#bolt-gradient)" />
//             </svg>
//             <span className="text-2xl font-bold">
//               <span className="text-white">Exam</span><span className="text-zinc-400">Volt</span>
//             </span>
//           </div>
//         </div>

//         {/* Main Form Card - Black theme */}
//         <div className="w-full max-w-sm py-5 px-5 rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 relative overflow-hidden z-20">
//           {/* Card Glow Effect */}
//           <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-black/60 to-zinc-900/40 opacity-60 blur-lg animate-pulse -z-10" />

//           {/* Card Crystal Decorations */}
//           <CrystalElement
//             className="absolute top-3 right-3 animate-pulse"
//             delay={0}
//             duration={2}
//             size="w-3 h-3"
//           />
//           <CrystalElement
//             className="absolute bottom-3 left-3 animate-pulse"
//             delay={1}
//             duration={3}
//             size="w-2 h-2"
//           />

//           <h2 className="text-xl font-bold text-white mb-3 text-center">Create Account</h2>
//           <p className="text-zinc-400 text-center mb-4 text-sm">Join ExamVolt and start your journey</p>

//           {/* Role Selection */}
//           <div className="mb-4">
//             <label className="block mb-2 font-medium text-zinc-400 text-center text-sm">I am a</label>
//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={() => setSelectedRole('student')}
//                 className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
//                   selectedRole === 'student'
//                     ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg'
//                     : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/80'
//                 }`}
//               >
//                 Student
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setSelectedRole('teacher')}
//                 className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
//                   selectedRole === 'teacher'
//                     ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg'
//                     : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/80'
//                 }`}
//               >
//                 Teacher
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setSelectedRole('admin')}
//                 className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
//                   selectedRole === 'admin'
//                     ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg'
//                     : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 hover:border-zinc-700/80'
//                 }`}
//               >
//                 Admin
//               </button>
//             </div>
//           </div>

//           <div className="flex flex-col gap-3 mb-3 w-full">
//             <GoogleLogin
//               onSuccess={handleGoogleLogin}
//               onError={() => setError('Google login failed')}
//               width="100%"
//               theme="filled_black"
//               shape="pill"
//               text="continue_with"
//             />
//             <div className="text-center text-zinc-500 font-medium text-sm">or</div>
//           </div>

//           <Formik
//             initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
//             validationSchema={RegisterSchema}
//             onSubmit={async (values, { setSubmitting, resetForm }) => {
//               setError('');
//               setSuccess('');
//               try {
//                 await axios.post('/api/user/register', {
//                   name: values.name,
//                   email: values.email,
//                   password: values.password,
//                   role: selectedRole,
//                 });
//                 setSuccess('Registration successful! Please login.');
//                 resetForm();
//                 setTimeout(() => navigate('/login'), 1500);
//               } catch (err) {
//                 setError(err.response?.data?.message || 'Registration failed');
//               } finally {
//                 setSubmitting(false);
//               }
//             }}
//           >
//             {({ isSubmitting }) => (
//               <Form className="flex flex-col gap-3 w-full">
//                 <div className="relative">
//                   <label className="block mb-1 font-medium text-zinc-400 text-sm">Full Name</label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <span className="text-zinc-500">👤</span>
//                     </div>
//                     <Field
//                       type="text"
//                       name="name"
//                       className="w-full pl-9 pr-3 py-2 border border-zinc-800/60 rounded-lg focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700 bg-zinc-900/60 backdrop-blur-sm text-white placeholder-zinc-500 transition-all duration-300 text-sm"
//                       placeholder="Enter your full name"
//                     />
//                   </div>
//                   <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
//                 </div>

//                 <div className="relative">
//                   <label className="block mb-1 font-medium text-zinc-400 text-sm">Email Address</label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <span className="text-zinc-500">📧</span>
//                     </div>
//                     <Field
//                       type="email"
//                       name="email"
//                       className="w-full pl-9 pr-3 py-2 border border-zinc-800/60 rounded-lg focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700 bg-zinc-900/60 backdrop-blur-sm text-white placeholder-zinc-500 transition-all duration-300 text-sm"
//                       placeholder="Enter your email"
//                     />
//                   </div>
//                   <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
//                 </div>

//                 <div className="relative">
//                   <label className="block mb-1 font-medium text-zinc-400 text-sm">Password</label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <span className="text-zinc-500">🔒</span>
//                     </div>
//                     <Field
//                       type="password"
//                       name="password"
//                       className="w-full pl-9 pr-10 py-2 border border-zinc-800/60 rounded-lg focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700 bg-zinc-900/60 backdrop-blur-sm text-white placeholder-zinc-500 transition-all duration-300 text-sm"
//                       placeholder="Create a password"
//                     />
//                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                       <button type="button" className="text-zinc-500 hover:text-zinc-400">
//                         👁️
//                       </button>
//                     </div>
//                   </div>
//                   <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
//                 </div>

//                 <div className="relative">
//                   <label className="block mb-1 font-medium text-zinc-400 text-sm">Confirm Password</label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <span className="text-zinc-500">🔒</span>
//                     </div>
//                     <Field
//                       type="password"
//                       name="confirmPassword"
//                       className="w-full pl-9 pr-10 py-2 border border-zinc-800/60 rounded-lg focus:ring-2 focus:ring-zinc-700 focus:border-zinc-700 bg-zinc-900/60 backdrop-blur-sm text-white placeholder-zinc-500 transition-all duration-300 text-sm"
//                       placeholder="Confirm your password"
//                     />
//                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                       <button type="button" className="text-zinc-500 hover:text-zinc-400">
//                         👁️
//                       </button>
//                     </div>
//                   </div>
//                   <ErrorMessage name="confirmPassword" component="div" className="text-red-400 text-xs mt-1" />
//                 </div>

//                 {/* Terms and Conditions */}
//                 <div className="flex items-start gap-2">
//                   <input
//                     type="checkbox"
//                     id="terms"
//                     className="mt-1 w-3 h-3 text-zinc-700 border-zinc-800/60 rounded focus:ring-zinc-700 bg-zinc-900/60"
//                   />
//                   <label htmlFor="terms" className="text-xs text-zinc-400">
//                     I agree to the{' '}
//                     <a href="#" className="text-zinc-300 hover:text-zinc-200 font-medium">Terms and Conditions</a>
//                     {' '}and{' '}
//                     <a href="#" className="text-zinc-300 hover:text-zinc-200 font-medium">Privacy Policy</a>
//                   </label>
//                 </div>

//                 {error && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</div>}
//                 {success && <div className="text-green-400 text-xs bg-green-900/20 p-2 rounded-lg border border-green-500/30">{success}</div>}

//                 <button
//                   type="submit"
//                   className="w-full py-2 rounded-lg bg-gradient-to-r from-black to-zinc-900 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group flex items-center justify-center gap-2 text-sm"
//                   disabled={isSubmitting}
//                 >
//                   <span className="relative z-10">{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
//                   <span className="relative z-10">→</span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                 </button>
//               </Form>
//             )}
//           </Formik>

//           <p className="mt-3 text-xs text-zinc-400 text-center">
//             Already have an account?{' '}
//             <a href="/login" className="text-zinc-300 font-semibold hover:text-zinc-200 transition-colors duration-200">Sign in</a>
//           </p>
//         </div>

//         {/* CSS for enhanced animations */}
//         <style jsx>{`
//           @keyframes float {
//             0%, 100% { transform: translateY(0px) rotate(0deg); }
//             25% { transform: translateY(-20px) rotate(5deg); }
//             50% { transform: translateY(-10px) rotate(0deg); }
//             75% { transform: translateY(-30px) rotate(-5deg); }
//           }

//           @keyframes drift {
//             0%, 100% { transform: translateX(0px) translateY(0px); }
//             25% { transform: translateX(15px) translateY(-15px); }
//             50% { transform: translateX(30px) translateY(-5px); }
//             75% { transform: translateX(15px) translateY(-25px); }
//           }

//           @keyframes sway {
//             0%, 100% { transform: translateX(0px) rotate(0deg); }
//             25% { transform: translateX(-10px) rotate(3deg); }
//             50% { transform: translateX(-20px) rotate(0deg); }
//             75% { transform: translateX(-10px) rotate(-3deg); }
//           }
//         `}</style>
//       </div>
//     </GoogleOAuthProvider>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm your password"),
});

// Crystal Element Component
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
    <CrystalElement
      className="absolute top-1/3 left-1/4"
      delay={1.5}
      duration={11}
      size="w-4 h-4"
      movementType="drift"
    />
    <CrystalElement
      className="absolute top-1/2 right-1/4"
      delay={2.5}
      duration={7}
      size="w-6 h-6"
      movementType="sway"
    />
    <CrystalElement
      className="absolute bottom-1/3 right-1/3"
      delay={0.8}
      duration={13}
      size="w-5 h-5"
      movementType="float"
    />
    <CrystalElement
      className="absolute top-1/4 right-1/6"
      delay={1.2}
      duration={9}
      size="w-3 h-3"
      movementType="drift"
    />
    <CrystalElement
      className="absolute top-1/6 left-1/3"
      delay={2.8}
      duration={14}
      size="w-2 h-2"
      movementType="sway"
    />
    <CrystalElement
      className="absolute bottom-1/6 right-1/4"
      delay={1.8}
      duration={11}
      size="w-3 h-3"
      movementType="float"
    />
    <CrystalElement
      className="absolute top-2/3 left-1/6"
      delay={0.3}
      duration={12}
      size="w-4 h-4"
      movementType="drift"
    />
    <CrystalElement
      className="absolute bottom-1/4 left-1/6"
      delay={2.2}
      duration={8}
      size="w-2 h-2"
      movementType="sway"
    />
  </>
);

// Animated Background
const AnimatedBackground = () => (
  <>
    <div
      className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-black/60 to-zinc-900/40 rounded-full animate-pulse blur-xl"
      style={{ animationDuration: "6s" }}
    />
    <div
      className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-zinc-900/50 to-black/30 rounded-full animate-pulse blur-xl"
      style={{ animationDuration: "8s" }}
    />
    <div
      className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-black/40 to-zinc-800/30 rounded-full animate-pulse blur-xl"
      style={{ animationDuration: "7s" }}
    />
    <div
      className="absolute bottom-1/3 left-1/3 w-36 h-36 bg-gradient-to-br from-zinc-900/30 to-black/20 rounded-full animate-pulse blur-xl"
      style={{ animationDuration: "9s" }}
    />
    <div
      className="absolute top-1/3 left-0 w-48 h-1 bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent animate-pulse"
      style={{ animationDuration: "4s" }}
    />
    <div
      className="absolute bottom-1/3 right-0 w-36 h-1 bg-gradient-to-l from-transparent via-zinc-800/35 to-transparent animate-pulse"
      style={{ animationDuration: "6s" }}
    />
    <div
      className="absolute top-1/2 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-pulse"
      style={{ animationDuration: "5s" }}
    />
    <div
      className="absolute top-1/3 right-1/3 w-40 h-1 bg-gradient-to-l from-transparent via-zinc-700/25 to-transparent animate-pulse"
      style={{ animationDuration: "7s" }}
    />
  </>
);

export default function Register() {
  const [selectedRole, setSelectedRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const {login} = useAuthStore((state) => state.login)

  useEffect(() => {
    const handleMouseMove = (e) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden flex items-center justify-center p-4">
      <AnimatedBackground />
      <FloatingCrystals />

      <div
        className="absolute w-[400px] h-[400px] bg-gradient-to-r from-black/60 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out"
        style={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Main Card */}
      <div className="w-full max-w-sm py-5 px-5 rounded-2xl shadow-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 relative overflow-hidden z-20">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-black/60 to-zinc-900/40 opacity-60 blur-lg animate-pulse -z-10" />
        <CrystalElement
          className="absolute top-3 right-3"
          delay={0}
          duration={2}
          size="w-3 h-3"
        />
        <CrystalElement
          className="absolute bottom-3 left-3"
          delay={1}
          duration={3}
          size="w-2 h-2"
        />

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

        {/* Google Button */}
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
        {/* Email/Password Registration */}
        <Formik
          initialValues={{
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setError("");
            setSuccess("");
            try {
              const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/user/register`,
                {
                  name: values.name,
                  email: values.email,
                  password: values.password,
                  role: selectedRole,
                }
              );
              const {token,user} = res.data
              login(user,token)
              setSuccess("Registration successful! Redirecting to login...");
              resetForm();
              setTimeout(() => navigate("/login"), 2000);
            } catch (err) {
              setError(err.response?.data?.message || "Registration failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-3 w-full">
              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Full Name
                </label>
                <Field
                  type="text"
                  name="name"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                  placeholder="Enter your name"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Email Address
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                  placeholder="Enter your email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Password
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                  placeholder="Enter your password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-zinc-400 text-sm">
                  Confirm Password
                </label>
                <Field
                  type="password"
                  name="confirmPassword"
                  className="w-full pl-3 py-2 border border-zinc-800/60 rounded-lg bg-zinc-900/60 text-white text-sm"
                  placeholder="Confirm your password"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-400 text-xs mt-1"
                />
              </div>

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
}
