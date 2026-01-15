import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, Zap, BarChart3, Sparkles, Activity, Award, TrendingDown } from 'lucide-react';
import axios from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';

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

  const getPriorityBadge = (priority: string) => {
    const variants = {
      HIGH: 'danger' as const,
      MEDIUM: 'warning' as const,
      LOW: 'success' as const
    };
    return variants[priority as keyof typeof variants] || 'default' as const;
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'red';
    if (score >= 50) return 'orange';
    if (score >= 25) return 'orange';
    return 'green';
  };

  const getOutcomeIcon = (outcome: string | null) => {
    if (!outcome) return <Clock className="w-5 h-5 text-gray-400" />;
    if (outcome.includes('POSITIVE')) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (outcome.includes('CHALLENGING')) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Target className="w-5 h-5 text-yellow-600" />;
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'URGENT': return <AlertTriangle className="w-5 h-5" />;
      case 'ATTENTION': return <Activity className="w-5 h-5" />;
      case 'REMINDER': return <Clock className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600 dark:border-t-purple-400"></div>
            <Brain className="w-10 h-10 text-purple-600 dark:text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading AI Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Intelligence Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Powered by advanced machine learning algorithms
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-fade-in stagger-1">
            <StatCard
              title="Active Cases"
              value={stats.totalCases}
              icon={BarChart3}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in stagger-2">
            <StatCard
              title="High Risk Cases"
              value={stats.highRiskCases}
              icon={AlertTriangle}
              color="red"
              trend={{ value: 5, isPositive: false }}
            />
          </div>
          <div className="animate-fade-in stagger-3">
            <StatCard
              title="Predicted Successful"
              value={stats.predictedSuccessful}
              icon={TrendingUp}
              color="green"
              trend={{ value: 18, isPositive: true }}
            />
          </div>
          <div className="animate-fade-in stagger-4">
            <StatCard
              title="AI Confidence"
              value={`${Math.round(stats.avgConfidence * 100)}%`}
              icon={Zap}
              color="purple"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smart Recommendations */}
          <div className="animate-slide-in-left">
            <Card variant="glass" className="overflow-hidden">
              <div className="p-6 border-b border-white/20 dark:border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                      Smart Recommendations
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      AI-powered action items for optimal workflow
                    </p>
                  </div>
                  <Badge variant="purple" pulse>
                    {recommendations.length} Active
                  </Badge>
                </div>
              </div>
              
              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {recommendations.length === 0 ? (
                  <div className="text-center py-12 animate-bounce-in">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                      <CheckCircle className="relative w-16 h-16 text-green-500 mx-auto mb-4" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No urgent recommendations at the moment.
                    </p>
                  </div>
                ) : (
                  recommendations.map((rec, index) => (
                    <Card
                      key={index}
                      variant="default"
                      hover
                      className={`animate-fade-in stagger-${(index % 5) + 1} border-l-4 ${
                        rec.priority === 'HIGH' ? 'border-l-red-500' :
                        rec.priority === 'MEDIUM' ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getRecommendationIcon(rec.type)}
                            <Badge variant={getPriorityBadge(rec.priority)} size="sm">
                              {rec.priority}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {rec.caseNumber}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          {rec.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {rec.type}
                          </span>
                          <Button variant="ghost" size="sm">
                            Take Action →
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Case Insights */}
          <div className="animate-slide-in-right">
            <Card variant="glass" className="overflow-hidden">
              <div className="p-6 border-b border-white/20 dark:border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Brain className="w-6 h-6 text-purple-500 animate-pulse" />
                      AI Case Insights
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Predictions and risk assessments
                    </p>
                  </div>
                  <Badge variant="info" pulse>
                    {cases.length} Cases
                  </Badge>
                </div>
              </div>
              
              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {cases.map((caseItem, index) => (
                  <Card
                    key={caseItem.id}
                    variant="default"
                    hover
                    className={`animate-fade-in stagger-${(index % 5) + 1}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {caseItem.caseNumber}
                            </h3>
                            <Badge variant="default" size="sm">
                              {caseItem.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {caseItem.title}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getOutcomeIcon(caseItem.aiPredictedOutcome)}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Risk Score */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Risk Score
                            </span>
                            <span className={`text-sm font-bold ${
                              caseItem.aiRiskScore >= 75 ? 'text-red-600' :
                              caseItem.aiRiskScore >= 50 ? 'text-orange-600' :
                              caseItem.aiRiskScore >= 25 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {Math.round(caseItem.aiRiskScore)}%
                            </span>
                          </div>
                          <ProgressBar
                            value={caseItem.aiRiskScore}
                            color={getRiskColor(caseItem.aiRiskScore)}
                            size="sm"
                            animated
                            striped
                          />
                        </div>

                        {/* Confidence Score */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              AI Confidence
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              {caseItem.aiConfidenceScore ? Math.round(caseItem.aiConfidenceScore * 100) : 0}%
                            </span>
                          </div>
                          <ProgressBar
                            value={caseItem.aiConfidenceScore ? caseItem.aiConfidenceScore * 100 : 0}
                            color="blue"
                            size="sm"
                            animated
                          />
                        </div>

                        {/* Predicted Outcome */}
                        {caseItem.aiPredictedOutcome && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                              Predicted Outcome
                            </span>
                            <div className="flex items-center gap-2">
                              {caseItem.aiPredictedOutcome.includes('POSITIVE') ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {caseItem.aiPredictedOutcome.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="gradient" size="sm" fullWidth>
                          View Full Analysis
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* AI Performance Metrics */}
        <div className="mt-6 animate-fade-in">
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Performance Metrics
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Prediction Accuracy
                    </span>
                    <span className="text-lg font-bold text-green-600">85%</span>
                  </div>
                  <ProgressBar value={85} color="green" animated striped />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Risk Detection Rate
                    </span>
                    <span className="text-lg font-bold text-blue-600">92%</span>
                  </div>
                  <ProgressBar value={92} color="blue" animated striped />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Recommendation Relevance
                    </span>
                    <span className="text-lg font-bold text-purple-600">88%</span>
                  </div>
                  <ProgressBar value={88} color="purple" animated striped />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default AIDashboard;
