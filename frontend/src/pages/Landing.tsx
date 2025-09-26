import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lottie from 'lottie-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, TrendingUp, BarChart, Warehouse, AlertCircle, ArrowRight } from 'lucide-react';
import RippleGrid from '../components/RippleGrid';

// Register the GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  const navigate = useNavigate();
  const main = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [heroAnimation, setHeroAnimation] = useState(null);

  // Load hero animation
  useEffect(() => {
    fetch('/hero.json')
      .then(response => response.json())
      .then(data => setHeroAnimation(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // Custom gradient cursor effect
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.2,
        ease: "power2.out"
      });
    };

    const handleMouseEnter = () => {
      gsap.to(cursor, {
        scale: 1.5,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.querySelectorAll('button, a, .interactive').forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Add floating animation to geometric elements
    gsap.to(".animate-pulse", {
      scale: 1.1,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    // Stagger animation for stats
    gsap.fromTo(".stats-item", 
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: "power3.out",
        stagger: 0.2,
        delay: 1.5 
      }
    );

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.querySelectorAll('button, a, .interactive').forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // --- HERO ANIMATIONS ---
      gsap.fromTo(".hero-title", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.2 }
      );
      gsap.fromTo(".hero-p", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" });
      gsap.fromTo(".hero-btn", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, delay: 0.7, ease: "back.out(1.7)" });
      gsap.fromTo(".hero-visual", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.9, ease: "power3.out" });

      // --- SCROLL-TRIGGERED ANIMATIONS ---
      const sections = gsap.utils.toArray('.animated-section') as HTMLElement[];
      sections.forEach((section) => {
        gsap.fromTo(section,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // --- INTERACTIVE FEATURE SECTION ANIMATION ---
      const features = gsap.utils.toArray('.feature-item') as HTMLElement[];
      const visualContent = gsap.utils.toArray('.visual-content') as HTMLElement[];
      const forecastBars = gsap.utils.toArray('.forecast-bar');

      gsap.set(visualContent, { opacity: 0, scale: 0.9 });
      gsap.set(visualContent[0], { opacity: 1, scale: 1 });
      // Initially set the bars to be invisible before they animate in
      gsap.set(forecastBars, { scaleY: 0, transformOrigin: 'bottom' });

      features.forEach((feature, i) => {
        ScrollTrigger.create({
          trigger: feature,
          start: "top center",
          end: "bottom center",
          onEnter: () => animateFeature(i),
          onEnterBack: () => animateFeature(i),
        });
      });

      const animateFeature = (index: number) => {
        // Animate all visuals out
        gsap.to(visualContent, { 
          opacity: 0, 
          scale: 0.9, 
          duration: 0.3, 
          ease: 'power2.inOut' 
        });
        
        // Animate the selected visual in
        gsap.to(visualContent[index], { 
          opacity: 1, 
          scale: 1, 
          duration: 0.3, 
          delay: 0.1, 
          ease: 'power2.inOut' 
        });
        
        // If it's the first feature (the bar graph), animate the bars
        if (index === 0) {
          gsap.to('.forecast-bar', {
            scaleY: 1, // Animate from 0 (set initially) to 1
            duration: 1,
            ease: 'elastic.out(1, 0.5)',
            stagger: 0.15,
            delay: 0.3, // Wait for the card to fade in
            overwrite: 'auto'
          });
        } else {
          // IMPORTANT: Reset the bars when we are not on the first feature
          gsap.set('.forecast-bar', { scaleY: 0, transformOrigin: 'bottom' });
        }
      };

    }, main); // <- Scope animations to the main container
    
    return () => ctx.revert(); // <- Cleanup
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div ref={main} className="bg-white text-black font-sans antialiased cursor-none relative">
      {/* Simple Visible Cursor */}
      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-[9999] rounded-full bg-black border-2 border-white shadow-lg"
        style={{ 
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-sm border-b border-black/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-black">{import.meta.env.VITE_APP_NAME || 'StockPilot'}</span>
          </div>
          <Button onClick={handleGetStarted} variant="ghost" className="hidden md:block text-black hover:bg-black/5 interactive border border-black/20 hover:border-black">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 relative">
        <section className="px-6 py-20 md:py-32 min-h-screen flex items-center justify-center relative">
          {/* RippleGrid Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <RippleGrid 
              gridColor="#000000"
              rippleIntensity={0.08}
              gridSize={20}
              gridThickness={8}
              fadeDistance={2.0}
              vignetteStrength={1.0}
              glowIntensity={0.05}
              opacity={0.15}
              gridRotation={0}
              mouseInteraction={true}
              mouseInteractionRadius={2.0}
              enableRainbow={false}
            />
          </div>

          {/* Content overlay */}
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <div className="space-y-8">
                {/* Hero Typography */}
                <div>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                    <span className="hero-title block text-black">PRECISION.</span>
                    <span className="hero-title block text-black/60">PROFIT.</span>
                    <span className="hero-title block text-black">PILOT.</span>
                  </h1>
                  
                  {/* Animated divider */}
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-px bg-black/20"></div>
                    <div className="w-3 h-3 border border-black/20 rotate-45 mx-4"></div>
                    <div className="w-12 h-px bg-black/20"></div>
                  </div>
                </div>
                
                {/* Hero Description */}
                <p className="hero-p text-lg md:text-xl text-black/70 font-light leading-relaxed max-w-lg">
                  Transform inventory chaos into <span className="text-black font-medium">predictive intelligence</span>. 
                  Our AI eliminates guesswork, prevents stockouts, and maximizes profits through 
                  <span className="text-black font-medium"> precision automation</span>.
                </p>
                
                {/* CTA Buttons */}
                <div className="hero-btn flex flex-col sm:flex-row gap-6 items-start">
                  <Button 
                    onClick={handleGetStarted} 
                    size="lg" 
                    className="text-base px-12 py-6 bg-black text-white hover:bg-black/90 rounded-none border-0 font-medium tracking-wider interactive group transition-all duration-300 hover:scale-105"
                  >
                    <span>LAUNCH PRECISION</span>
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                  
                  <button className="text-base text-black/60 hover:text-black font-light interactive group transition-all duration-300">
                    <span className="border-b border-black/20 group-hover:border-black">Experience Demo</span>
                    <ArrowRight className="w-4 h-4 ml-2 inline group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Visual */}
              <div className="hero-visual relative">
                <div className="relative">
                  {/* Hero Lottie Animation */}
                  {heroAnimation ? (
                    <Lottie 
                      animationData={heroAnimation}
                      className="w-full h-auto"
                      style={{ maxHeight: '600px' }}
                      loop={true}
                      autoplay={true}
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center">
                      <div className="animate-pulse text-black/60">Loading animation...</div>
                    </div>
                  )}

                  {/* Floating elements around the GIF */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 border-2 border-black/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
                  <div className="absolute -bottom-6 -right-6 w-12 h-12 border border-black/10 rotate-45" style={{ animation: 'spin 20s linear infinite' }}></div>
                  <div className="absolute top-1/4 -right-2 w-px h-16 bg-black/10 rotate-12"></div>
                </div>
              </div>
            </div>

            {/* Core Value Propositions - Moved below the hero */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="stats-item group p-6 border border-black/10 rounded-lg hover:bg-black hover:text-white transition-all duration-300 interactive">
                  <div className="w-12 h-12 border-2 border-black group-hover:border-white mx-auto mb-4 flex items-center justify-center rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">REAL-TIME INSIGHTS</h3>
                  <p className="text-sm opacity-70">Live data that drives decisions</p>
                </div>
                <div className="stats-item group p-6 border border-black/10 rounded-lg hover:bg-black hover:text-white transition-all duration-300 interactive">
                  <div className="w-12 h-12 border-2 border-black group-hover:border-white mx-auto mb-4 flex items-center justify-center rounded-lg">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">SMART FORECASTING</h3>
                  <p className="text-sm opacity-70">AI-powered demand prediction</p>
                </div>
                <div className="stats-item group p-6 border border-black/10 rounded-lg hover:bg-black hover:text-white transition-all duration-300 interactive">
                  <div className="w-12 h-12 border-2 border-black group-hover:border-white mx-auto mb-4 flex items-center justify-center rounded-lg">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">ZERO WASTE</h3>
                  <p className="text-sm opacity-70">Optimize every unit in stock</p>
                </div>
              </div>
            </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="animated-section px-6 py-32 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                THE INVENTORY CRISIS
              </h2>
              <div className="w-24 h-px bg-white mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-20 items-start">
              <div className="space-y-8">
                <div className="border-l-2 border-white/20 pl-6">
                  <h3 className="text-2xl font-semibold mb-4 text-white/90">The Cost of Chaos</h3>
                  <p className="text-white/70 text-lg leading-relaxed">
                    Every stockout is a lost customer. Every overstock dollar is capital bleeding away. 
                    Manual processes create gaps where profits disappear.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Revenue Loss</h4>
                      <p className="text-white/70">Empty shelves = empty registers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Capital Waste</h4>
                      <p className="text-white/70">Money trapped in slow inventory</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Time Drain</h4>
                      <p className="text-white/70">Hours lost to manual tracking</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="border-l-2 border-white pl-6">
                  <h3 className="text-2xl font-semibold mb-4">Precision Intelligence</h3>
                  <p className="text-white/70 text-lg leading-relaxed">
                    Our AI transforms chaos into clarity. Predict demand, optimize stock, 
                    maximize profits—all automated, all accurate.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Demand Forecasting</h4>
                      <p className="text-white/70">AI predicts what sells when</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Smart Optimization</h4>
                      <p className="text-white/70">Perfect stock levels, automatically</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 interactive">
                    <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Real-time Control</h4>
                      <p className="text-white/70">Instant insights, instant action</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="animated-section px-6 py-32 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-black">
                    BUILT FOR PRECISION
                  </h2>
                  <div className="w-24 h-px bg-black mx-auto mb-8"></div>
                  <p className="text-xl text-black/60 max-w-2xl mx-auto font-light">
                    Three core capabilities that transform how you manage inventory
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {/* Feature 1 */}
                    <div className="feature-item group text-center interactive">
                        <div className="w-16 h-16 border-2 border-black mx-auto mb-8 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-black">PREDICT</h3>
                        <p className="text-black/60 leading-relaxed">
                            AI analyzes patterns, seasonal trends, and market data to forecast demand with surgical precision
                        </p>
                    </div>
                    
                    {/* Feature 2 */}
                    <div className="feature-item group text-center interactive">
                        <div className="w-16 h-16 border-2 border-black mx-auto mb-8 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-black">AUTOMATE</h3>
                        <p className="text-black/60 leading-relaxed">
                            Smart reorder points trigger automatically, ensuring perfect stock levels without manual intervention
                        </p>
                    </div>
                    
                    {/* Feature 3 */}
                    <div className="feature-item group text-center interactive">
                        <div className="w-16 h-16 border-2 border-black mx-auto mb-8 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <BarChart className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-black">OPTIMIZE</h3>
                        <p className="text-black/60 leading-relaxed">
                            Real-time analytics reveal opportunities to reduce costs and maximize profitability
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-32 bg-black text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              READY TO ELIMINATE GUESSWORK?
            </h2>
            <div className="w-24 h-px bg-white mx-auto mb-8"></div>
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Join the businesses that have transformed chaos into profit with StockPilot's intelligent inventory management.
            </p>
            <Button 
              onClick={handleGetStarted} 
              size="lg" 
              className="text-lg px-12 py-6 bg-white text-black hover:bg-white/90 rounded-none border-0 font-medium tracking-wide interactive group"
            >
              <span>START YOUR TRANSFORMATION</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-16 bg-gray-50 border-t border-black/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-sm"></div>
                </div>
                <span className="text-2xl font-bold tracking-tight text-black">StockPilot</span>
              </div>
              <p className="text-black/60 font-light leading-relaxed max-w-md">
                Transform your inventory chaos into profit with intelligent management. 
                Precision-driven solutions for modern businesses.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-bold text-black mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Features</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Pricing</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">API</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-bold text-black mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">About</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Blog</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Careers</a></li>
                <li><a href="#" className="text-black/60 hover:text-black transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-black/10">
            <p className="text-black/60 font-light text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} StockPilot. All rights reserved. Precision. Profit. Pilot.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-black/60 hover:text-black transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-black/60 hover:text-black transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-black/60 hover:text-black transition-colors text-sm">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;