import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  availableSlots: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function AppointmentBooking({ navigation }: { navigation: any }) {
  const { t, i18n } = useTranslation();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const specialties = [
    t('appointmentBooking.specialties.generalPractice'),
    t('appointmentBooking.specialties.cardiology'),
    t('appointmentBooking.specialties.dermatology'),
    t('appointmentBooking.specialties.pediatrics'),
    t('appointmentBooking.specialties.orthopedics'),
    t('appointmentBooking.specialties.neurology'),
    t('appointmentBooking.specialties.psychiatry'),
    t('appointmentBooking.specialties.gynecology'),
  ];

  const mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'General Practice',
      rating: 4.8,
      experience: '10 years',
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      rating: 4.9,
      experience: '15 years',
      availableSlots: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
    },
    {
      id: '3',
      name: 'Dr. Emily Davis',
      specialty: 'Dermatology',
      rating: 4.7,
      experience: '8 years',
      availableSlots: ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      specialty: 'Pediatrics',
      rating: 4.9,
      experience: '12 years',
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    },
  ];

  useEffect(() => {
    if (selectedSpecialty) {
      const filtered = mockDoctors.filter(d => d.specialty === selectedSpecialty);
      setDoctors(filtered);
      setSelectedDoctor(null);
      setSelectedTime('');
    }
  }, [selectedSpecialty]);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      Alert.alert(t('appointmentBooking.missingInformation'), t('appointmentBooking.pleaseSelectAllFields'));
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await addDoc(collection(db, 'appointments'), {
        userId,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: selectedDate,
        time: selectedTime,
        status: 'scheduled',
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        t('appointmentBooking.appointmentBooked'),
        t('appointmentBooking.appointmentScheduled', { 
          doctor: selectedDoctor.name, 
          date: selectedDate.toLocaleDateString(i18n.language), 
          time: selectedTime 
        }),
        [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('appointmentBooking.bookingFailed'), t('appointmentBooking.unableToBook'));
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedDoctor) return [];
    
    return selectedDoctor.availableSlots.map(slot => ({
      time: slot,
      available: true, // In production, check actual availability
    }));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFB800" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFB800" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty_${i}`} name="star-outline" size={14} color="#FFB800" />
      );
    }

    return stars;
  };

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Text style={s.title}>{t('appointmentBooking.title')}</Text>
        <Text style={s.subtitle}>{t('appointmentBooking.selectSpecialty')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Specialty Selection */}
        <Card style={s.section}>
          <Text style={s.sectionTitle}>{t('appointmentBooking.selectSpecialty')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.specialtyContainer}>
              {specialties.map(specialty => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    s.specialtyChip,
                    selectedSpecialty === specialty && s.specialtyChipSelected,
                  ]}
                  onPress={() => setSelectedSpecialty(specialty)}
                >
                  <Text style={[
                    s.specialtyText,
                    selectedSpecialty === specialty && s.specialtyTextSelected,
                  ]}>
                    {specialty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Doctor Selection */}
        {selectedSpecialty && (
          <Card style={s.section}>
            <Text style={s.sectionTitle}>{t('appointmentBooking.selectDoctor')}</Text>
            {doctors.map(doctor => (
              <TouchableOpacity
                key={doctor.id}
                style={[
                  s.doctorCard,
                  selectedDoctor?.id === doctor.id && s.doctorCardSelected,
                ]}
                onPress={() => setSelectedDoctor(doctor)}
              >
                <View style={s.doctorInfo}>
                  <Text style={s.doctorName}>{doctor.name}</Text>
                  <Text style={s.doctorSpecialty}>{doctor.specialty}</Text>
                  <View style={s.doctorMeta}>
                    <View style={s.rating}>
                      {renderStars(doctor.rating)}
                      <Text style={s.ratingText}>{doctor.rating}</Text>
                    </View>
                    <Text style={s.experience}>{t('appointmentBooking.yearsExperience', { years: doctor.experience.split(' ')[0] })}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={selectedDoctor?.id === doctor.id ? colors.primary : colors.muted}
                />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Date Selection */}
        {selectedDoctor && (
          <Card style={s.section}>
            <Text style={s.sectionTitle}>{t('appointmentBooking.selectDate')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.dateContainer}>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.dateChip,
                        isSelected && s.dateChipSelected,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        s.dateDay,
                        isSelected && s.dateDaySelected,
                      ]}>
                        {date.toLocaleDateString(i18n.language, { weekday: 'short' })}
                      </Text>
                      <Text style={[
                        s.dateNumber,
                        isSelected && s.dateNumberSelected,
                      ]}>
                        {date.getDate()}
                      </Text>
                      <Text style={[
                        s.dateMonth,
                        isSelected && s.dateMonthSelected,
                      ]}>
                        {date.toLocaleDateString(i18n.language, { month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Time Selection */}
        {selectedDate && (
          <Card style={s.section}>
            <Text style={s.sectionTitle}>{t('appointmentBooking.selectTime')}</Text>
            <View style={s.timeGrid}>
              {generateTimeSlots().map(slot => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    s.timeChip,
                    selectedTime === slot.time && s.timeChipSelected,
                    !slot.available && s.timeChipDisabled,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    s.timeText,
                    selectedTime === slot.time && s.timeTextSelected,
                    !slot.available && s.timeTextDisabled,
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Book Button */}
        {selectedTime && (
          <TouchableOpacity style={s.bookButton} onPress={() => setShowConfirmModal(true)}>
            <Text style={s.bookButtonText}>{t('appointmentBooking.bookAppointment')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={s.modalOverlay}>
          <Card style={s.modalContent}>
            <Text style={s.modalTitle}>{t('appointmentBooking.confirmBooking')}</Text>
            <Text style={s.modalSubtitle}>
              {selectedDoctor?.name} - {selectedDate?.toLocaleDateString(i18n.language)} at {selectedTime}
            </Text>
            <View style={s.confirmDetails}>
              <Text style={s.confirmText}>
                <Text style={s.confirmLabel}>{t('appointmentBooking.doctor', 'Doctor')}:</Text> {selectedDoctor?.name}
              </Text>
              <Text style={s.confirmText}>
                <Text style={s.confirmLabel}>{t('appointmentBooking.specialty', 'Specialty')}:</Text> {selectedSpecialty}
              </Text>
              <Text style={s.confirmText}>
                <Text style={s.confirmLabel}>{t('appointmentBooking.date', 'Date')}:</Text> {selectedDate?.toLocaleDateString(i18n.language)}
              </Text>
              <Text style={s.confirmText}>
                <Text style={s.confirmLabel}>{t('appointmentBooking.time', 'Time')}:</Text> {selectedTime}
              </Text>
            </View>
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={s.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonConfirm]}
                onPress={handleBookAppointment}
                disabled={loading}
              >
                {loading ? (
                  <Text style={s.modalButtonTextConfirm}>{t('appointments.booking', 'Booking...')}</Text>
                ) : (
                  <Text style={s.modalButtonTextConfirm}>{t('appointments.confirm', 'Confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  specialtyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  specialtyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 120,
    alignItems: 'center',
  },
  specialtyChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  specialtyTextSelected: {
    color: '#fff',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  doctorCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary100,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: 12,
    color: colors.muted,
    marginLeft: 2,
  },
  experience: {
    fontSize: 12,
    color: colors.muted,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateChip: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 70,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: colors.primary100,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dateNumberSelected: {
    color: '#fff',
  },
  dateMonth: {
    fontSize: 11,
    color: colors.muted,
  },
  dateMonthSelected: {
    color: colors.primary100,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 70,
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipDisabled: {
    backgroundColor: colors.mutedLight,
    borderColor: colors.mutedLight,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  timeTextSelected: {
    color: '#fff',
  },
  timeTextDisabled: {
    color: colors.muted,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginVertical: spacing.lg,
    ...shadow.card,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confirmDetails: {
    marginBottom: spacing.xl,
  },
  confirmText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  confirmLabel: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
