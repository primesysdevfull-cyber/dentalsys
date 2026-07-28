import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { patientsApi } from '../api/patients';
import { appointmentsApi } from '../api/appointments';
import AppointmentCard from '../components/AppointmentCard';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';
import {
  formatCPF,
  formatPhone,
  formatDate,
  getInitials,
} from '../utils/format';

type RouteProps = RouteProp<RootStackParamList, 'PatientDetail'>;

type TabType = 'info' | 'history' | 'appointments';

export default function PatientDetailScreen() {
  const route = useRoute<RouteProps>();
  const { patientId } = route.params;
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const {
    data: patient,
    isLoading: loadingPatient,
    refetch: refetchPatient,
  } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.getById(patientId),
  });

  const {
    data: appointmentsData,
    isLoading: loadingAppointments,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () =>
      appointmentsApi.list({ patientId, limit: 50 }),
  });

  const isLoading = loadingPatient || loadingAppointments;

  const handleRefresh = () => {
    refetchPatient();
    refetchAppointments();
  };

  if (isLoading && !patient) {
    return <LoadingScreen />;
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Paciente não encontrado</Text>
      </View>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'info', label: 'Informações' },
    { key: 'history', label: 'Histórico' },
    { key: 'appointments', label: 'Agendamentos' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor="#0d9488"
          colors={['#0d9488']}
        />
      }
    >
      <View style={styles.patientHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(patient.name)}</Text>
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientEmail}>{patient.email}</Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'info' && (
          <View style={styles.infoSection}>
            <InfoRow
              icon="call-outline"
              label="Telefone"
              value={formatPhone(patient.phone)}
            />
            <InfoRow
              icon="card-outline"
              label="CPF"
              value={formatCPF(patient.cpf)}
            />
            <InfoRow
              icon="calendar-outline"
              label="Data de Nascimento"
              value={formatDate(patient.birthDate)}
            />
            <InfoRow
              icon="male-female-outline"
              label="Gênero"
              value={
                patient.gender === 'M'
                  ? 'Masculino'
                  : patient.gender === 'F'
                    ? 'Feminino'
                    : 'Outro'
              }
            />
            {patient.address && (
              <>
                <Text style={styles.infoSectionTitle}>Endereço</Text>
                <InfoRow
                  icon="location-outline"
                  label="Logradouro"
                  value={`${patient.address.street}, ${patient.address.number}${
                    patient.address.complement
                      ? ` - ${patient.address.complement}`
                      : ''
                  }`}
                />
                <InfoRow
                  icon="map-outline"
                  label="Bairro"
                  value={patient.address.neighborhood}
                />
                <InfoRow
                  icon="business-outline"
                  label="Cidade/UF"
                  value={`${patient.address.city} - ${patient.address.state}`}
                />
                <InfoRow
                  icon="grid-outline"
                  label="CEP"
                  value={patient.address.zipCode}
                />
              </>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <>
                <Text style={styles.infoSectionTitle}>Alergias</Text>
                <View style={styles.tagsContainer}>
                  {patient.allergies.map((allergy, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {patient.medicalHistory && (
              <>
                <Text style={styles.infoSectionTitle}>Histórico Médico</Text>
                <Text style={styles.paragraph}>{patient.medicalHistory}</Text>
              </>
            )}
            {patient.notes && (
              <>
                <Text style={styles.infoSectionTitle}>Observações</Text>
                <Text style={styles.paragraph}>{patient.notes}</Text>
              </>
            )}
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.infoSection}>
            <EmptyState
              icon="document-text-outline"
              title="Histórico em breve"
              message="O histórico completo do paciente estará disponível aqui."
            />
          </View>
        )}

        {activeTab === 'appointments' && (
          <View style={styles.infoSection}>
            {appointmentsData?.data && appointmentsData.data.length > 0 ? (
              appointmentsData.data.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showPatient={false}
                />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Nenhum agendamento"
                message="Este paciente ainda não possui agendamentos."
                actionLabel="Agendar Consulta"
                onAction={() => {}}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.container}>
      <View style={infoRowStyles.iconContainer}>
        <Ionicons name={icon} size={18} color="#0d9488" />
      </View>
      <View style={infoRowStyles.content}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  patientHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0d9488',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#0d9488',
    fontWeight: '600',
  },
  tabContent: {
    paddingTop: 8,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  tagText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
});
