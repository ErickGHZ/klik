import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import api from '../src/api';
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

  const calculateNextLevelXP = (currentLevel) => {
    if (currentLevel === 0) return 10; // Caso base para nivel 0
    const previousXP = calculateNextLevelXP(currentLevel - 1);
    return Math.floor(previousXP * 1.2);
  };

  const handleAddXP = async () => {
    if (!inventory) return;

    const currentLevel = inventory.level;
    const currentXP = inventory.exp;
    const xpNeeded = calculateNextLevelXP(currentLevel);

    let newLevel = currentLevel;
    let remainingXP = currentXP + 5;

    if (remainingXP >= xpNeeded) {
      newLevel += 1;
      remainingXP -= xpNeeded;

      Alert.alert('¡Subiste de nivel!', `Nivel ${newLevel} alcanzado. Ganaste 50 monedas y 1 diamante.`);

      inventory.coins += 50;
      inventory.diamonds += 1;
    }

    const updatedInventory = {
      ...inventory,
      level: newLevel,
      exp: remainingXP,
    };

    setInventory(updatedInventory);
    await AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory));
    updateInventoryInDB(updatedInventory);
  };

  const updateInventoryInDB = async (updatedInventory) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await api.put(`/inventory/${inventory.userId}`, updatedInventory, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error al actualizar el inventario en la DB:', error);
      Alert.alert('Error', 'No se pudo sincronizar con el servidor.');
    }
  };

  if (!inventory) {
    return <Text>Cargando...</Text>;
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('inventory');
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'Hubo un problema al cerrar sesión.');
    }
  };

  const nextLevelXP = calculateNextLevelXP(inventory.level);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.levelText}>Nivel {inventory.level}</Text>
          <Text style={styles.expText}>
            XP {inventory.exp}/{nextLevelXP}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          <View style={styles.item}>
            <Image source={require('../assets/coin-icon.png')} style={styles.icon} />
            <Text style={styles.itemText}>{inventory.coins}</Text>
          </View>
          <View style={styles.item}>
            <Image source={require('../assets/diamond-icon.png')} style={styles.icon} />
            <Text style={styles.itemText}>{inventory.diamonds}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleAddXP}>
        <Text style={styles.buttonText}>Ganar 5 XP</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  leftHeader: { flexDirection: 'column', alignItems: 'flex-start' },
  rightHeader: { flexDirection: 'column', alignItems: 'flex-end' },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { width: 30, height: 30, marginRight: 8 },
  itemText: { fontSize: 16, fontWeight: 'bold' },
  levelText: { fontSize: 20, fontWeight: 'bold' },
  expText: { fontSize: 16, marginVertical: 5 },
  button: { backgroundColor: '#007BFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#FF4C4C' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
