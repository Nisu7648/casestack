import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Recommendation {
  type: string;
  caseId: string;
  caseNumber: string;
  message: string;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CaseInsight {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  aiPredictedOutcome: string | null;
  aiConfidenceScore: number | null;
  aiRiskScore: number;
  estimatedCompletionDate: string | null;
}

interface DashboardStats {
  totalCases: number;
  highRiskCases: number;
  predictedSuccessful: number;
  avgConfidence: number;
}

const AIDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [cases, setCases] = useState<CaseInsight[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    highRiskCases: 0,
    predictedSuccessful: 0,
    avgConfidence: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ai/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations);
        setCases(response.data.data.cases);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOutcomeIcon = (outcome: string | null) => {
    if (!outcome) return <Clock className="w-5 h-5 text-gray-400" />;
    if (outcome.includes('POSITIVE')) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (outcome.includes('CHALLENGING')) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Target className="w-5 h-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Intelligent insights powered by machine learning
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalCases}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Active Cases
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.highRiskCases}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            High Risk Cases
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.predictedSuccessful}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Predicted Successful
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(stats.avgConfidence * 100)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Avg Confidence
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Smart Recommendations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered action items
            </p>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  All caught up! No urgent recommendations.
                </p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {rec.type}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white dark:bg-gray-900">
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2">{rec.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Case: {rec.caseNumber}
                    </span>
                    <button className="text-xs font-medium hover:underline">
                      Take Action →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Case Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Case Insights
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Predictions and risk assessments
            </p>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {caseItem.caseNumber}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {caseItem.title}
                    </p>
                  </div>
                  {getOutcomeIcon(caseItem.aiPredictedOutcome)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                    <span className={`ml-2 font-bold ${getRiskColor(caseItem.aiRiskScore)}`}>
                      {Math.round(caseItem.aiRiskScore)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {caseItem.aiConfidenceScore ? Math.round(caseItem.aiConfidenceScore * 100) : 0}%
                    </span>
                  </div>
                </div>

                {caseItem.aiPredictedOutcome && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Predicted Outcome:</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {caseItem.aiPredictedOutcome.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
