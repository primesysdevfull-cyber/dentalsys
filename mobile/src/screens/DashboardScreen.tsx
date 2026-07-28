import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../api/appointments';
import { patientsApi } from '../api/patients';
import AppointmentCard from '../components/AppointmentCard';
import { formatCurrency } from '../utils/format';

export default function DashboardScreen() {
  const { user } = useAuth();

  const {
    data: todayAppointments,
    isLoading: loadingAppointments,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: appointmentsApi.getToday,
  });

  const {
    data: patientsData,
    isLoading: loadingPatients,
    refetch: refetchPatients,
  } = useQuery({
    queryKey: ['patients', 'summary'],
    queryFn: () => patientsApi.list({ page: 1, limit: 1 }),
  });

  const isLoading = loadingAppointments || loadingPatients;

  const handleRefresh = async () => {
    await Promise.all([refetchAppointments(), refetchPatients()]);
  };

  const todayCount = todayAppointments?.length ?? 0;
  const confirmedCount =
    todayAppointments?.filter((a) => a.status === 'confirmed').length ?? 0;
  const totalPatients = patientsData?.total ?? 0;
  const pendingCount =
    todayAppointments?.filter((a) => a.status === 'scheduled').length ?? 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Profissional'}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
            <View style={styles.notifDot} />
          </View>
        </View>

        <View style={styles.cardsGrid}>
          <TouchableOpacity style={[styles.card, styles.cardPrimary]} activeOpacity={0.8}>
            <View style={[styles.cardIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="people" size={24} color="#ffffff" />
            </View>
            <Text style={styles.cardValue}>{totalPatients}</Text>
            <Text style={styles.cardLabel}>Total Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardSecondary]} activeOpacity={0.8}>
            <View style={[styles.cardIconContainer, { backgroundColor: 'rgba(13,148,136,0.15)' }]}>
              <Ionicons name="calendar" size={24} color="#0d9488" />
            </View>
            <Text style={[styles.cardValue, { color: '#0d9488' }]}>{todayCount}</Text>
            <Text style={[styles.cardLabel, { color: '#0d9488' }]}>Agendamentos Hoje</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardSecondary]} activeOpacity={0.8}>
            <View style={[styles.cardIconContainer, { backgroundColor: 'rgba(13,148,136,0.15)' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#0d9488" />
            </View>
            <Text style={[styles.cardValue, { color: '#0d9488' }]}>{confirmedCount}</Text>
            <Text style={[styles.cardLabel, { color: '#0d9488' }]}>Confirmados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.cardAccent]} activeOpacity={0.8}>
            <View style={[styles.cardIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="time" size={24} color="#ffffff" />
            </View>
            <Text style={styles.cardValue}>{pendingCount}</Text>
            <Text style={styles.cardLabel}>Pendentes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {todayAppointments && todayAppointments.length > 0 ? (
            todayAppointments.slice(0, 5).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Nenhum agendamento para hoje
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atalhos</Text>
          </View>
          <View style={styles.shortcutsGrid}>
            <TouchableOpacity style={styles.shortcutButton}>
              <View style={[styles.shortcutIcon, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="person-add" size={22} color="#0d9488" />
              </View>
              <Text style={styles.shortcutLabel}>Novo{'\n'}Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutButton}>
              <View style={[styles.shortcutIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="add-circle" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.shortcutLabel}>Novo{'\n'}Agendamento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutButton}>
              <View style={[styles.shortcutIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="search" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.shortcutLabel}>Buscar{'\n'}Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutButton}>
              <View style={[styles.shortcutIcon, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="stats-chart" size={22} color="#8b5cf6" />
              </View>
              <Text style={styles.shortcutLabel}>Relatórios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 15,
    color: '#64748b',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  headerIcon: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  card: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    minHeight: 130,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPrimary: {
    backgroundColor: '#0d9488',
  },
  cardSecondary: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  cardAccent: {
    backgroundColor: '#0f766e',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
  },
  cardLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionAction: {
    fontSize: 14,
    color: '#0d9488',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
});
