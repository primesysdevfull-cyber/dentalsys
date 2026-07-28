import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.toothIcon}>🦷</Text>
        </View>
        <ActivityIndicator size="large" color="#0d9488" style={styles.spinner} />
        <Text style={styles.text}>Carregando...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  toothIcon: {
    fontSize: 64,
  },
  spinner: {
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#0d9488',
    fontWeight: '500',
  },
});
