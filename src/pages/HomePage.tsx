import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Zap, Shield, Globe, ArrowRight, Star, Users, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <MessageCircle className="h-8 w-8 text-whatsapp-primary" />,
      title: "💬 प्राकृतिक बातचीत",
      description: "हिंदी में स्वाभाविक और आसान बातचीत करें 🗨️"
    },
    {
      icon: <Zap className="h-8 w-8 text-whatsapp-primary" />,
      title: "⚡ तुरंत जवाब",
      description: "AI द्वारा तुरंत और सटीक उत्तर पाएं 🎯"
    },
    {
      icon: <Shield className="h-8 w-8 text-whatsapp-primary" />,
      title: "🔒 सुरक्षित और निजी",
      description: "आपकी बातचीत पूरी तरह सुरक्षित और गोपनीय है 🛡️"
    },
    {
      icon: <Globe className="h-8 w-8 text-whatsapp-primary" />,
      title: "🌍 24/7 उपलब्ध",
      description: "दिन-रात कभी भी सहायता पाएं 🕐"
    }
  ];

  const testimonials = [
    {
      name: "राज कुमार",
      text: "यह चैटबॉट वाकई बहुत अच्छा है! 😊 हिंदी में बात करना बहुत आसान है। 👍",
      rating: 5
    },
    {
      name: "प्रिया शर्मा",
      text: "मुझे इसका इंटरफेस बहुत पसंद आया! 💖 बहुत user-friendly है। ✨",
      rating: 5
    },
    {
      name: "अमित गुप्ता",
      text: "AI के जवाब बहुत सटीक हैं! 🎯 मैं रोज़ाना इस्तेमाल करता हूँ। 📱",
      rating: 5
    }
  ];

  const stats = [
    { number: "10,000+", label: "😊 खुश उपयोगकर्ता" },
    { number: "1M+", label: "💬 संदेश भेजे गए" },
    { number: "99.9%", label: "⚡ अपटाइम" },
    { number: "24/7", label: "🛟 सहायता" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🙏 VaaniAI में आपका स्वागत है
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              🗣️ अपनी भाषा में बात करें और AI सहायक से मदद पाएं
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chat"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center shadow-lg"
              >
                🚀 शुरू करें
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-whatsapp-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ✨ हमारी विशेषताएं
            </h2>
            <p className="text-xl text-gray-600">
              जानें कि हमारा AI चैटबॉट आपकी कैसे मदद कर सकता है 🤖
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              💭 उपयोगकर्ताओं की राय
            </h2>
            <p className="text-xl text-gray-600">
              देखें कि लोग हमारे बारे में क्या कहते हैं 🗣️
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="font-semibold text-gray-900">
                  - {testimonial.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🎉 आज ही शुरू करें
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            🆓 रोज़ाना 20 मुफ़्त मैसेज के साथ हिंदी AI चैटबॉट का अनुभव करें
          </p>
          <Link
            to="/chat"
            className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center shadow-lg"
          >
            🚀 मुफ़्त में शुरू करें
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;