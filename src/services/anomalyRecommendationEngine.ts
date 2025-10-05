/**
 * Enhanced Anomaly Recommendation Engine
 * Provides context-aware, severity-based, and anomaly-type-specific recommendations
 */

export interface AnomalyData {
  id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  contributing_factors: {
    reason?: string;
    current_reading?: number;
    previous_reading?: number;
    rollback_amount?: number;
    detection_method?: string;
    used_clean_reference?: boolean;
    reading_value?: number;
    training_samples?: number;
    threshold_used?: number;
    current_consumption?: number;
    typical_consumption?: number;
    time_of_day?: string;
    day_of_week?: string;
    season?: string;
    [key: string]: any;
  };
  user_feedback?: string | null;
  user_feedback_at?: string | null;
}

export interface RecommendationSet {
  immediate: string[];
  shortTerm: string[];
  prevention: string[];
  contextualTips?: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedTimeToResolve?: string;
  costImplication?: 'none' | 'low' | 'medium' | 'high';
}

export interface EnhancedRecommendations extends RecommendationSet {
  explanation: {
    title: string;
    description: string;
    technical: string;
    likelyRoot: string[];
    diagnosticSteps: string[];
  };
  prioritizedActions: {
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    timeframe: 'immediate' | 'today' | 'this_week' | 'this_month';
    costRange?: string;
    difficulty: 'easy' | 'moderate' | 'difficult' | 'professional';
  }[];
}

