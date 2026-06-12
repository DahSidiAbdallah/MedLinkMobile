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
import { colors, spacing, shadow, animation, radius } from '../theme';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import FlagGB from '../assets/gb.svg';
import FlagFR from '../assets/fr.svg';
import FlagMR from '../assets/mr.svg';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingStep = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradient: readonly [string, string, ...string[]];
};

const STEP_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  welcome: 'medical',
  scan: 'camera',
  reminders: 'notifications',
  facilities: 'location',
};
// All steps stay within the brand-blue family for a cohesive, premium feel
const STEP_GRADIENTS: Record<string, readonly [string, string, ...string[]]> = {
  welcome: colors.primaryGradient,
  scan: ['#1A75D6', '#0066CC'] as const,
  reminders: colors.heroGradient,
  facilities: ['#0052A3', '#00407F'] as const,
};

type OnboardingFlowProps = {
  onComplete: () => void;
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: t('languages.english', 'English'), Flag: FlagGB },
    { code: 'fr', label: t('languages.french', 'French'), Flag: FlagFR },
    { code: 'ar', label: t('languages.arabic', 'Arabic'), Flag: FlagMR },
  ];

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: t('onboarding.steps.welcome.title', 'Welcome to MedLink'),
      subtitle: t('onboarding.steps.welcome.subtitle', 'Your Personal Health Companion'),
      description: t('onboarding.steps.welcome.description', 'Manage medications, track reminders, and access healthcare facilities all in one place.'),
      icon: STEP_ICONS.welcome,
      gradient: STEP_GRADIENTS.welcome,
    },
    {
      id: 'scan',
      title: t('onboarding.steps.scan.title', 'Scan & Verify'),
      subtitle: t('onboarding.steps.scan.subtitle', 'Smart Medication Scanner'),
      description: t('onboarding.steps.scan.description', 'Scan barcodes to verify medications, check for recalls, and detect potential interactions.'),
      icon: STEP_ICONS.scan,
      gradient: STEP_GRADIENTS.scan,
    },
    {
      id: 'reminders',
      title: t('onboarding.steps.reminders.title', 'Never Miss a Dose'),
      subtitle: t('onboarding.steps.reminders.subtitle', 'Smart Reminders'),
      description: t('onboarding.steps.reminders.description', 'Set up personalized medication reminders and track your daily progress.'),
      icon: STEP_ICONS.reminders,
      gradient: STEP_GRADIENTS.reminders,
    },
    {
      id: 'facilities',
      title: t('onboarding.steps.facilities.title', 'Find Care Nearby'),
      subtitle: t('onboarding.steps.facilities.subtitle', 'Healthcare Facilities'),
      description: t('onboarding.steps.facilities.description', 'Locate nearby clinics, hospitals, and pharmacies with real-time availability.'),
      icon: STEP_ICONS.facilities,
      gradient: STEP_GRADIENTS.facilities,
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [showLanguageSelection, setShowLanguageSelection] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const langFadeAnim = useRef(new Animated.Value(1)).current;

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
    if (showLanguageSelection) {
      // Transition from language selection to onboarding
      Animated.timing(langFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowLanguageSelection(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

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

  const handleLanguageSelect = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
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

  // Language Selection Screen
  if (showLanguageSelection) {
    return (
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: langFadeAnim,
          }
        ]}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          <View style={styles.header}>
            <Pressable onPress={onComplete} style={styles.skipButton}>
              <Text style={styles.skipText}>{t('onboarding.skip', 'Skip')}</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="language" size={64} color="#fff" />
            </View>
            
            <Text style={styles.title}>{t('common.languageSettings', 'Language Settings')}</Text>
            <Text style={styles.description}>{t('common.selectLanguagePrompt', 'Choose your preferred language')}</Text>

            <View style={styles.languageOptions}>
              {languages.map((lang, index) => (
                <Animated.View
                  key={lang.code}
                  style={{
                    opacity: langFadeAnim,
                    transform: [
                      {
                        translateY: langFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        })
                      },
                      {
                        scale: langFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }
                    ]
                  }}
                >
                  <Pressable
                    onPress={() => handleLanguageSelect(lang.code)}
                    style={({ pressed }) => [
                      styles.languageCard,
                      i18n.language === lang.code && styles.languageCardActive,
                      pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }
                    ]}
                  >
                    <View style={[styles.langFlagWrap, i18n.language === lang.code && styles.langFlagWrapActive]}>
                      <View style={styles.langFlagLarge}>
                        <lang.Flag width={48} height={32} />
                      </View>
                    </View>
                    <Text style={[styles.languageLabel, i18n.language === lang.code && styles.languageLabelActive]}>
                      {lang.label}
                    </Text>
                    {i18n.language === lang.code && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={28} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={styles.navigation}>
            <Button
              title={t('onboarding.next', 'Next')}
              onPress={handleNext}
              variant="ghost"
              style={styles.nextButton}
              textStyle={styles.nextButtonText}
              icon={<Ionicons name="chevron-forward" size={20} color="#fff" />}
              iconPosition="right"
            />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Regular Onboarding Steps
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
            <Text style={styles.skipText}>{t('onboarding.skip', 'Skip')}</Text>
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
              <Text style={styles.navText}>{t('onboarding.back', 'Back')}</Text>
            </Pressable>
          )}
          
          <View style={{ flex: 1 }} />
          
          <Button
            title={isLastStep ? t('onboarding.getStarted', 'Get Started') : t('onboarding.next', 'Next')}
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
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
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
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadow.lg,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: 340,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 10,
    borderRadius: 5,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
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
  languageOptions: {
    width: '100%',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xxxx,
    gap: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.card,
  },
  languageCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadow.xl,
  },
  langFlagWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  langFlagWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    ...shadow.lg,
  },
  langFlagLarge: {
    width: 48,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.3,
  },
  languageLabelActive: {
    color: '#fff',
    fontWeight: '800',
  },
  checkmark: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});