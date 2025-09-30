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
  <div className={`absolute w-4 h-4 bg-gradient-to-br from-blue-500/70 to-blue-700/60 rounded-full border border-blue-400/50 shadow-xl ${className}`}></div>
);

// Animated Background Component
const AnimatedBackground = () => (
  <>
    {/* Floating Orbs */}
    <div className="absolute top-20 left-20 w-8 h-8 bg-gradient-to-br from-blue-500/50 to-blue-700/40 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
    <div className="absolute top-40 right-32 w-6 h-6 bg-gradient-to-br from-blue-600/45 to-blue-800/35 rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
    <div className="absolute bottom-40 left-32 w-7 h-7 bg-gradient-to-br from-blue-400/40 to-blue-600/30 rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
    <div className="absolute bottom-20 right-20 w-5 h-5 bg-gradient-to-br from-blue-500/45 to-blue-700/35 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
    
    {/* Animated Lines */}
    <div className="absolute top-1/4 left-0 w-48 h-1 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
    <div className="absolute bottom-1/3 right-0 w-36 h-1 bg-gradient-to-l from-transparent via-blue-400/40 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
    <div className="absolute top-1/2 left-1/4 w-32 h-1 bg-gradient-to-r from-transparent via-blue-400/35 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
  </>
);

// Logo Component
const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <span className="text-2xl">⚡</span>
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur opacity-50"></div>
    </div>
    <div className="flex items-center">
      <span className="text-2xl font-bold text-white">Exam</span>
      <span className="text-2xl font-bold text-blue-400">Volt</span>
    </div>
  </div>
);

// Navbar Component
function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl shadow-2xl border-b border-blue-900/30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
            <Logo />
          </Link>
        </div>
        <ul className="hidden md:flex gap-8 text-base font-medium">
          <li><a href="/success-stories" className="text-blue-300 drop-shadow-[0_1px_6px_rgba(80,180,255,0.5)] hover:text-blue-400 transition-colors duration-200">Success Stories</a></li>
          <li><a href="/blog" className="text-blue-300 drop-shadow-[0_1px_6px_rgba(80,180,255,0.5)] hover:text-blue-400 transition-colors duration-200">Blog</a></li>
          <li><a href="/about" className="text-blue-300 drop-shadow-[0_1px_6px_rgba(80,180,255,0.5)] hover:text-blue-400 transition-colors duration-200">About Us</a></li>
          <li><a href="/contact" className="text-blue-300 drop-shadow-[0_1px_6px_rgba(80,180,255,0.5)] hover:text-blue-400 transition-colors duration-200">Contact Us</a></li>
        </ul>
        <div className="flex gap-3 ml-6">
          <Link to="/register" className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-900 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-800 hover:to-blue-900 transition-all duration-200">Register</Link>
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

export default function SuccessStories() {
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
    <div className="font-['Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] bg-gradient-to-br from-black via-neutral-900 to-black min-h-screen flex flex-col relative overflow-hidden">
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
            Success <span className="text-blue-400">Stories</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-12">
            Discover how educational institutions and organizations are transforming their assessment processes with ExamVolt
          </p>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 px-4 relative">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">Tech University</h3>
                  <p className="text-blue-300">Leading Engineering Institution</p>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed mb-4">
                "ExamVolt revolutionized our examination process. We've seen a 40% reduction in administrative workload and improved student satisfaction scores by 85%."
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-300">
                <span>• 15,000+ students</span>
                <span>• 95% efficiency gain</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">Global Corp</h3>
                  <p className="text-blue-300">Fortune 500 Company</p>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed mb-4">
                "The AI-powered proctoring and real-time analytics have transformed our employee training program. We've achieved 90% completion rates."
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-300">
                <span>• 50,000+ employees</span>
                <span>• 90% completion rate</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">Certification Institute</h3>
                  <p className="text-blue-300">Professional Certifications</p>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed mb-4">
                "ExamVolt's security features and global accessibility have made our certification process seamless and trustworthy worldwide."
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-300">
                <span>• 100+ countries</span>
                <span>• 99.9% uptime</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">Online Academy</h3>
                  <p className="text-blue-300">Digital Learning Platform</p>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed mb-4">
                "The comprehensive analytics and automated grading have allowed us to scale our online courses to serve 100,000+ students globally."
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-300">
                <span>• 100,000+ students</span>
                <span>• 24/7 availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Testimonials Section */}
      <section className="py-16 px-4 relative">
        <AnimatedBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-white text-center mb-12">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="ml-4">
                  <h4 className="text-blue-400 font-semibold">Dr. Sarah Johnson</h4>
                  <p className="text-blue-300 text-sm">Dean of Engineering</p>
                </div>
              </div>
              <p className="text-blue-200 text-sm italic">
                "ExamVolt has transformed how we conduct examinations. The AI proctoring gives us confidence in exam integrity while the analytics help us improve our curriculum."
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  MK
                </div>
                <div className="ml-4">
                  <h4 className="text-blue-400 font-semibold">Michael Chen</h4>
                  <p className="text-blue-300 text-sm">Training Director</p>
                </div>
              </div>
              <p className="text-blue-200 text-sm italic">
                "The real-time results and comprehensive reporting have made our employee training program more effective than ever. Highly recommended!"
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  AL
                </div>
                <div className="ml-4">
                  <h4 className="text-blue-400 font-semibold">Dr. Lisa Anderson</h4>
                  <p className="text-blue-300 text-sm">Academic Director</p>
                </div>
              </div>
              <p className="text-blue-200 text-sm italic">
                "The platform's ease of use and robust security features have made it our go-to solution for all assessment needs. Our students love the interface."
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 