class AnomalyRecommendationEngine {
  /**
   * Generate enhanced, context-aware recommendations for detected anomalies
   */
  generateRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: {
      hasMultipleProperties?: boolean;
      propertyType?: 'apartment' | 'house' | 'commercial';
      householdSize?: number;
      seasonalPatterns?: any;
      previousAnomalies?: AnomalyData[];
      installedDevices?: string[];
    }
  ): EnhancedRecommendations {
    const factors = anomaly.contributing_factors;
    const isWater = utilityType === 'water';
    const utilityLabel = isWater ? 'water' : 'electricity';

    // Determine anomaly category
    const anomalyType = this.categorizeAnomaly(factors);

    // Get base recommendations by type
    let recommendations: EnhancedRecommendations;

    switch (anomalyType) {
      case 'rollback':
        recommendations = this.getRollbackRecommendations(anomaly, utilityType, userContext);
        break;
      case 'extreme_usage':
        recommendations = this.getExtremeUsageRecommendations(anomaly, utilityType, userContext);
        break;
      case 'pattern_anomaly':
        recommendations = this.getPatternAnomalyRecommendations(anomaly, utilityType, userContext);
        break;
      case 'zero_reading':
        recommendations = this.getZeroReadingRecommendations(anomaly, utilityType, userContext);
        break;
      case 'seasonal_anomaly':
        recommendations = this.getSeasonalAnomalyRecommendations(anomaly, utilityType, userContext);
        break;
      default:
        recommendations = this.getGenericRecommendations(anomaly, utilityType, userContext);
    }

    // Apply severity-based enhancements
    recommendations = this.enhanceBasedOnSeverity(recommendations, anomaly.severity);

    // Apply contextual enhancements
    if (userContext) {
      recommendations = this.applyContextualEnhancements(recommendations, userContext, utilityType);
    }

    // Add time-sensitive recommendations
    recommendations = this.addTimeSensitiveRecommendations(recommendations, anomaly, utilityType);

    return recommendations;
  }

  private categorizeAnomaly(factors: AnomalyData['contributing_factors']): string {
    const reason = factors.reason?.toLowerCase() || '';

    if (reason.includes('rollback')) return 'rollback';
    if (reason.includes('physical') || reason.includes('extreme')) return 'extreme_usage';
    if (reason.includes('zero') || factors.current_reading === 0) return 'zero_reading';
    if (reason.includes('seasonal') || reason.includes('weather')) return 'seasonal_anomaly';
    if (reason.includes('pattern') || reason.includes('consumption')) return 'pattern_anomaly';

    return 'generic';
  }

  private getRollbackRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';
    const rollbackAmount = anomaly.contributing_factors.rollback_amount || 0;

    return {
      explanation: {
        title: 'Meter Rollback Detected',
        description: `Your ${utilityType} meter reading decreased by ${rollbackAmount} units, which is physically impossible. This indicates a meter malfunction or reading error.`,
        technical: `Current: ${anomaly.contributing_factors.current_reading ?? 'Unknown'}, Previous: ${anomaly.contributing_factors.previous_reading ?? 'Unknown'}`,
        likelyRoot: [
          'Meter malfunction or reset',
          'Digital display error',
          'Mechanical counter rollover',
          'Utility company meter replacement',
          'Reading error or OCR misinterpretation'
        ],
        diagnosticSteps: [
          'Visually inspect meter display for damage',
          'Take clear photos of current reading',
          'Check if meter serial number has changed',
          'Verify reading with manual count if possible'
        ]
      },
      immediate: [
        'Take multiple clear photos of the meter display from different angles',
        'Write down the exact reading you see with pen and paper',
        'Check if the meter display is damaged, cracked, or malfunctioning',
        'Note the meter serial number and model',
        'Document the time and date of this reading'
      ],
      shortTerm: [
        `Contact your ${utilityType} utility company immediately to report the meter issue`,
        'Request a meter inspection or replacement',
        'Provide photos and documentation to utility company',
        'Ask for manual meter reading verification',
        'Keep detailed logs of all readings until meter is fixed',
        'Request billing adjustment if necessary'
      ],
      prevention: [
        'Set up monthly meter reading reminders',
        'Take photos of each reading for your records',
        'Learn proper meter reading techniques',
        'Report any physical damage to meter immediately',
        'Consider smart meter upgrade if available'
      ],
      contextualTips: [
        'Digital meters are more prone to display malfunctions',
        'Mechanical meters rarely roll backwards unless physically damaged',
        'Utility companies are required to investigate meter rollbacks',
        'Keep records for at least 2 years for billing disputes'
      ],
      urgencyLevel: 'critical',
      estimatedTimeToResolve: '3-7 business days',
      costImplication: 'none',
      prioritizedActions: [
        {
          action: 'Contact utility company immediately',
          priority: 'critical',
          timeframe: 'immediate',
          difficulty: 'easy'
        },
        {
          action: 'Document current meter reading with photos',
          priority: 'critical',
          timeframe: 'immediate',
          difficulty: 'easy'
        },
        {
          action: 'Request meter inspection',
          priority: 'high',
          timeframe: 'today',
          difficulty: 'easy'
        }
      ]
    };
  }

  private getExtremeUsageRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';
    const reading = anomaly.contributing_factors.current_reading || anomaly.contributing_factors.reading_value;
    const threshold = anomaly.contributing_factors.threshold_used;

    return {
      explanation: {
        title: 'Extreme Usage Detected',
        description: `Your ${utilityType} reading of ${reading} units significantly exceeds typical residential consumption patterns.`,
        technical: `Reading: ${reading ?? 'Unknown'}, Threshold: ${threshold ?? 'Unknown'}, Anomaly score: ${(anomaly.anomaly_score * 100).toFixed(1)}%`,
        likelyRoot: isWater ? [
          'Major water leak (pipe burst, toilet leak)',
          'Irrigation system malfunction',
          'Pool filling or maintenance',
          'Appliance malfunction (washing machine, dishwasher)',
          'Meter reading error',
          'Unusual household activity'
        ] : [
          'HVAC system malfunction or inefficiency',
          'Electrical fault causing power draw',
          'New high-consumption appliances',
          'Cryptocurrency mining or server equipment',
          'Electric heating malfunction',
          'Meter reading error'
        ],
        diagnosticSteps: [
          'Turn off all appliances and check if usage stops',
          'Systematically check each major consumption source',
          'Monitor usage in real-time if possible',
          'Check for obvious signs of leaks or malfunctions'
        ]
      },
      immediate: isWater ? [
        'Check all visible pipes, faucets, and toilets for leaks',
        'Listen for running water sounds throughout the property',
        'Check water meter - if dial is spinning with all water off, you have a leak',
        'Look for wet spots, pooling, or soggy areas around the property',
        'Turn off main water supply if leak suspected and usage is extreme'
      ] : [
        'Check if heating/cooling systems are running continuously',
        'Look for electrical panels that are warm to touch',
        'Check for lights, electronics, or appliances left on',
        'Listen for unusual electrical humming or buzzing',
        'Turn off non-essential circuits to isolate high usage'
      ],
      shortTerm: isWater ? [
        'Schedule professional leak detection service',
        'Inspect toilet flappers and tank water levels',
        'Check irrigation system for broken sprinklers or stuck valves',
        'Test washing machine and dishwasher for proper operation',
        'Monitor hourly usage for 24-48 hours to identify patterns',
        'Consider installing water monitoring devices'
      ] : [
        'Schedule HVAC system inspection and tune-up',
        'Use energy monitoring devices to identify high-consumption circuits',
        'Check insulation and seal air leaks',
        'Inspect major appliances for efficiency issues',
        'Consider electrical system inspection if usage remains high',
        'Monitor hourly usage patterns to identify peak consumption'
      ],
      prevention: [
        'Install smart monitoring devices for real-time usage tracking',
        'Schedule regular maintenance for all major systems',
        'Learn to recognize early warning signs of system issues',
        'Set up usage alerts to catch problems early',
        'Upgrade to more efficient appliances and systems when possible'
      ],
      contextualTips: isWater ? [
        'A single toilet leak can waste 200+ gallons per day',
        'Underground leaks are often silent but show on meter',
        'Seasonal irrigation can dramatically increase usage',
        'Swimming pool fills should be scheduled with utility company'
      ] : [
        'HVAC systems account for 40-60% of residential electricity use',
        'Electric water heaters are often the second largest consumer',
        'Vampire loads from electronics can add 5-10% to usage',
        'Heat pumps are much more efficient than electric resistance heating'
      ],
      urgencyLevel: anomaly.severity === 'critical' ? 'critical' : 'high',
      estimatedTimeToResolve: 'Same day to 1 week',
      costImplication: anomaly.severity === 'critical' ? 'high' : 'medium',
      prioritizedActions: [
        {
          action: isWater ? 'Check for obvious leaks' : 'Check HVAC and major appliances',
          priority: 'critical',
          timeframe: 'immediate',
          difficulty: 'easy'
        },
        {
          action: 'Monitor usage patterns over 24 hours',
          priority: 'high',
          timeframe: 'today',
          difficulty: 'easy'
        },
        {
          action: 'Schedule professional inspection',
          priority: 'high',
          timeframe: 'this_week',
          costRange: '$150-$500',
          difficulty: 'professional'
        }
      ]
    };
  }

  private getPatternAnomalyRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';
    const currentConsumption = anomaly.contributing_factors.current_consumption;
    const typicalConsumption = anomaly.contributing_factors.typical_consumption;
    const increasePercent = currentConsumption && typicalConsumption
      ? ((currentConsumption - typicalConsumption) / typicalConsumption * 100).toFixed(1)
      : 'unknown';

    return {
      explanation: {
        title: 'Unusual Consumption Pattern',
        description: `Your ${utilityType} usage is ${increasePercent}% higher than your typical pattern, suggesting a change in consumption behavior or system efficiency.`,
        technical: `Current: ${currentConsumption ?? 'Unknown'}, Typical: ${typicalConsumption ?? 'Unknown'}, Variance: ${increasePercent ?? 'Unknown'}%`,
        likelyRoot: [
          'Seasonal changes affecting usage',
          'Changes in household routine or occupancy',
          'Gradual system inefficiency or wear',
          'New appliances or devices',
          'Changes in rates or billing structure',
          'Weather-related consumption changes'
        ],
        diagnosticSteps: [
          'Compare usage to same period last year',
          'Identify any changes in household or equipment',
          'Track daily patterns to identify specific increases',
          'Consider external factors (weather, guests, etc.)'
        ]
      },
      immediate: [
        `Review recent changes in household routine that might affect ${utilityType} use`,
        'Consider if guests, new occupants, or schedule changes have occurred',
        'Check if weather changes have required more heating/cooling or water use',
        'Note any new appliances, devices, or equipment recently added',
        'Take manual readings for next few days to confirm pattern'
      ],
      shortTerm: [
        'Track detailed daily usage for one week to identify specific increases',
        'Compare current usage to same period from previous year',
        'Audit all major appliances and systems for efficiency changes',
        'Consider if seasonal patterns are earlier or more pronounced than usual',
        'Monitor usage at different times of day to identify peak periods',
        'Check with household members about usage habit changes'
      ],
      prevention: [
        'Establish baseline consumption patterns for different seasons',
        'Set up automated usage alerts for significant increases',
        'Keep a household log of major changes or additions',
        'Regular efficiency maintenance for all major systems',
        'Stay informed about factors that affect utility consumption'
      ],
      contextualTips: [
        'Usage patterns often change gradually before becoming obvious',
        'Weather can affect utility usage for weeks after temperature changes',
        'Household size changes have delayed effects on consumption patterns',
        'Appliance efficiency degrades slowly over time'
      ],
      urgencyLevel: anomaly.severity === 'critical' ? 'high' : 'medium',
      estimatedTimeToResolve: '1-2 weeks of monitoring',
      costImplication: 'low',
      prioritizedActions: [
        {
          action: 'Track usage patterns for one week',
          priority: 'medium',
          timeframe: 'this_week',
          difficulty: 'easy'
        },
        {
          action: 'Identify recent household or system changes',
          priority: 'medium',
          timeframe: 'today',
          difficulty: 'easy'
        },
        {
          action: 'Compare to historical usage data',
          priority: 'low',
          timeframe: 'this_week',
          difficulty: 'moderate'
        }
      ]
    };
  }

  private getZeroReadingRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';

    return {
      explanation: {
        title: 'Zero Reading Detected',
        description: `Your ${utilityType} meter shows zero consumption, which may indicate a meter issue, service disconnection, or reading error.`,
        technical: `Reading: 0, Detection method: ${anomaly.contributing_factors.detection_method ?? 'Unknown'}`,
        likelyRoot: [
          'Meter malfunction or reset',
          'Service disconnection',
          'OCR reading error (camera/scanning issue)',
          'Meter display not functioning',
          'No actual consumption (vacancy)'
        ],
        diagnosticSteps: [
          'Verify meter display is functioning and readable',
          'Check if service is actually connected and flowing',
          'Confirm property occupancy and normal usage',
          'Test basic functionality (turn on faucet/light)'
        ]
      },
      immediate: [
        'Verify that your service is actually working (turn on a light/faucet)',
        'Check the meter display for proper function and readability',
        'Take a clear photo of the meter showing the zero reading',
        'Check if there are any service notices or disconnection warnings',
        'Verify the meter numbers match your account information'
      ],
      shortTerm: [
        'Contact utility company to verify service status and meter function',
        'Request meter reading verification',
        'Check if there are any billing or payment issues affecting service',
        'Monitor for several days to see if usage registers',
        'Consider if property was vacant during the reading period'
      ],
      prevention: [
        'Ensure meter is easily accessible and readable',
        'Keep meter area clean and well-lit',
        'Report meter display issues immediately',
        'Maintain current account information with utility company'
      ],
      urgencyLevel: 'medium',
      estimatedTimeToResolve: '1-3 business days',
      costImplication: 'none',
      prioritizedActions: [
        {
          action: 'Verify service is working',
          priority: 'high',
          timeframe: 'immediate',
          difficulty: 'easy'
        },
        {
          action: 'Contact utility company',
          priority: 'medium',
          timeframe: 'today',
          difficulty: 'easy'
        }
      ]
    };
  }

  private getSeasonalAnomalyRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';

    return {
      explanation: {
        title: 'Seasonal Usage Anomaly',
        description: `Your ${utilityType} usage pattern differs significantly from expected seasonal norms, possibly due to weather extremes or system inefficiency.`,
        technical: `Season: ${anomaly.contributing_factors.season ?? 'Unknown'}, Anomaly score: ${(anomaly.anomaly_score * 100).toFixed(1)}%`,
        likelyRoot: [
          'Extreme weather conditions',
          'System inefficiency in extreme conditions',
          'Seasonal equipment malfunction',
          'Changes in seasonal usage patterns',
          'Insulation or weatherization issues'
        ],
        diagnosticSteps: [
          'Compare to weather data for the period',
          'Check seasonal equipment (AC, heating, irrigation)',
          'Review insulation and weatherization effectiveness',
          'Consider changes in seasonal routine'
        ]
      },
      immediate: [
        'Check that seasonal equipment is operating efficiently',
        'Review thermostat settings for appropriateness to weather',
        'Check for air leaks around windows and doors',
        'Verify seasonal systems are properly maintained',
        'Consider if extreme weather requires temporary usage changes'
      ],
      shortTerm: [
        'Schedule maintenance for seasonal equipment before peak season',
        'Improve insulation and weatherization if usage consistently high',
        'Consider upgrading to more efficient seasonal equipment',
        'Establish weather-appropriate usage guidelines',
        'Track usage correlation with weather data'
      ],
      prevention: [
        'Regular seasonal equipment maintenance',
        'Proper insulation and weatherization',
        'Smart thermostat for efficient climate control',
        'Weather-based usage planning and budgeting'
      ],
      urgencyLevel: 'medium',
      estimatedTimeToResolve: 'Seasonal - 1-3 months',
      costImplication: 'medium',
      prioritizedActions: [
        {
          action: 'Check seasonal equipment efficiency',
          priority: 'medium',
          timeframe: 'today',
          difficulty: 'easy'
        },
        {
          action: 'Schedule equipment maintenance',
          priority: 'medium',
          timeframe: 'this_week',
          costRange: '$100-$300',
          difficulty: 'professional'
        }
      ]
    };
  }

  private getGenericRecommendations(
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity',
    userContext?: any
  ): EnhancedRecommendations {
    const isWater = utilityType === 'water';

    return {
      explanation: {
        title: 'Anomaly Detected',
        description: `Your ${utilityType} usage shows patterns that deviate from normal consumption, requiring investigation.`,
        technical: `Anomaly score: ${(anomaly.anomaly_score * 100).toFixed(1)}%, Method: ${anomaly.contributing_factors.detection_method ?? 'Unknown'}`,
        likelyRoot: [
          'Usage pattern changes',
          'System efficiency changes',
          'Measurement or calculation variance',
          'External factors affecting consumption'
        ],
        diagnosticSteps: [
          'Monitor usage for several days',
          'Check all major systems and appliances',
          'Compare to historical patterns',
          'Consider external factors'
        ]
      },
      immediate: [
        'Take a clear photo of your current meter reading',
        'Note any recent changes in household routine or equipment',
        'Do a basic inspection of major systems and appliances',
        'Check for any obvious issues or unusual activities'
      ],
      shortTerm: [
        'Monitor usage for the next week to confirm the pattern',
        'Compare current usage to historical data if available',
        'Contact utility company if patterns remain unexplained',
        'Consider professional assessment if usage remains high'
      ],
      prevention: [
        'Establish regular monitoring routine',
        'Keep maintenance schedules current',
        'Stay aware of factors that affect utility consumption'
      ],
      urgencyLevel: 'low',
      estimatedTimeToResolve: '1-2 weeks',
      costImplication: 'low',
      prioritizedActions: [
        {
          action: 'Monitor usage patterns',
          priority: 'low',
          timeframe: 'this_week',
          difficulty: 'easy'
        }
      ]
    };
  }

  private enhanceBasedOnSeverity(
    recommendations: EnhancedRecommendations,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): EnhancedRecommendations {
    // Enhance urgency and add severity-specific actions
    switch (severity) {
      case 'critical':
        recommendations.urgencyLevel = 'critical';
        recommendations.immediate.unshift('URGENT: Address this issue immediately to prevent potential damage or excessive costs');
        recommendations.costImplication = recommendations.costImplication === 'none' ? 'medium' : 'high';
        break;
      case 'high':
        recommendations.urgencyLevel = recommendations.urgencyLevel === 'low' ? 'medium' : recommendations.urgencyLevel;
        recommendations.shortTerm.unshift('Prioritize resolving this issue within 24-48 hours');
        break;
      case 'medium':
        recommendations.contextualTips?.push('Monitor closely - medium severity anomalies can escalate if not addressed');
        break;
      case 'low':
        recommendations.contextualTips?.push('While not urgent, tracking this pattern will help catch issues early');
        break;
    }

    return recommendations;
  }

  private applyContextualEnhancements(
    recommendations: EnhancedRecommendations,
    userContext: any,
    utilityType: 'water' | 'electricity'
  ): EnhancedRecommendations {
    // Add context-specific recommendations
    if (userContext.propertyType === 'apartment') {
      recommendations.contextualTips?.push('In apartments, some utility issues may require landlord or property management involvement');
      recommendations.shortTerm.push('Contact property management if issue appears to be building-wide');
    }

    if (userContext.householdSize && userContext.householdSize > 4) {
      recommendations.contextualTips?.push('Large households naturally have higher usage - compare to similar-sized households');
    }

    if (userContext.previousAnomalies && userContext.previousAnomalies.length > 0) {
      recommendations.contextualTips?.push('Consider patterns from previous anomalies - recurring issues may indicate systemic problems');
    }

    if (userContext.installedDevices?.includes('smart_meter')) {
      recommendations.immediate.push('Check your smart meter app or portal for real-time usage data');
    }

    return recommendations;
  }

  private addTimeSensitiveRecommendations(
    recommendations: EnhancedRecommendations,
    anomaly: AnomalyData,
    utilityType: 'water' | 'electricity'
  ): EnhancedRecommendations {
    const detectedAt = new Date(anomaly.detected_at);
    const now = new Date();
    const hoursSinceDetection = Math.floor((now.getTime() - detectedAt.getTime()) / (1000 * 60 * 60));

    // Add time-sensitive context
    if (hoursSinceDetection > 24) {
      recommendations.contextualTips?.push(`This anomaly was detected ${hoursSinceDetection} hours ago - extended duration may indicate ongoing issue`);
    }

    // Add time-of-day context
    const detectionHour = detectedAt.getHours();
    if (detectionHour >= 22 || detectionHour <= 6) {
      recommendations.contextualTips?.push('Detected during off-peak hours - unusual for typical consumption patterns');
    }

    return recommendations;
  }
}

export const anomalyRecommendationEngine = new AnomalyRecommendationEngine();
export default anomalyRecommendationEngine;