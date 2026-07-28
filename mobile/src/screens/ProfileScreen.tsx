import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              // Logout handled by context
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline' as const,
      label: 'Editar Perfil',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      icon: 'lock-closed-outline' as const,
      label: 'Alterar Senha',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Notificações',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      icon: 'moon-outline' as const,
      label: 'Aparência',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Ajuda e Suporte',
      color: '#0d9488',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline' as const,
      label: 'Sobre o App',
      color: '#0d9488',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : '??'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'admin'
                  ? 'Administrador'
                  : user.role === 'dentist'
                    ? 'Dentista'
                    : 'Recepcionista'}
              </Text>
            </View>
          )}
          {user?.specialty && (
            <Text style={styles.specialty}>{user.specialty}</Text>
          )}
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DentalSys v1.0.0</Text>
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
    paddingBottom: 32,
  },
  header: {
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  roleText: {
    fontSize: 13,
    color: '#0d9488',
    fontWeight: '600',
  },
  specialty: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  menuContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  version: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 20,
  },
});
