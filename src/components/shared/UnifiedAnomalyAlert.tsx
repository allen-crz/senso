import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle, CheckCircle, X, ThumbsUp, ThumbsDown, AlertCircle, XCircle, Clock, TrendingUp, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAnomalyFeedback } from '@/hooks/useAnomalyDetection';
import { toast } from 'sonner';
import { anomalyRecommendationEngine, type AnomalyData as EngineAnomalyData } from '@/services/anomalyRecommendationEngine';

interface AnomalyData {
  id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  confidence?: 'low' | 'medium' | 'high' | null;
  contributing_factors: {
    reason?: string;
    current_reading?: number;
    previous_reading?: number;
    rollback_amount?: number;
    detection_method?: string;
    detection_type?: string;
    used_clean_reference?: boolean;
    reading_value?: number;
    training_samples?: number;
    threshold_used?: number;
    spike_ratio?: number;
    increase_ratio?: number;
    note?: string;
    [key: string]: any;
  };
  user_feedback?: string | null;
  user_feedback_at?: string | null;
}

interface UnifiedAnomalyAlertProps {
  anomaly: AnomalyData;
  utilityType: 'water' | 'electricity';
  onDismiss?: () => void;
  showFeedback?: boolean;
  variant?: 'compact' | 'detailed';
}

