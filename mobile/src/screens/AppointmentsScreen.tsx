import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentsApi } from '../api/appointments';
import AppointmentCard from '../components/AppointmentCard';
import EmptyState from '../components/EmptyState';
import { Appointment } from '../types';

const THEME = {
  backgroundColor: '#ffffff',
  calendarBackground: '#ffffff',
  textSectionTitleColor: '#64748b',
  selectedDayBackgroundColor: '#0d9488',
  selectedDayTextColor: '#ffffff',
  todayBackgroundColor: '#f0fdfa',
  todayTextColor: '#0d9488',
  dayTextColor: '#0f172a',
  textDisabledColor: '#cbd5e1',
  monthTextColor: '#0f172a',
  arrowColor: '#0d9488',
  textMonthFontWeight: '700' as const,
  textDayFontSize: 15,
  textMonthFontSize: 16,
  textDayHeaderFontSize: 13,
};

export default function AppointmentsScreen() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const { data: appointments, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () =>
      appointmentsApi.list({
        startDate: selectedDate,
        endDate: selectedDate,
        limit: 100,
      }),
  });

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const appointmentsList = appointments?.data ?? [];

  const markedDates = appointmentsList.reduce(
    (acc: Record<string, any>, appointment: Appointment) => {
      const dateKey = appointment.date.split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { marked: true, dotColor: '#0d9488' };
      }
      return acc;
    },
    {} as Record<string, any>
  );

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#0d9488',
    };
  }

  const formattedDate = (() => {
    try {
      return format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", {
        locale: ptBR,
      });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Calendar
        markingType="dot"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={THEME}
        style={styles.calendar}
      />

      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </Text>
        <Text style={styles.appointmentCount}>
          {appointmentsList.length} agendamento
          {appointmentsList.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={appointmentsList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard appointment={item} />
        )}
        contentContainerStyle={
          appointmentsList.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#0d9488"
            colors={['#0d9488']}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="calendar-outline"
              title="Sem agendamentos"
              message="Nenhum agendamento para este dia."
              actionLabel="Novo Agendamento"
              onAction={() => {}}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  appointmentCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContent: {
    flex: 1,
  },
});
