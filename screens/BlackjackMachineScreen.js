import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Blackjack({ navigation }) {
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

  const nextLevelXP = calculateNextLevelXP(inventory.level);



  return (
    <View style={styles.container}>
      {/* Información de nivel y XP */}
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
      {/* Saludo con nombre del usuario */}
      <Text style={styles.greeting}>Blackjack!</Text>

  
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  leftHeader: { flexDirection: 'column', alignItems: 'flex-start' },
  rightHeader: { flexDirection: 'column', alignItems: 'flex-end' },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { width: 30, height: 30, marginRight: 8 },
  itemText: { fontSize: 16, fontWeight: 'bold' },
  levelText: { fontSize: 20, fontWeight: 'bold' },
  expText: { fontSize: 16, marginVertical: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 20 },
  gamesContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  gameCard: { width: '48%', backgroundColor: '#f4f4f4', borderRadius: 10, padding: 10, alignItems: 'center' },
  gameImage: { width: 100, height: 100, marginBottom: 10 },
  gameTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  button: { backgroundColor: '#007BFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});