const UnifiedAnomalyAlert: React.FC<UnifiedAnomalyAlertProps> = React.memo(({
  anomaly,
  utilityType,
  onDismiss,
  showFeedback = true,
  variant = 'detailed',
}) => {
  console.log('UnifiedAnomalyAlert props:', { anomaly, utilityType, onDismiss, showFeedback, variant });

  // Check for existing feedback from database only
  const feedbackProvided = !!anomaly.user_feedback;
  console.log('Component render - feedbackProvided:', feedbackProvided, 'user_feedback:', anomaly.user_feedback);

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(feedbackProvided); // Collapse if already reviewed
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);

  // Use the mutation hook for feedback
  const feedbackMutation = useAnomalyFeedback();

  // Automatic feedback for critical anomalies
  useEffect(() => {
    if (anomaly.severity === 'critical' && !feedbackProvided && anomaly.is_anomaly) {
      console.log('Auto-submitting feedback for critical anomaly:', anomaly.id);
      handleFeedback('correct', true); // true = auto submission
    }
  }, [anomaly.id, anomaly.severity, feedbackProvided]);

  if (!anomaly.is_anomaly) return null;

  const handleFeedback = async (feedbackType: 'correct' | 'false_positive' | 'missed_anomaly', isAutomatic: boolean = false) => {
    if (!isAutomatic) {
      console.log('handleFeedback called with:', feedbackType);
      console.log('feedbackProvided:', feedbackProvided);
      console.log('anomaly.user_feedback:', anomaly.user_feedback);
    }

    // Prevent duplicate feedback
    if (feedbackProvided) {
      if (!isAutomatic) {
        console.log('Feedback already provided, showing toast');
        toast.info('You have already provided feedback for this anomaly.');
      }
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      console.log('Calling mutation with:', { anomalyId: anomaly.id, feedback: feedbackType });
      await feedbackMutation.mutateAsync({
        anomalyId: anomaly.id,
        feedback: feedbackType
      });

      if (!isAutomatic) {
        console.log('Feedback submitted successfully');
        toast.success('Thank you for your feedback! This helps improve our detection accuracy.');
        // Collapse the alert after feedback instead of dismissing
        setTimeout(() => {
          setIsCollapsed(true);
        }, 1500); // Short delay for user to see the toast
      }
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);

      // Handle duplicate feedback error from backend
      if (error?.response?.status === 404 && error?.response?.data?.detail?.includes('feedback already provided')) {
        if (!isAutomatic) {
          toast.info('Feedback already provided for this anomaly.');
          setTimeout(() => {
            setIsCollapsed(true);
          }, 1000);
        }
      } else {
        if (!isAutomatic) {
          toast.error('Failed to submit feedback. Please try again.');
        }
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };



  const getSeverityConfig = useCallback((severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          title: 'Critical Anomaly Detected',
          color: 'text-red-600 bg-red-50 border-red-200',
          bgClass: 'bg-red-50'
        };
      case 'high':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: 'High Anomaly Detected',
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          bgClass: 'bg-orange-50'
        };
      case 'medium':
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          title: 'Moderate Anomaly Detected',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          bgClass: 'bg-yellow-50'
        };
      default:
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          title: 'Minor Anomaly Detected',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          bgClass: 'bg-blue-50'
        };
    }
  }, []);

  const formatDetectionMethod = useCallback((method?: string) => {
    if (!method) return '';
    
    const methodMap: { [key: string]: string } = {
      'early_rollback_detection': 'Early Rollback Detection',
      'enhanced_rollback_detection': 'Enhanced Rollback Detection',
      'ml_rollback_detection': 'ML Rollback Detection',
      'fallback_rollback_detection': 'Fallback Rollback Detection',
      'physical_limits': 'Physical Limits Check',
      'progressive_pattern': 'Progressive Pattern Analysis',
      'early_zero_detection': 'Zero Reading Detection',
      'isolation_forest': 'ML Isolation Forest'
    };

    return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const getSuggestions = useMemo(() => {
    // Convert anomaly data to engine format
    const engineAnomalyData: EngineAnomalyData = {
      id: anomaly.id,
      anomaly_score: anomaly.anomaly_score,
      is_anomaly: anomaly.is_anomaly,
      severity: anomaly.severity,
      detected_at: anomaly.detected_at,
      contributing_factors: anomaly.contributing_factors,
      user_feedback: anomaly.user_feedback,
      user_feedback_at: anomaly.user_feedback_at
    };

    // Get enhanced recommendations from the engine
    const enhancedRecommendations = anomalyRecommendationEngine.generateRecommendations(
      engineAnomalyData,
      utilityType
    );

    // Return in the format expected by the existing component
    return {
      immediate: enhancedRecommendations.immediate,
      shortTerm: enhancedRecommendations.shortTerm,
      prevention: enhancedRecommendations.prevention,
      enhanced: enhancedRecommendations // Store full enhanced data for potential use
    };
  }, [anomaly, utilityType]);

  const getAnomalyExplanation = useMemo(() => {
    // Get enhanced explanation from the recommendation engine
    const engineAnomalyData: EngineAnomalyData = {
      id: anomaly.id,
      anomaly_score: anomaly.anomaly_score,
      is_anomaly: anomaly.is_anomaly,
      severity: anomaly.severity,
      detected_at: anomaly.detected_at,
      contributing_factors: anomaly.contributing_factors,
      user_feedback: anomaly.user_feedback,
      user_feedback_at: anomaly.user_feedback_at
    };

    const enhancedRecommendations = anomalyRecommendationEngine.generateRecommendations(
      engineAnomalyData,
      utilityType
    );

    return {
      title: enhancedRecommendations.explanation.title,
      description: enhancedRecommendations.explanation.description,
      technical: enhancedRecommendations.explanation.technical,
      likelyRoot: enhancedRecommendations.explanation.likelyRoot,
      diagnosticSteps: enhancedRecommendations.explanation.diagnosticSteps
    };
  }, [anomaly, utilityType]);

  const config = useMemo(() => getSeverityConfig(anomaly.severity), [anomaly.severity, getSeverityConfig]);
  const Icon = config.icon;
  const explanation = getAnomalyExplanation;
  const suggestions = getSuggestions;

  // Compact variant for embedded use
  if (variant === 'compact') {
    // Collapsed view for reviewed anomalies
    if (isCollapsed && feedbackProvided) {
      return (
        <Alert variant={config.variant} className="my-4 cursor-pointer hover:bg-opacity-80 transition-all" onClick={() => setIsCollapsed(false)}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-1">
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm font-medium">{explanation.title}</p>
                <p className="text-xs opacity-75">Reviewed • Click to expand</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </Alert>
      );
    }

    // Expanded view
    return (
      <Alert variant={config.variant} className="my-4">
        <div className="flex items-start justify-between mb-2">
          <AlertTitle className="text-left flex-1">
            <div className="flex items-center gap-2">
              <span>{explanation.title}</span>
              {anomaly.confidence && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  anomaly.confidence === 'high'
                    ? 'bg-green-100 text-green-700'
                    : anomaly.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {anomaly.confidence.toUpperCase()} CONFIDENCE
                </span>
              )}
            </div>
          </AlertTitle>
          {feedbackProvided && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="ml-2 p-1 hover:bg-black/5 rounded transition-colors"
              aria-label="Collapse"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {onDismiss && !feedbackProvided && (
            <button
              onClick={onDismiss}
              className="ml-2 p-1 hover:bg-black/5 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <AlertDescription className="text-left">
          <p className="text-sm mb-2 text-left">{explanation.description}</p>
          {anomaly.contributing_factors?.note && (
            <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-blue-800">
              Note: {anomaly.contributing_factors.note}
            </div>
          )}
          <div className="text-xs opacity-75 text-left">
            {explanation.technical}
          </div>

          {/* Simplified: What to do now */}
          <div className="mt-3 pt-3 border-t border-opacity-20">
            <div className="text-xs font-semibold text-left mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              What to do now:
            </div>
            <div className="text-xs space-y-1 text-left">
              {(isActionsExpanded ? suggestions.immediate : suggestions.immediate.slice(0, 3)).map((action, index) => (
                <div key={index} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{action}</span>
                </div>
              ))}
              {suggestions.immediate.length > 3 && (
                <button
                  onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                  className="text-xs opacity-60 italic hover:opacity-80 underline cursor-pointer mt-1"
                >
                  {isActionsExpanded ? '- Show less' : `+ ${suggestions.immediate.length - 3} more...`}
                </button>
              )}
            </div>
          </div>

          {/* Compact feedback - Only show for low and medium severity without feedback */}
          {showFeedback && !feedbackProvided && (anomaly.severity === 'low' || anomaly.severity === 'medium') && (
            <div className="mt-3 pt-3 border-t border-opacity-20">
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('correct')}
                  disabled={isSubmittingFeedback}
                  className="text-xs"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Anomaly
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('false_positive')}
                  disabled={isSubmittingFeedback}
                  className="text-xs"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Normal
                </Button>
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Detailed variant
  return (
    <div className={`border rounded-lg p-4 mb-4 ${config.color}`}>
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-lg text-left">{explanation.title}</h3>
        <span className="text-sm opacity-75 capitalize text-left block">
          {anomaly.severity} severity
          {anomaly.contributing_factors.detection_method && (
            <> • {formatDetectionMethod(anomaly.contributing_factors.detection_method)}</>
          )}
          {anomaly.contributing_factors.detection_type && (
            <> • {anomaly.contributing_factors.detection_type}</>
          )}
        </span>
      </div>

      {/* Description */}
      <div className="mb-4 text-left">
        <p className="text-sm mb-2 text-left">{explanation.description}</p>
        <p className="text-xs opacity-75 font-mono text-left">{explanation.technical}</p>
      </div>

      {/* Enhanced Information */}
      <div className="mb-4 p-3 bg-white/50 rounded border text-left">
        <div className="text-xs space-y-1 text-left">
          <div className="text-left"><strong>Severity:</strong> <span className="capitalize">{anomaly.severity}</span></div>
          <div className="text-left"><strong>Confidence:</strong> {(anomaly.anomaly_score * 100).toFixed(1)}%</div>
          <div className="text-left"><strong>Detected:</strong> {new Date(anomaly.detected_at).toLocaleString()}</div>
          {anomaly.contributing_factors.current_reading !== undefined && (
            <div className="text-left"><strong>Current Reading:</strong> {anomaly.contributing_factors.current_reading} {utilityType === 'water' ? 'm³' : 'kWh'}</div>
          )}
          {anomaly.contributing_factors.previous_reading !== undefined && (
            <div className="text-left"><strong>Previous Reading:</strong> {anomaly.contributing_factors.previous_reading} {utilityType === 'water' ? 'm³' : 'kWh'}</div>
          )}
          {anomaly.contributing_factors.reading_value !== undefined && (
            <div className="text-left"><strong>Reading Value:</strong> {anomaly.contributing_factors.reading_value} {utilityType === 'water' ? 'm³' : 'kWh'}</div>
          )}
          {anomaly.contributing_factors.rollback_amount !== undefined && (
            <div className="text-left"><strong>Rollback Amount:</strong> {anomaly.contributing_factors.rollback_amount} {utilityType === 'water' ? 'm³' : 'kWh'}</div>
          )}
          {anomaly.contributing_factors.spike_ratio !== undefined && (
            <div className="text-left"><strong>Spike Ratio:</strong> {anomaly.contributing_factors.spike_ratio.toFixed(2)}x</div>
          )}
          {anomaly.contributing_factors.increase_ratio !== undefined && (
            <div className="text-left"><strong>Increase Ratio:</strong> {anomaly.contributing_factors.increase_ratio.toFixed(2)}x</div>
          )}
          {anomaly.contributing_factors.threshold_used !== undefined && (
            <div className="text-left"><strong>Threshold Used:</strong> {anomaly.contributing_factors.threshold_used}</div>
          )}
          {anomaly.contributing_factors.used_clean_reference && (
            <div className="text-left"><strong>Reference:</strong> Using clean data (excludes previous anomalies)</div>
          )}
          {anomaly.contributing_factors.training_samples && (
            <div className="text-left"><strong>Training Data:</strong> {anomaly.contributing_factors.training_samples} readings</div>
          )}
          {suggestions.enhanced && (
            <>
              <div className="text-left"><strong>Urgency:</strong> {suggestions.enhanced.urgencyLevel}</div>
              {suggestions.enhanced.estimatedTimeToResolve && (
                <div className="text-left"><strong>Est. Resolution:</strong> {suggestions.enhanced.estimatedTimeToResolve}</div>
              )}
              {suggestions.enhanced.costImplication && suggestions.enhanced.costImplication !== 'none' && (
                <div className="text-left"><strong>Cost Impact:</strong> {suggestions.enhanced.costImplication}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Likely Root Causes */}
      {explanation.likelyRoot && explanation.likelyRoot.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Likely Root Causes
          </h4>
          <ul className="space-y-1 text-sm text-blue-700">
            {explanation.likelyRoot.slice(0, 3).map((cause, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diagnostic Steps */}
      {explanation.diagnosticSteps && explanation.diagnosticSteps.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
          <h4 className="font-semibold text-sm text-purple-800 mb-2 flex items-center">
            <Wrench className="w-4 h-4 mr-1" />
            Diagnostic Steps
          </h4>
          <ul className="space-y-1 text-sm text-purple-700">
            {explanation.diagnosticSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Simplified: What to do now */}
      <div className="mb-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-sm text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            What to do now
          </h4>
          <ul className="space-y-1 text-sm text-red-700">
            {suggestions.immediate.map((action, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Feedback Section - Only show for low and medium severity without feedback */}
      {showFeedback && !feedbackProvided && (anomaly.severity === 'low' || anomaly.severity === 'medium') && (
        <div className="border-t pt-3">
          <div className="mb-3">
            <span className="text-sm font-medium">Is this reading:</span>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFeedback('correct')}
              disabled={isSubmittingFeedback}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="w-3 h-3" />
              Anomaly
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFeedback('false_positive')}
              disabled={isSubmittingFeedback}
              className="flex items-center gap-1"
            >
              <ThumbsDown className="w-3 h-3" />
              Normal
            </Button>
          </div>
        </div>
      )}

      {/* Critical anomalies show auto-feedback message - always visible */}
      {anomaly.severity === 'critical' && (
        <div className="border-t pt-3">
          <div className="text-xs text-center text-gray-600">
            <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
            Critical anomaly automatically confirmed as accurate
          </div>
        </div>
      )}

      {/* Dismiss button for non-reviewed anomalies */}
      {onDismiss && !feedbackProvided && (
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      )}

    </div>
  );
});

UnifiedAnomalyAlert.displayName = 'UnifiedAnomalyAlert';

export default UnifiedAnomalyAlert;