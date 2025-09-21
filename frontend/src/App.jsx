import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/misc/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Solutions from './pages/misc/Solutions';
import SuccessStories from './pages/misc/SuccessStories';
import Blog from './pages/misc/Blog';
import About from './pages/misc/About';
import Contact from './pages/misc/Contact';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDashboardNew from './pages/admin/AdminDashboardNew';
import Questions from './pages/admin/Questions';
import Results from './pages/admin/Results';
import Analytics from './pages/admin/Analytics';
import StudentDashboard from './pages/student/StudentDashboard';
import Exam from './pages/student/Exam';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import NotFound from './pages/misc/NotFound';
import Error from './pages/misc/Error';
import './App.css';
import ProfilePage from './pages/ProfilePage';
import { ToastContainer } from 'react-toastify';
import "react-datepicker/dist/react-datepicker.css";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminDashboardNew />} />
        <Route path="/admin-old" element={<AdminDashboard />} />
        <Route path="/admin/questions" element={<Questions />} />
        <Route path="/admin/results" element={<Results />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/exam/:testId" element={<Exam />} />
        {/* <Route path="/result" element={<Result />} /> */}
        <Route path="/error" element={<Error />} />
        <Route path='/profile' element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
