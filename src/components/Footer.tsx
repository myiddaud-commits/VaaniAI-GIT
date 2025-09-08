import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="h-8 w-8 text-whatsapp-primary" />
              <span className="text-xl font-bold">VaaniAI</span>
            </div>
            <p className="text-gray-300 mb-4">
              आपकी भाषा में बात करें और AI सहायक से मदद पाएं। हमारा चैटबॉट हिंदी में 
              प्राकृतिक बातचीत करने के लिए डिज़ाइन किया गया है।
            </p>
            <div className="flex items-center text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>in India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">त्वरित लिंक</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  होम
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  प्लान्स
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  हमारे बारे में
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  संपर्क करें
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">सहायता</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  सहायता
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  गोपनीयता नीति
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  नियम और शर्तें
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-whatsapp-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 VaaniAI। सभी अधिकार सुरक्षित।</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;