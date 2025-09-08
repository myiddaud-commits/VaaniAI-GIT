import React from 'react';
import { MessageCircle, Users, Target, Award, Heart, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  const team = [
    {
      name: "राहुल शर्मा",
      role: "CEO & Founder",
      description: "AI और भाषा प्रौद्योगिकी में 10+ वर्षों का अनुभव"
    },
    {
      name: "प्रिया पटेल",
      role: "CTO",
      description: "मशीन लर्निंग और NLP विशेषज्ञ"
    },
    {
      name: "अमित कुमार",
      role: "Lead Developer",
      description: "फुल-स्टैक डेवलपमेंट और UI/UX डिज़ाइन"
    },
    {
      name: "सुनीता गुप्ता",
      role: "Product Manager",
      description: "उत्पाद रणनीति और उपयोगकर्ता अनुभव"
    }
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "उपयोगकर्ता-केंद्रित",
      description: "हमारे उपयोगकर्ताओं की जरूरतें हमारी प्राथमिकता हैं"
    },
    {
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      title: "भाषा संरक्षण",
      description: "हिंदी भाषा को डिजिटल युग में आगे बढ़ाना"
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      title: "गुणवत्ता",
      description: "उच्चतम गुणवत्ता और सटीकता के लिए प्रतिबद्ध"
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: "समुदाय",
      description: "एक मजबूत हिंदी AI समुदाय का निर्माण"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-whatsapp-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            हमारे बारे में
          </h1>
          <p className="text-xl md:text-2xl text-whatsapp-light max-w-3xl mx-auto">
            हम हिंदी भाषा में AI तकनीक को सुलभ बनाने के लिए प्रतिबद्ध हैं
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                हमारा मिशन
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                हमारा मिशन है हिंदी भाषी लोगों के लिए एक शक्तिशाली और उपयोग में आसान 
                AI चैटबॉट बनाना जो उनकी मातृभाषा में प्राकृतिक बातचीत कर सके।
              </p>
              <p className="text-lg text-gray-600 mb-6">
                हम मानते हैं कि भाषा कोई बाधा नहीं होनी चाहिए जब बात आती है 
                आधुनिक तकनीक का उपयोग करने की। इसीलिए हमने एक ऐसा प्लेटफॉर्म 
                बनाया है जो पूरी तरह से हिंदी में काम करता है।
              </p>
              <div className="flex items-center space-x-4">
                <Target className="h-8 w-8 text-whatsapp-primary" />
                <span className="text-lg font-semibold text-gray-900">
                  हिंदी में AI का भविष्य
                </span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                हमारी उपलब्धियां
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-whatsapp-primary rounded-full"></div>
                  <span>10,000+ संतुष्ट उपयोगकर्ता</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-whatsapp-primary rounded-full"></div>
                  <span>1 मिलियन+ संदेश प्रोसेस किए गए</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-whatsapp-primary rounded-full"></div>
                  <span>99.9% अपटाइम</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-whatsapp-primary rounded-full"></div>
                  <span>24/7 ग्राहक सहायता</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              हमारे मूल्य
            </h2>
            <p className="text-xl text-gray-600">
              जो सिद्धांत हमारे काम को दिशा देते हैं
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              हमारी टीम
            </h2>
            <p className="text-xl text-gray-600">
              प्रतिभाशाली लोगों का समूह जो इस सपने को साकार कर रहा है
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-20 h-20 bg-whatsapp-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-whatsapp-primary font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-whatsapp-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            हमसे जुड़ें
          </h2>
          <p className="text-xl text-whatsapp-light mb-8">
            कोई सवाल है या सुझाव देना चाहते हैं? हमसे संपर्क करें
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@hindiai.com"
              className="bg-white text-whatsapp-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              ईमेल भेजें
            </a>
            <a
              href="tel:+911234567890"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-whatsapp-primary transition-colors"
            >
              फोन करें
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;