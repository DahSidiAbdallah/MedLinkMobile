import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, shadow, animation } from '../theme';
import Button from './Button';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingStep = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradient: readonly [string, string, ...string[]];
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MedLink',
    subtitle: 'Your Personal Health Companion',
    description: 'Manage medications, track reminders, and access healthcare facilities all in one place.',
    icon: 'medical',
    gradient: colors.primaryGradient,
  },
  {
    id: 'scan',
    title: 'Scan & Verify',
    subtitle: 'Smart Medication Scanner',
    description: 'Scan barcodes to verify medications, check for recalls, and detect potential interactions.',
    icon: 'camera',
    gradient: colors.accentGradient,
  },
  {
    id: 'reminders',
    title: 'Never Miss a Dose',
    subtitle: 'Smart Reminders',
    description: 'Set up personalized medication reminders and track your daily progress.',
    icon: 'notifications',
    gradient: colors.successGradient,
  },
  {
    id: 'facilities',
    title: 'Find Care Nearby',
    subtitle: 'Healthcare Facilities',
    description: 'Locate nearby clinics, hospitals, and pharmacies with real-time availability.',
    icon: 'location',
    gradient: colors.warmGradient,
  },
];

type OnboardingFlowProps = {
  onComplete: () => void;
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.slow,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      Animated.timing(scrollX, {
        toValue: nextStep * screenWidth,
        duration: animation.normal,
        useNativeDriver: true,
      }).start();
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      Animated.timing(scrollX, {
        toValue: prevStep * screenWidth,
        duration: animation.normal,
        useNativeDriver: true,
      }).start();
    }
  };

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={step.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Skip button */}
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={step.icon} size={64} color="#fff" />
          </View>
          
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive
              ]}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <Pressable onPress={handlePrevious} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
              <Text style={styles.navText}>Back</Text>
            </Pressable>
          )}
          
          <View style={{ flex: 1 }} />
          
          <Button
            title={isLastStep ? 'Get Started' : 'Next'}
            onPress={handleNext}
            variant="ghost"
            style={styles.nextButton}
            textStyle={styles.nextButtonText}
            icon={
              !isLastStep ? (
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              ) : undefined
            }
            iconPosition="right"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: 300,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#fff',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});