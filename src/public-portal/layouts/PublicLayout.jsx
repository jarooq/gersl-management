import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, X, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const PublicLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Our Campaigns', path: '/campaigns' },
    { name: 'Orphans in Need', path: '/orphans-in-need' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        {/* Top Info Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center justify-between text-xs">
              <div className="flex items-center gap-3 md:gap-6">
                <a href="tel:+94262236220" className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors">
                  <Phone size={12} />
                  <span className="hidden sm:inline">+94 26 223 6220</span>
                </a>
                <a href="tel:+94777030822" className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors">
                  <Phone size={12} />
                  <span className="hidden sm:inline">+94 77 703 0822</span>
                </a>
                <a href="mailto:info@global-ehsan-relief.org.lk" className="hidden lg:flex items-center gap-1.5 hover:text-yellow-300 transition-colors">
                  <Mail size={12} />
                  <span>info@global-ehsan-relief.org.lk</span>
                </a>
              </div>
              <div className="flex items-center gap-3">
                <a href="#" className="hover:text-yellow-300 transition-colors" aria-label="Facebook">
                  <Facebook size={14} />
                </a>
                <a href="#" className="hover:text-yellow-300 transition-colors" aria-label="Twitter">
                  <Twitter size={14} />
                </a>
                <a href="#" className="hover:text-yellow-300 transition-colors" aria-label="Instagram">
                  <Instagram size={14} />
                </a>
                <a href="#" className="hover:text-yellow-300 transition-colors" aria-label="LinkedIn">
                  <Linkedin size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header with Centered Logo */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-2 relative">
            {/* Mobile Menu Button - Top Right */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden absolute right-4 top-4 p-2.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo - Left Aligned */}
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-block">
                <img
                  src="/GER NEW LOGO-03.png"
                  alt="GERSL Logo"
                  className="h-16 md:h-20 w-auto object-contain transition-transform hover:scale-105 rounded-lg"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/donate"
                  className="ml-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-8 py-2.5 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg hover:scale-105 transform text-sm"
                >
                  <Heart className="inline-block mr-1.5 -mt-0.5" size={16} />
                  Donate Now
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/donate"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-3 rounded-lg font-bold text-center hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md"
                >
                  <Heart className="inline-block mr-1.5 -mt-0.5" size={16} />
                  Donate Now
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 mt-auto">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-4">
              <Link to="/" className="inline-block mb-6">
                <img
                  src="/GER NEW LOGO-03.png"
                  alt="GERSL Logo"
                  className="h-20 w-auto object-contain brightness-110 rounded-lg"
                />
              </Link>
              <h3 className="text-white font-bold text-xl mb-3">
                Global Education & Relief Services Lanka
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Empowering communities through education, humanitarian relief, and sustainable development across Sri Lanka since 2009.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-110 transform"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-400 transition-all hover:scale-110 transform"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 transform"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 transform"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/" className="flex items-center gap-2 hover:text-yellow-400 transition-colors hover:translate-x-1 transform">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="flex items-center gap-2 hover:text-yellow-400 transition-colors hover:translate-x-1 transform">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/campaigns" className="flex items-center gap-2 hover:text-yellow-400 transition-colors hover:translate-x-1 transform">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    Our Campaigns
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="flex items-center gap-2 hover:text-yellow-400 transition-colors hover:translate-x-1 transform">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/tenders" className="flex items-center gap-2 hover:text-yellow-400 transition-colors hover:translate-x-1 transform">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                    Procurement
                  </Link>
                </li>
              </ul>
            </div>

            {/* Programs */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2">Our Programs</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <Heart size={14} className="text-yellow-400 flex-shrink-0" />
                  <span>Care for Orphans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart size={14} className="text-yellow-400 flex-shrink-0" />
                  <span>Education Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart size={14} className="text-yellow-400 flex-shrink-0" />
                  <span>WASH Programs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart size={14} className="text-yellow-400 flex-shrink-0" />
                  <span>Ramadan Relief</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart size={14} className="text-yellow-400 flex-shrink-0" />
                  <span>Emergency Response</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-3">
              <h4 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2">Get In Touch</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                  <span>Colombo, Sri Lanka</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="flex-shrink-0 text-yellow-400" />
                  <a href="tel:+94262236220" className="hover:text-yellow-400 transition-colors">
                    +94 26 223 6220
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="flex-shrink-0 text-yellow-400" />
                  <a href="tel:+94777030822" className="hover:text-yellow-400 transition-colors">
                    +94 77 703 0822
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
                  <a href="mailto:info@global-ehsan-relief.org.lk" className="hover:text-yellow-400 transition-colors break-all">
                    info@global-ehsan-relief.org.lk
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} GERSL - Global Education and Relief Services Lanka. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="hover:text-yellow-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-yellow-400 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
