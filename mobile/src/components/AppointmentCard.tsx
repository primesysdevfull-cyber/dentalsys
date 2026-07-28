import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment } from '../types';
import { formatCurrency, getStatusLabel, getStatusColor } from '../utils/format';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: (appointment: Appointment) => void;
  showPatient?: boolean;
}

export default function AppointmentCard({
  appointment,
  onPress,
  showPatient = true,
}: AppointmentCardProps) {
  const statusColor = getStatusColor(appointment.status);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(appointment)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.timeIndicator, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.time}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(appointment.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.procedure} numberOfLines={1}>
          {appointment.procedure}
        </Text>

        {showPatient && appointment.patient && (
          <View style={styles.patientRow}>
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text style={styles.patientName} numberOfLines={1}>
              {appointment.patient.name}
            </Text>
          </View>
        )}

        {appointment.value != null && appointment.value > 0 && (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{formatCurrency(appointment.value)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  procedure: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  patientName: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  valueRow: {
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0d9488',
  },
});
