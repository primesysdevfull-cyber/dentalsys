import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { patientsApi } from '../api/patients';
import PatientCard from '../components/PatientCard';
import EmptyState from '../components/EmptyState';
import { Patient, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PatientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => patientsApi.list({ page, limit: 20, search }),
  });

  const handlePatientPress = useCallback(
    (patient: Patient) => {
      navigation.navigate('PatientDetail', { patientId: patient.id });
    },
    [navigation]
  );

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (data && page < data.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [data, page]);

  const patients = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Pacientes</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="person-add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar paciente..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PatientCard patient={item} onPress={handlePatientPress} />
        )}
        contentContainerStyle={
          patients.length === 0 ? styles.emptyContent : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#0d9488"
            colors={['#0d9488']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="Nenhum paciente encontrado"
              message={
                search
                  ? 'Tente buscar com outros termos.'
                  : 'Adicione seu primeiro paciente.'
              }
              actionLabel={!search ? 'Adicionar Paciente' : undefined}
              onAction={() => {}}
            />
          ) : null
        }
      />

      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {data?.total ?? 0} paciente{(data?.total ?? 0) !== 1 ? 's' : ''}
        </Text>
      </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContent: {
    flex: 1,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  countText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
