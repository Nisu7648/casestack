import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Globe, DollarSign, Shield, Zap, Users, FileText, Clock } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Scale className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">LegalStack</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Legal Case Management
            <br />
            <span className="text-blue-400">Made Fair & Accessible</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Professional case management for law firms worldwide. 
            Fair pricing based on your country's economy. No hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
            >
              View Pricing
            </button>
            <button
              onClick={() => navigate('/setup')}
              className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8" />,
                title: 'Case Management',
                description: 'Organize cases, documents, and workflows in one place'
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: 'Time Tracking',
                description: 'Track billable hours and generate invoices automatically'
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Client Portal',
                description: 'Secure portal for clients to view cases and documents'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Document Security',
                description: 'Bank-level encryption for all your legal documents'
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: 'Global Access',
                description: 'Access your cases from anywhere, on any device'
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: 'Fair Pricing',
                description: 'Economy-based pricing for 60+ countries'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Fast & Reliable',
                description: 'Lightning-fast performance with 99.9% uptime'
              },
              {
                icon: <Scale className="w-8 h-8" />,
                title: 'Compliance Ready',
                description: 'Built for legal compliance and data protection'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-slate-600 hover:border-blue-500 transition"
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Highlight */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Fair Pricing for Every Country
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            We believe legal technology should be accessible to law firms worldwide.
            That's why our pricing adjusts based on your country's economy.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">60+</div>
              <div className="text-slate-300">Countries Supported</div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">50%</div>
              <div className="text-slate-300">Lower Prices in Developing Markets</div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">$0</div>
              <div className="text-slate-300">Hidden Fees</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
          >
            See Your Country's Pricing
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Law Firm?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join law firms worldwide using LegalStack to manage cases efficiently.
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="bg-white hover:bg-slate-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold text-white">LegalStack</span>
              </div>
              <p className="text-slate-400">
                Fair, accessible legal case management for law firms worldwide.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 LegalStack. Built with fairness in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
