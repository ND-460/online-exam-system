import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = "", prefix = "", decimals = 0 }) => {
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
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

// Smooth Parallax Component
const ParallaxElement = ({ children, speed = 0.5, className = "", direction = "vertical" }) => {
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  );
};

// Crystal Element Component
const CrystalElement = ({ className = "" }) => (
  <div className={`absolute w-4 h-4 bg-gradient-to-br from-black/80 to-zinc-900/70 rounded-full border border-zinc-700/60 shadow-xl ${className}`}></div>
);

// Animated Background Component
const AnimatedBackground = () => (
  <>
    {/* Floating Orbs - now dark/black theme */}
    <div className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-black/60 to-zinc-900/40 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
    <div className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-zinc-900/50 to-black/30 rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
    <div className="absolute bottom-40 left-32 w-7 h-7 bg-gradient-to-br from-black/40 to-zinc-800/30 rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
    <div className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-zinc-900/30 to-black/20 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
    {/* Animated Lines - now dark/gray theme */}
    <div className="absolute top-1/4 left-0 w-48 h-1 bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
    <div className="absolute bottom-1/3 right-0 w-36 h-1 bg-gradient-to-l from-transparent via-zinc-800/35 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
    <div className="absolute top-1/2 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
  </>
);

// Logo Component (gradient bolt, ExamVolt as one word, Exam white, Volt gray, no gap)
const Logo = ({ size = 'text-2xl', boltSize = 28, gap = 'gap-3' }) => (
  <div className={`flex items-center ${gap}`}>
    <svg width={boltSize} height={boltSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bolt-gradient" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB347" />
          <stop offset="1" stopColor="#FF5F6D" />
        </linearGradient>
      </defs>
      <path d="M13 2L4 18H14L11 30L28 10H17L20 2H13Z" fill="url(#bolt-gradient)" />
    </svg>
    <span className={`${size} font-bold`}>
      <span className="text-white">Exam</span><span className="text-zinc-400">Volt</span>
    </span>
  </div>
);

// Navbar Component
function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
            <Logo />
          </Link>
        </div>
        <ul className="hidden md:flex gap-8 text-base font-medium">
          <li><a href="/solutions" className="text-blue-400 font-semibold">Solutions</a></li>
          <li><a href="/success-stories" className="hover:text-blue-400 text-blue-200 transition-colors duration-200">Success Stories</a></li>
          <li><a href="/blog" className="hover:text-blue-400 text-blue-200 transition-colors duration-200">Blog</a></li>
          <li><a href="/about" className="hover:text-blue-400 text-blue-200 transition-colors duration-200">About Us</a></li>
          <li><a href="/contact" className="hover:text-blue-400 text-blue-200 transition-colors duration-200">Contact Us</a></li>
        </ul>
        <div className="flex gap-3 ml-6">
          <Link to="/register" className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200">Register</Link>
          <Link to="/login" className="px-6 py-2 rounded-lg bg-white/10 text-blue-200 font-semibold shadow-md hover:bg-white/20 border border-white/20 transition-all duration-200">Login</Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-blue-200 py-8 mt-auto border-t border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <div className="flex gap-6 text-blue-200 text-base">
          <Link to="/solutions" className="hover:text-blue-400 transition-colors duration-200">Solutions</Link>
          <Link to="/success-stories" className="hover:text-blue-400 transition-colors duration-200">Success Stories</Link>
          <Link to="/blog" className="hover:text-blue-400 transition-colors duration-200">Blog</Link>
          <Link to="/about" className="hover:text-blue-400 transition-colors duration-200">About Us</Link>
          <Link to="/contact" className="hover:text-blue-400 transition-colors duration-200">Contact Us</Link>
        </div>
      </div>
      <div className="text-center text-blue-300 text-sm mt-6">© 2025 ExamVolt.com. All rights reserved.</div>
    </footer>
  );
}

