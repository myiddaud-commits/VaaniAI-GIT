import React from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Plan } from '../types';
import { PricingPlan } from '../types/admin';

const PlansPage: React.FC = () => {
  const { user, updatePlan } = useAuth();

  // Load pricing plans from localStorage (set by admin)
  const loadPricingPlans = (): Plan[] => {
    const savedPlans = JSON.parse(localStorage.getItem('vaaniai-pricing-plans') || '[]') as PricingPlan[];
    
    if (savedPlans.length === 0) {
      // Fallback to default plans if none configured
      return [
        {
          id: 'free',
          name: 'मुफ़्त योजना',
          price: '₹0',
          messages: '20 संदेश प्रति दिन',
          features: [
            'बुनियादी AI चैट',
            'हिंदी भाषा समर्थन',
            'मोबाइल और डेस्कटॉप एक्सेस',
            'चैट इतिहास सेव करें',
            'बुनियादी सहायता',
            'रोज़ाना रीसेट'
          ]
        },
        {
          id: 'premium',
          name: 'प्रीमियम योजना',
          price: '₹499/माह',
          messages: '5,000 संदेश प्रति माह',
          popular: true,
          features: [
            'उन्नत AI चैट',
            'प्राथमिकता सहायता',
            'चैट इतिहास सेव करें',
            'तेज़ प्रतिक्रिया समय',
            'कस्टम टेम्प्लेट्स',
            'एक्सपोर्ट चैट'
          ]
        },
        {
          id: 'enterprise',
          name: 'एंटरप्राइज योजना',
          price: 'कस्टम मूल्य',
          messages: 'असीमित संदेश',
          features: [
            'असीमित AI चैट',
            '24/7 समर्पित सहायता',
            'कस्टम इंटीग्रेशन',
            'एडवांस्ड एनालिटिक्स',
            'टीम मैनेजमेंट',
            'प्राइवेट क्लाउड',
            'SLA गारंटी'
          ]
        }
      ];
    }

    // Convert PricingPlan to Plan format and filter active plans
    return savedPlans
      .filter(plan => plan.isActive)
      .map(plan => ({
        id: plan.id,
        name: plan.nameHindi,
        price: plan.price === 0 ? '₹0' : plan.billingCycle === 'yearly' ? `₹${plan.price}/वर्ष` : `₹${plan.price}/माह`,
        messages: plan.messagesLimit === 999999 ? 'असीमित संदेश' : `${plan.messagesLimit} संदेश प्रति माह`,
        features: plan.featuresHindi,
        popular: plan.isPopular
      }));
  };

  const plans = loadPricingPlans();

  const handlePlanSelect = (planId: 'free' | 'premium' | 'enterprise') => {
    if (planId === 'enterprise') {
      alert('एंटरप्राइज प्लान के लिए कृपया हमसे संपर्क करें।');
      return;
    }

    if (planId === 'premium') {
      // Mock Stripe integration
      alert('Stripe पेमेंट गेटवे यहाँ इंटीग्रेट होगा। डेमो के लिए प्लान अपडेट कर दिया गया है।');
    }

    updatePlan(planId);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Star className="h-8 w-8" />;
      case 'premium':
        return <Zap className="h-8 w-8" />;
      case 'enterprise':
        return <Crown className="h-8 w-8" />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            अपना प्लान चुनें
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            आपकी आवश्यकताओं के अनुसार सबसे अच्छा प्लान चुनें
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-whatsapp-light rounded-full">
              <span className="text-sm text-gray-700">
                वर्तमान प्लान: <span className="font-semibold capitalize">{user.plan}</span>
              </span>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl shadow-lg ${
                plan.popular
                  ? 'border-2 border-whatsapp-primary bg-white'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold bg-whatsapp-primary text-white">
                    सबसे लोकप्रिय
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`${plan.popular ? 'text-whatsapp-primary' : 'text-gray-400'}`}>
                    {getPlanIcon(plan.id)}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 text-center">
                  {plan.name}
                </h3>

                <div className="mt-4 text-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                </div>

                <p className="mt-2 text-center text-gray-600">
                  {plan.messages}
                </p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="flex-shrink-0 h-5 w-5 text-whatsapp-primary mt-0.5" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={user?.plan === plan.id}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                      user?.plan === plan.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-whatsapp-primary text-white hover:bg-whatsapp-dark'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {user?.plan === plan.id
                      ? 'वर्तमान प्लान'
                      : plan.id === 'enterprise'
                      ? 'संपर्क करें'
                      : plan.id === 'free'
                      ? 'मुफ़्त शुरू करें'
                      : 'अपग्रेड करें'
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            सभी प्लान्स में 30-दिन की मनी-बैक गारंटी शामिल है
          </p>
          <p className="mt-2 text-sm text-gray-500">
            कोई छुपी हुई फीस नहीं। कभी भी कैंसल करें।
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            अक्सर पूछे जाने वाले प्रश्न
          </h3>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                क्या मैं अपना प्लान बदल सकता हूँ?
              </h4>
              <p className="text-gray-600">
                हाँ, आप कभी भी अपना प्लान अपग्रेड या डाउनग्रेड कर सकते हैं। बदलाव तुरंत प्रभावी होगा।
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                क्या मेरा डेटा सुरक्षित है?
              </h4>
              <p className="text-gray-600">
                हाँ, हम आपके सभी डेटा को एन्क्रिप्ट करके स्टोर करते हैं और कभी भी तीसरे पक्ष के साथ साझा नहीं करते।
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                क्या कोई सेटअप फीस है?
              </h4>
              <p className="text-gray-600">
                नहीं, कोई सेटअप फीस नहीं है। आप केवल अपने चुने गए प्लान के लिए भुगतान करते हैं।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;