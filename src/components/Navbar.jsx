import { useState, useEffect } from 'react';
import { Menu, X, User, Briefcase, Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import logoBlanco from '/assets/images/logo/logoHorizontalBlanco.png';
import logoNegro from '/assets/images/logo/logoHorizontalNegro.png';
import '../styles/Navbar.css';

const Navbar = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useTheme();

  // Seleccionar el logo según el tema
  const logo = theme === 'dark' ? logoBlanco : logoNegro;

  // Scroll suave inline
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;

      const href = target.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();

      const element = document.querySelector(href);
      if (!element) return;

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 70;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: "about", label: "About Me", icon: User },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "contact", label: "Contact", icon: Mail }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <a href="#home" onClick={closeMenu}>
            <img
              src={logo}
              alt="Portfolio Logo"
              className="logo-image"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        <ul className="navbar-menu desktop-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="navbar-item">
                <button
                  className="navbar-link nav-button"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className='texto-chivo'>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Desktop Theme Toggle */}
        <div className="navbar-theme desktop-theme">
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="hamburger-button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="mobile-item">
                <button
                  className="mobile-link"
                  onClick={() => { onNavigate(item.id); closeMenu(); }}
                >
                  <Icon size={20} className="mobile-nav-icon" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Mobile Theme Toggle */}
        <div className="mobile-theme">
          <ThemeToggle />
        </div>
      </div>

      {/* Overlay para cerrar el menú */}
      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;
