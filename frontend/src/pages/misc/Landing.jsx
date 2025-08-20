// src/pages/misc/Landing.jsx
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Spline from "@splinetool/react-spline";

// Spline 3D Model Component
const SplineModel = () => {
  return (
    <div className="absolute bottom-0 right-0 w-96 h-96 z-5 pointer-events-none">
      <Spline scene="https://prod.spline.design/iUtJNNzoQ3gWfdJ3/scene.splinecode" />
    </div>
  );
};

// Typing Animation Component
const TypingAnimation = ({ text, speed = 100 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isDeleting && currentIndex < text.length) {
      // Typing
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentIndex === text.length) {
      // Pause at the end, then start deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); // Wait 2 seconds before deleting
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText.length > 0) {
      // Deleting
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, speed / 2); // Delete faster than typing
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText.length === 0) {
      // Reset for next cycle
      setIsDeleting(false);
      setCurrentIndex(0);
    }
  }, [currentIndex, text, speed, isDeleting, displayText]);

  return (
    <span className="inline-block">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Animated Counter Component
const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    const startValue = 0;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (end - startValue) * easeOutQuart;

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  const formatNumber = (num) => {
    if (decimals > 0) {
      return num.toFixed(decimals);
    }
    return Math.floor(num).toLocaleString();
  };

  return (
    <span ref={counterRef} className="inline-block">
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
};

// Smooth Parallax Component with optimized performance
const ParallaxElement = ({
  children,
  speed = 0.5,
  className = "",
  direction = "vertical",
}) => {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const updateTransform = () => {
      if (elementRef.current) {
        const scrollY = window.pageYOffset;
        const newOffset = scrollY * speed;
        setOffset(newOffset);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(updateTransform);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed]);

  const getTransform = () => {
    if (direction === "horizontal") {
      return `translateX(${offset}px)`;
    } else if (direction === "both") {
      return `translate(${offset * 0.5}px, ${offset}px)`;
    } else {
      return `translateY(${offset}px)`;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`${className} will-change-transform`}
      style={{
        transform: getTransform(),
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  );
};

// Custom ExamVolt Logo with gradient bolt, white 'Exam', gray 'Volt', no gap between ExamVolt
const Logo = ({ size = "text-2xl", boltSize = 28, gap = "gap-3" }) => (
  <div className={`flex items-center ${gap}`}>
    <svg
      width={boltSize}
      height={boltSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="bolt-gradient"
          x1="0"
          y1="0"
          x2="0"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFB347" />
          <stop offset="1" stopColor="#FF5F6D" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L4 18H14L11 30L28 10H17L20 2H13Z"
        fill="url(#bolt-gradient)"
      />
    </svg>
    <span className={`${size} font-bold`}>
      <span className="text-white">Exam</span>
      <span className="text-zinc-400">Volt</span>
    </span>
  </div>
);

function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <Logo />
            {/* <span className="text-lg font-semibold text-white tracking-wide ml-2">ExammVolt</span> */}
          </Link>
        </div>
        <ul className="hidden md:flex gap-8 text-base font-medium">
          <li>
            <Link
              to="/solutions"
              className="hover:text-blue-400 text-blue-200 transition-colors duration-200"
            >
              Solutions
            </Link>
          </li>
          <li>
            <Link
              to="/success-stories"
              className="hover:text-blue-400 text-blue-200 transition-colors duration-200"
            >
              Success Stories
            </Link>
          </li>
          <li>
            <Link
              to="/blog"
              className="hover:text-blue-400 text-blue-200 transition-colors duration-200"
            >
              Blog
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="hover:text-blue-400 text-blue-200 transition-colors duration-200"
            >
              About Us
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="hover:text-blue-400 text-blue-200 transition-colors duration-200"
            >
              Contact Us
            </Link>
          </li>
        </ul>
        <div className="flex gap-3 ml-6">
          <Link
            to="/register"
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="px-6 py-2 rounded-lg bg-white/10 text-blue-200 font-semibold shadow-md hover:bg-white/20 border border-white/20 transition-all duration-200"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex justify-center text-center pt-48 overflow-hidden">
      {/* Smooth Parallax Background Layers */}
      <ParallaxElement speed={0.6} className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1500&q=80"
          alt="Hero background"
          className="w-full h-full object-cover scale-110 brightness-10"
        />
      </ParallaxElement>

      <ParallaxElement speed={0.2} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 to-black/90 animate-gradient-x" />
      </ParallaxElement>

      {/* Smooth Parallax Floating Elements */}
      <ParallaxElement
        speed={0.8}
        className="absolute inset-0 z-1 pointer-events-none"
      >
        <div
          className="absolute top-20 left-20 w-8 h-8 bg-white/30 rounded-full animate-pulse hover:scale-200 transition-transform duration-300"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute top-40 right-32 w-6 h-6 bg-orange-400/40 rounded-full animate-pulse hover:scale-250 transition-transform duration-300"
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className="absolute bottom-40 left-32 w-6 h-6 bg-blue-400/35 rounded-full animate-pulse hover:scale-200 transition-transform duration-300"
          style={{ animationDuration: "5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-4 h-4 bg-purple-400/35 rounded-full animate-pulse hover:scale-250 transition-transform duration-300"
          style={{ animationDuration: "7s" }}
        ></div>
        <div
          className="absolute top-1/4 right-1/4 w-10 h-10 bg-yellow-400/30 rounded-full animate-pulse hover:scale-200 transition-transform duration-300"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-cyan-400/30 rounded-full animate-pulse hover:scale-250 transition-transform duration-300"
          style={{ animationDuration: "8s" }}
        ></div>
      </ParallaxElement>

      {/* Smooth Parallax Background Shapes */}
      <ParallaxElement
        speed={1.0}
        className="absolute inset-0 z-1 pointer-events-none"
      >
        <div
          className="absolute top-10 left-10 w-60 h-60 bg-gradient-to-br from-blue-400/15 to-purple-500/15 rounded-full animate-spin hover:scale-150 transition-transform duration-500"
          style={{ animationDuration: "30s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-orange-400/15 to-blue-500/15 rounded-full animate-spin hover:scale-150 transition-transform duration-500"
          style={{ animationDuration: "25s", animationDirection: "reverse" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-36 h-36 bg-gradient-to-br from-purple-400/15 to-orange-500/15 rounded-full animate-spin hover:scale-175 transition-transform duration-500"
          style={{ animationDuration: "35s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/4 w-42 h-42 bg-gradient-to-br from-green-400/12 to-blue-500/12 rounded-full animate-spin hover:scale-150 transition-transform duration-500"
          style={{ animationDuration: "40s", animationDirection: "reverse" }}
        ></div>
      </ParallaxElement>

      {/* Smooth Parallax Animated Lines */}
      <ParallaxElement
        speed={1.2}
        className="absolute inset-0 z-1 pointer-events-none"
      >
        <div
          className="absolute top-1/4 left-0 w-48 h-1 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-0 w-36 h-1 bg-gradient-to-l from-transparent via-blue-400/40 to-transparent animate-pulse"
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-purple-400/35 to-transparent animate-pulse"
          style={{ animationDuration: "5s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-40 h-1 bg-gradient-to-l from-transparent via-yellow-400/30 to-transparent animate-pulse"
          style={{ animationDuration: "7s" }}
        ></div>
      </ParallaxElement>

      {/* Smooth Parallax Floating Icons */}
      <ParallaxElement
        speed={1.4}
        className="absolute inset-0 z-1 pointer-events-none"
      >
        <div
          className="absolute top-1/3 left-1/8 text-3xl opacity-25 animate-bounce"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        >
          ⚡
        </div>
        <div
          className="absolute bottom-1/3 right-1/8 text-3xl opacity-25 animate-bounce"
          style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
        >
          🔒
        </div>
        <div
          className="absolute top-1/2 left-1/2 text-3xl opacity-20 animate-bounce"
          style={{ animationDuration: "6s", animationDelay: "1.5s" }}
        >
          📈
        </div>
        <div
          className="absolute bottom-1/2 right-1/2 text-3xl opacity-20 animate-bounce"
          style={{ animationDuration: "4.5s", animationDelay: "0.8s" }}
        >
          🛡️
        </div>
      </ParallaxElement>

      {/* Smooth Parallax Geometric Shapes */}
      <ParallaxElement
        speed={0.9}
        direction="both"
        className="absolute inset-0 z-1 pointer-events-none"
      >
        <div
          className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-br from-orange-400/20 to-red-500/20 transform rotate-45 animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-32 left-40 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 transform rotate-12 animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-500/20 transform rotate-30 animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
      </ParallaxElement>

      {/* Spline 3D Model */}
      <SplineModel />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 flex flex-col items-center">
        {/* Logo - No Interactions (Hero Section) */}
        <div className="mb-12 -mt-16 w-full max-w-5xl">
          <div className="flex items-center gap-8 mb-8">
            <Logo size="text-8xl" boltSize={80} gap="gap-8" />
          </div>
        </div>

        {/* Tagline with Subtle Effects - Centered */}
        <div className="relative group text-center mb-8">
          <h1 className="text-2xl sm:text-2xl lg:text-2xl font-bold text-white mb-6 drop-shadow-lg min-h-[2rem] transform transition-all duration-500 group-hover:scale-102 group-hover:translate-y-[-2px] cursor-pointer">
            <TypingAnimation
              text="Your Gateway to Smarter Assessments"
              speed={80}
            />
          </h1>
          {/* Subtle glow effect on hover */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"></div>
        </div>

        {/* Professional Action Buttons - Centered */}
        <div className="flex gap-6 mt-8 animate-fade-in-up">
          <Link
            to="/register"
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link to="/success-stories">
          <button className="group relative px-8 py-4 bg-white/10 text-blue-200 font-bold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden border border-white/20 hover:bg-white/20">
            <span className="relative z-10">Learn More</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          </Link>
        </div>

        {/* Subtle Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 group cursor-pointer">
          <div className="w-6 h-10 border-2 border-blue-400/50 rounded-full flex justify-center group-hover:border-blue-400 transition-colors duration-300">
            <div
              className="w-1 h-3 bg-blue-400/70 rounded-full mt-2 animate-pulse group-hover:bg-blue-400 transition-colors duration-300"
              style={{ animationDuration: "2s" }}
            ></div>
          </div>
        </div>
      </div>

      {/* CSS for enhanced animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 20s ease infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.5s ease-out;
        }
        .scale-102 {
          transform: scale(1.02);
        }
        .scale-150 {
          transform: scale(1.5);
        }
        .scale-175 {
          transform: scale(1.75);
        }
        .scale-200 {
          transform: scale(2);
        }
        .scale-250 {
          transform: scale(2.5);
        }
        .will-change-transform {
          will-change: transform;
        }
      `}</style>
    </section>
  );
}

function WhyCustomSolution() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Smooth Parallax Background Elements */}
      <ParallaxElement
        speed={0.5}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-10 right-10 w-48 h-48 bg-gradient-to-br from-blue-500/15 to-blue-700/10 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-br from-blue-600/12 to-blue-800/8 rounded-full"></div>
        <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-600/6 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-to-br from-blue-500/8 to-blue-700/5 rounded-full"></div>
      </ParallaxElement>

      {/* Smooth Parallax Floating Elements */}
      <ParallaxElement
        speed={0.8}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute top-1/4 right-1/4 w-6 h-6 bg-blue-500/25 rounded-full animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-blue-600/30 rounded-full animate-pulse"
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/6 w-5 h-5 bg-blue-400/25 rounded-full animate-pulse"
          style={{ animationDuration: "5s" }}
        ></div>
      </ParallaxElement>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Why Choose ExamVolt?
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Experience a comprehensive examination system designed for modern
            education and corporate training needs
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Features */}
          <div className="space-y-8">
            <div className="flex items-start gap-6 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  Advanced Analytics & Reporting
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  Get detailed insights into student performance, question
                  analysis, and comprehensive reports to improve your
                  examination strategies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  Secure & Anti-Cheating Features
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  Browser lockdown, screen monitoring, and AI-powered proctoring
                  ensure exam integrity and prevent malpractice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  Real-time Assessment
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  Instant grading, immediate feedback, and automated result
                  generation for efficient examination management.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">
                  Customizable Question Types
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  Support for MCQs, essays, coding challenges, and multimedia
                  questions to create comprehensive assessments.
                </p>
              </div>
            </div>

            <button className="w-full mt-8 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Explore ExamVolt Features
            </button>
          </div>

          {/* Right: Stats & Integration */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <AnimatedCounter end={10000} suffix="+" duration={2500} />
                </div>
                <div className="text-blue-200 font-medium">Active Students</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <AnimatedCounter end={500} suffix="+" duration={2000} />
                </div>
                <div className="text-blue-200 font-medium">Exams Conducted</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <AnimatedCounter
                    end={99.9}
                    suffix="%"
                    decimals={1}
                    duration={3000}
                  />
                </div>
                <div className="text-blue-200 font-medium">Uptime</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  <AnimatedCounter
                    end={24}
                    prefix=""
                    suffix="/7"
                    duration={1500}
                  />
                </div>
                <div className="text-blue-200 font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Offerings() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Smooth Parallax Background Pattern */}
      <ParallaxElement speed={0.4} className="absolute inset-0 opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </ParallaxElement>

      {/* Smooth Parallax Floating Elements */}
      <ParallaxElement
        speed={0.7}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute top-20 left-20 w-16 h-16 bg-blue-500/15 rounded-full animate-pulse"
          style={{ animationDuration: "5s" }}
        ></div>
        <div
          className="absolute bottom-40 right-40 w-12 h-12 bg-blue-600/20 rounded-full animate-pulse"
          style={{ animationDuration: "7s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-8 h-8 bg-blue-400/18 rounded-full animate-pulse"
          style={{ animationDuration: "6s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-blue-500/15 rounded-full animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
      </ParallaxElement>

      {/* Smooth Parallax Geometric Shapes */}
      <ParallaxElement
        speed={0.9}
        direction="both"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-10 right-1/4 w-20 h-20 bg-gradient-to-br from-blue-500/12 to-blue-700/8 transform rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-blue-600/8 transform rotate-12"></div>
        <div className="absolute top-1/3 right-1/6 w-24 h-24 bg-gradient-to-br from-blue-500/8 to-blue-700/6 transform rotate-30"></div>
      </ParallaxElement>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            ExamVolt Assessment Platform
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            Advanced online examination system with AI-powered proctoring and
            comprehensive analytics
          </p>
        </div>

        {/* Features in Left-Right Layout */}
        <div className="space-y-12">
          {/* Row 1: AI-Powered Proctoring & Instant Auto-Grading */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      AI-Powered Proctoring
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Advanced monitoring and detection systems ensure exam
                      integrity with real-time AI analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-slate-700 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      Instant Auto-Grading
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Immediate results and feedback with automated grading for
                      efficient assessment management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Performance Analytics & Smart Notifications */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-700 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      Performance Analytics
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Detailed insights and comprehensive reports to track
                      student progress and exam performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      Smart Notifications
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Automated alerts and reminders to keep students and
                      administrators informed in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Browser Lockdown & Comprehensive Reports */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      Browser Lockdown
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Secure exam environment with browser restrictions to
                      prevent cheating and maintain integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3">
                      Comprehensive Reports
                    </h3>
                    <p className="text-blue-200 leading-relaxed text-lg">
                      Detailed performance metrics and analytics to help improve
                      examination strategies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button - Centered */}
        <div className="text-center mt-16">
          <Link to="/register">
          <button className="px-12 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-blue-800">
            Get Started with ExamVolt
          </button>
          </Link>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-blue-200 mb-4 text-lg">Need a custom solution?</p>
          <Link to="/contact">
            <button className="px-8 py-3 rounded-xl bg-white/10 text-blue-200 font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300">
              Contact Our Team
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black text-blue-200 py-8 mt-auto border-t border-slate-700/20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <div className="flex gap-6 text-blue-200 text-base">
          <Link
            to="/solutions"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            Solutions
          </Link>
          <Link
            to="/success-stories"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            Success Stories
          </Link>
          <Link
            to="/blog"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            Blog
          </Link>
          <Link
            to="/about"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            Contact Us
          </Link>
        </div>
      </div>
      <div className="text-center text-blue-300 text-sm mt-6">
        © 2025 ExamVolt.com. All rights reserved.
      </div>
    </footer>
  );
}

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="font-['Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] bg-gradient-to-br from-black via-black to-slate-900 min-h-screen flex flex-col relative overflow-hidden">
      {/* Global Parallax Elements - Available throughout the page */}
      <ParallaxElement
        speed={0.6}
        className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-black/60 to-blue-700/40 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.2}
        className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-black/50 to-blue-800/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.8}
        className="absolute bottom-40 left-32 w-7 h-7 bg-gradient-to-br from-black/40 to-blue-600/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.0}
        className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-black/45 to-blue-700/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.2}
        className="absolute top-1/3 left-1/4 w-4 h-4 bg-gradient-to-br from-black/40 to-blue-800/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.4}
        className="absolute top-1/2 right-1/4 w-6 h-6 bg-gradient-to-br from-black/45 to-blue-600/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.9}
        className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-gradient-to-br from-black/40 to-blue-700/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.3}
        className="absolute top-1/4 right-1/6 w-3 h-3 bg-gradient-to-br from-black/45 to-blue-800/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.1}
        className="absolute bottom-1/4 left-1/6 w-3 h-3 bg-gradient-to-br from-black/40 to-blue-600/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.7}
        className="absolute top-2/3 left-1/3 w-4 h-4 bg-gradient-to-br from-black/45 to-blue-700/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.6}
        className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-black/95 to-slate-800/40 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.2}
        className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-black/90 to-slate-900/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.8}
        className="absolute bottom-40 left-32 w-7 h-7 bg-gradient-to-br from-black/85 to-slate-700/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.0}
        className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-black/95 to-slate-900/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.2}
        className="absolute top-1/3 left-1/4 w-4 h-4 bg-gradient-to-br from-black/85 to-slate-800/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.4}
        className="absolute top-1/2 right-1/4 w-6 h-6 bg-gradient-to-br from-black/90 to-slate-700/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.9}
        className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-gradient-to-br from-black/85 to-slate-900/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.3}
        className="absolute top-1/4 right-1/6 w-3 h-3 bg-gradient-to-br from-black/90 to-slate-800/35 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.1}
        className="absolute bottom-1/4 left-1/6 w-3 h-3 bg-gradient-to-br from-black/85 to-slate-700/30 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.7}
        className="absolute top-2/3 left-1/3 w-4 h-4 bg-gradient-to-br from-black/95 to-slate-900/35 rounded-full animate-pulse z-50"
      />

      {/* Additional floating elements for more visual interest */}
      <ParallaxElement
        speed={0.5}
        className="absolute top-1/6 left-1/3 w-6 h-6 bg-gradient-to-br from-black/50 to-blue-700/40 rounded-lg animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.5}
        className="absolute top-3/4 right-1/6 w-5 h-5 bg-gradient-to-br from-black/45 to-blue-800/35 rounded-lg animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.8}
        className="absolute bottom-1/6 right-1/3 w-4 h-4 bg-gradient-to-br from-black/40 to-blue-600/30 rounded-lg animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.0}
        className="absolute top-1/2 left-1/6 w-7 h-7 bg-gradient-to-br from-black/45 to-blue-700/35 rounded-lg animate-pulse z-50"
      />

      {/* More visible elements with higher opacity */}
      <ParallaxElement
        speed={0.4}
        className="absolute top-32 left-1/2 w-10 h-10 bg-gradient-to-br from-black/70 to-blue-800/50 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.6}
        className="absolute top-96 right-1/3 w-8 h-8 bg-gradient-to-br from-black/60 to-blue-700/45 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={0.3}
        className="absolute bottom-32 left-1/4 w-12 h-12 bg-gradient-to-br from-black/60 to-blue-800/40 rounded-full animate-pulse z-50"
      />
      <ParallaxElement
        speed={1.7}
        className="absolute bottom-96 right-1/4 w-9 h-9 bg-gradient-to-br from-black/60 to-blue-700/45 rounded-full animate-pulse z-50"
      />

      {/* Mouse Follow Effect */}
      <div
        className="absolute w-[600px] h-[600px] bg-gradient-to-l from-black/30 to-blue-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out z-10"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
          transform: "translate(-50%, -50%)",
        }}
      />

      <Navbar />
      <Hero />
      <WhyCustomSolution />
      <Offerings />
      <Footer />
    </div>
  );
}
