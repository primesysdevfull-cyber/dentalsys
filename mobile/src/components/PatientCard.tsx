import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../types';
import { formatPhone, getInitials } from '../utils/format';

interface PatientCardProps {
  patient: Patient;
  onPress: (patient: Patient) => void;
}

export default function PatientCard({ patient, onPress }: PatientCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(patient.name)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {patient.name}
        </Text>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color="#94a3b8" />
          <Text style={styles.detail}>{formatPhone(patient.phone)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={14} color="#94a3b8" />
          <Text style={styles.detail} numberOfLines={1}>
            {patient.email}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detail: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
});
