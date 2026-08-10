import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl, ScrollView as NativeScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { detectionHistoryService, HistoryItem } from '../services/history/DetectionHistoryService';
import { environmentalImpactService } from '../services/dashboard/EnvironmentalImpactService';
import { trendAnalysisService } from '../services/dashboard/TrendAnalysisService';
import { goalService } from '../services/dashboard/GoalService';
import { achievementService } from '../services/dashboard/AchievementService';
import { challengeService } from '../services/challenges/ChallengeService';
import { badgeService } from '../services/badges/BadgeService';
import { ecoPointsService } from '../services/points/EcoPointsService';
import { personalizationService, PersonalizedInsight } from '../services/insights/PersonalizationService';

// Types
import { UserImpactReport } from '../services/ai/analyticsService';
import { TrendData } from '../types/Dashboard';
import { Goal } from '../types/Goal';
import { Achievement } from '../types/Achievement';
import { Challenge } from '../types/Challenge';
import { Badge } from '../types/Badge';
import { EcoPoints } from '../types/EcoPoints';

// Components
import ImpactSummaryCard from '../components/dashboard/ImpactSummaryCard';
import GoalCard from '../components/dashboard/GoalCard';
import TrendCard from '../components/dashboard/TrendCard';
import ChartCard from '../components/dashboard/ChartCard';
import ScoreCard from '../components/dashboard/ScoreCard';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import Card from '../components/Card';
import { useApp } from '../context/AppContext';

// New M6 Components
import { EcoPointsCard } from '../components/dashboard/EcoPointsCard';
import { StreakCard } from '../components/dashboard/StreakCard';
import { InsightCarousel } from '../components/dashboard/InsightCarousel';
import { ChallengeCard } from '../components/dashboard/ChallengeCard';
import { BadgeCard } from '../components/dashboard/BadgeCard';
import { ProgressTimeline } from '../components/dashboard/ProgressTimeline';

const AnalyticsScreen = () => {
  const { clearScans } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  
  // States
  const [report, setReport] = useState<UserImpactReport | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [points, setPoints] = useState<EcoPoints | null>(null);
  const [insight, setInsight] = useState<PersonalizedInsight | null>(null);

  const loadDashboardData = async () => {
    try {
      const items = await detectionHistoryService.getHistory();

      // Legacy Services
      const impact = environmentalImpactService.getComprehensiveImpact(items);
      setReport(impact);

      const trends = trendAnalysisService.analyzeTrends(items);
      setTrend(trends);

      const updatedGoals = await goalService.evaluateGoals(items);
      setGoals(updatedGoals);

      const updatedAchievements = await achievementService.evaluateAchievements(items);
      setAchievements(updatedAchievements);

      // New M6 Services
      const updatedChallenges = await challengeService.evaluateChallenges(items);
      setChallenges(updatedChallenges);

      const updatedBadges = await badgeService.evaluateBadges(items);
      setBadges(updatedBadges);
      
      const p = await ecoPointsService.getPoints();
      setPoints(p);

      const i = await personalizationService.generateInsights(items);
      setInsight(i);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const handleClear = async () => {
    await detectionHistoryService.clearHistory();
    clearScans();
    loadDashboardData();
  };

  if (!report || !trend || !points || !insight) {
    return (
      <View style={styles.center}>
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  // Create timeline events from points history
  const timelineEvents = points.history.slice(0, 5).map(h => ({
    title: h.source.toUpperCase(),
    subtitle: h.description,
    date: new Date(h.timestamp).toLocaleDateString(),
    isCompleted: true
  }));

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Your smart sustainability assistant.</Text>
      </View>

      <EcoPointsCard points={points} />
      <StreakCard currentStreak={trend.currentStreak} longestStreak={trend.longestStreak} />
      
      <InsightCarousel insight={insight} />

      <ScoreCard score={report.sustainabilityScore} />

      <ImpactSummaryCard 
        totalItems={report.totalItemsProcessed} 
        co2Saved={report.co2SavedKg} 
        wasteDiverted={report.wasteDivertedKg} 
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Challenges</Text>
        {challenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <NativeScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 8 }}>
          {badges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </NativeScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ProgressTimeline events={timelineEvents} />
      </View>

      <TrendCard trend={trend} />
      <ChartCard data={trend.dailyStats} />
      <CategoryBreakdown breakdown={report.categoryBreakdown as any} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals</Text>
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legacy Achievements</Text>
        <Card>
          {achievements.map((ach, index) => (
            <View key={ach.id} style={[styles.achievementRow, index !== 0 && styles.achievementBorder]}>
              <Text style={styles.achIcon}>{ach.icon}</Text>
              <View style={styles.achInfo}>
                <Text style={styles.achTitle}>{ach.title}</Text>
                <Text style={styles.achDesc}>{ach.description}</Text>
              </View>
              {ach.isUnlocked ? (
                <Text style={styles.unlocked}>Unlocked!</Text>
              ) : (
                <Text style={styles.locked}>{ach.progress}/{ach.target}</Text>
              )}
            </View>
          ))}
        </Card>
      </View>

      <Text style={styles.reset} onPress={handleClear}>
        Clear scan history
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f4ef',
  },
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#f6f4ef',
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3a2f22',
  },
  subtitle: {
    color: '#6a5b47',
    lineHeight: 20,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4a3b2a',
    marginBottom: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  achievementBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  achIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achInfo: {
    flex: 1,
  },
  achTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a2f22',
  },
  achDesc: {
    fontSize: 13,
    color: '#6a5b47',
  },
  unlocked: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locked: {
    fontSize: 12,
    color: '#6a5b47',
  },
  reset: {
    textAlign: 'center',
    color: '#8a5f2d',
    fontWeight: '700',
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 24,
  },
});

export default AnalyticsScreen;