export default function Solutions() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="font-['Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen flex flex-col relative overflow-hidden">
      {/* Global Parallax Elements */}
      <ParallaxElement speed={0.6} className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-blue-500/50 to-blue-700/40 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={0.2} className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-blue-600/45 to-blue-800/35 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={0.8} className="absolute bottom-40 left-32 w-7 h-7 bg-gradient-to-br from-blue-400/40 to-blue-600/30 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.0} className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-blue-500/45 to-blue-700/35 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.2} className="absolute top-1/3 left-1/4 w-4 h-4 bg-gradient-to-br from-blue-600/40 to-blue-800/30 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.4} className="absolute top-1/2 right-1/4 w-6 h-6 bg-gradient-to-br from-blue-400/45 to-blue-600/35 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={0.9} className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-gradient-to-br from-blue-500/40 to-blue-700/30 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.3} className="absolute top-1/4 right-1/6 w-3 h-3 bg-gradient-to-br from-blue-600/45 to-blue-800/35 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.1} className="absolute bottom-1/4 left-1/6 w-3 h-3 bg-gradient-to-br from-blue-400/40 to-blue-600/30 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={0.7} className="absolute top-2/3 left-1/3 w-4 h-4 bg-gradient-to-br from-blue-500/45 to-blue-700/35 rounded-full animate-pulse z-50" />
      
      {/* Additional floating elements */}
      <ParallaxElement speed={0.5} className="absolute top-1/6 left-1/3 w-6 h-6 bg-gradient-to-br from-blue-500/50 to-blue-700/40 rounded-lg animate-pulse z-50" />
      <ParallaxElement speed={1.5} className="absolute top-3/4 right-1/6 w-5 h-5 bg-gradient-to-br from-blue-600/45 to-blue-800/35 rounded-lg animate-pulse z-50" />
      <ParallaxElement speed={0.8} className="absolute bottom-1/6 right-1/3 w-4 h-4 bg-gradient-to-br from-blue-400/40 to-blue-600/30 rounded-lg animate-pulse z-50" />
      <ParallaxElement speed={1.0} className="absolute top-1/2 left-1/6 w-7 h-7 bg-gradient-to-br from-blue-500/45 to-blue-700/35 rounded-lg animate-pulse z-50" />
      
      {/* More visible elements */}
      <ParallaxElement speed={0.4} className="absolute top-32 left-1/2 w-10 h-10 bg-gradient-to-br from-blue-600/60 to-blue-800/50 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.6} className="absolute top-96 right-1/3 w-8 h-8 bg-gradient-to-br from-blue-500/55 to-blue-700/45 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={0.3} className="absolute bottom-32 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-600/50 to-blue-800/40 rounded-full animate-pulse z-50" />
      <ParallaxElement speed={1.7} className="absolute bottom-96 right-1/4 w-9 h-9 bg-gradient-to-br from-blue-500/55 to-blue-700/45 rounded-full animate-pulse z-50" />
      
      {/* Mouse Follow Effect */}
      <div 
        className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out z-10"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
          transform: 'translate(-50%, -50%)',
        }}
      />

      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4 relative">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Our <span className="text-blue-400">Solutions</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-12">
            Comprehensive examination solutions designed for modern educational institutions and corporate training programs
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 px-4 relative">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Advanced Security</h3>
              <p className="text-blue-200 leading-relaxed">
                AI-powered proctoring, browser lockdown, and real-time monitoring to ensure exam integrity.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Analytics Dashboard</h3>
              <p className="text-blue-200 leading-relaxed">
                Comprehensive reporting and analytics to track performance and improve outcomes.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Real-time Results</h3>
              <p className="text-blue-200 leading-relaxed">
                Instant grading and immediate feedback for efficient assessment management.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🌐</span>
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Global Access</h3>
              <p className="text-blue-200 leading-relaxed">
                Cloud-based platform accessible from anywhere, anytime, on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 relative">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-blue-200 font-medium">Institutions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                <AnimatedCounter end={100000} suffix="+" />
              </div>
              <div className="text-blue-200 font-medium">Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                <AnimatedCounter end={99.9} suffix="%" decimals={1} />
              </div>
              <div className="text-blue-200 font-medium">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                <AnimatedCounter end={24} suffix="/7" />
              </div>
              <div className="text-blue-200 font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 