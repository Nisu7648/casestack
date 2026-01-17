import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Mail } from 'lucide-react';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription } = location.state || {};

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Subscription Found</h1>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-green-500 rounded-full opacity-20 animate-ping"></div>
            </div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CASESTACK! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Your subscription is now active
          </p>
        </div>

        {/* Subscription Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Subscription Details
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium text-gray-900">{subscription.plan.name}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Users</span>
              <span className="font-medium text-gray-900">{subscription.userCount}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Billing Cycle</span>
              <span className="font-medium text-gray-900 capitalize">{subscription.billingCycle}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium text-gray-900">
                {subscription.billingCycle === 'monthly'
                  ? subscription.pricing.monthly.formatted
                  : subscription.pricing.yearly.formatted}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Next Billing Date</span>
              <span className="font-medium text-gray-900">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>

            <div className="flex justify-between py-3">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            What's Next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Set up your team</p>
                <p className="text-sm text-gray-600">Invite team members and assign roles</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Create your first case</p>
                <p className="text-sm text-gray-600">Start managing cases right away</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Explore features</p>
                <p className="text-sm text-gray-600">Discover all the powerful tools available</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.print()}
            className="bg-white text-gray-900 py-4 rounded-lg font-medium hover:bg-gray-50 transition-all border-2 border-gray-300 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Receipt</span>
          </button>
        </div>

        {/* Email Confirmation */}
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">
                Confirmation Email Sent
              </h4>
              <p className="text-sm text-gray-600">
                We've sent a confirmation email with your subscription details and receipt. 
                Check your inbox for next steps.
              </p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help getting started?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
