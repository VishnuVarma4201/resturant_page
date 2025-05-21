
import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-cream pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gold">Culinary Canvas</h3>
            <p className="mb-4">
              Experience the art of fine dining with our meticulously crafted 
              dishes, curated wines, and inviting ambience.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://facebook.com"
                className="text-cream hover:text-gold transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                className="text-cream hover:text-gold transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://instagram.com"
                className="text-cream hover:text-gold transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-gold">Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-gold transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="hover:text-gold transition-colors">
                  Reservations
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-gold">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 mt-1 text-gold" />
                <span>Peddapuram Samalkota Bypass Rd, Peddapuram, Andhra Pradesh 533437</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 text-gold" />
                <span>+91 6300286778</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 text-gold" />
                <span>raghuvarmakalidindi12345@gmail.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-6 text-gold">Opening Hours</h4>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Monday - Thursday</span>
                <span>11:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Friday - Saturday</span>
                <span>11:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>10:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-light mt-12 pt-8 text-center text-sm">
          <p>© {currentYear} Culinary Canvas. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
