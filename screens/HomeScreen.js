import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [inventory, setInventory] = useState(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventoryData = await AsyncStorage.getItem('inventory');
        if (inventoryData) {
          setInventory(JSON.parse(inventoryData));
        }
      } catch (error) {
        console.error('Error al obtener el inventario:', error);
      }
    };

    loadInventory();
  }, []);

  const handleLogout = async () => {
    // Limpiar AsyncStorage y redirigir a la pantalla de login
    await AsyncStorage.clear();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página Principal</Text>

      {inventory ? (
        <View>
          <Text>Coins: {inventory.coins}</Text>
          <Text>Diamonds: {inventory.diamonds}</Text>
          <Text>Level: {inventory.level}</Text>
          <Text>Exp: {inventory.exp}</Text>
        </View>
      ) : (
        <Text>Cargando inventario...</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#FF0000', padding: 15, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
