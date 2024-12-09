import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, TextInput } from 'react-native';
import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SlotMachine({ navigation }) {
  const [inventory, setInventory] = useState(null);
  const [betAmount, setBetAmount] = useState(10); // Valor inicial de la apuesta
  const [spinning, setSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0); // Contador de tiradas
  const [fruits, setFruits] = useState([]);
  const [slotValues, setSlotValues] = useState([]); // Para almacenar los valores generados

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

  const getRandomFruit = () => {
    const fruitList = ['🍒', '🍊', '🍋', '🍉', '🍓'];
    const valueList = [10, 20, 30, 40, 50]; // Valores que pueden corresponder a cada fruta
    const randomIndex = Math.floor(Math.random() * fruitList.length);
    return { fruit: fruitList[randomIndex], value: valueList[randomIndex] };
  };

  const handleSpin = () => {
    if (betAmount > inventory.coins) {
      Alert.alert('Error', 'No tienes suficientes monedas.');
      return;
    }
  
    // Descontamos las monedas inmediatamente al pulsar "Girar"
    const updatedInventory = { ...inventory, coins: inventory.coins - betAmount };
    setInventory(updatedInventory);
    AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory)); // Guardamos en AsyncStorage
  
    setSpinning(true);
  
    // Simulación de giro
    setTimeout(() => {
      setSpinning(false);
  
      // Generación aleatoria de frutas y valores
      const slot1 = getRandomFruit();
      const slot2 = getRandomFruit();
      const slot3 = getRandomFruit();
      setSlotValues([slot1.value, slot2.value, slot3.value]);
  
      // Determinar si ganó
      const totalValue = slot1.value + slot2.value + slot3.value;
      const outcome = totalValue >= betAmount ? '¡Ganaste!' : 'Perdiste...';
  
      let winnings = 0;
      let updatedExp = inventory.exp; // Comenzamos con el XP actual
      let currentLevel = inventory.level; // Nivel actual
      let nextLevelXP = calculateNextLevelXP(currentLevel); // XP necesario para el siguiente nivel
  
      if (outcome === '¡Ganaste!') {
        winnings = totalValue; // Ganancia basada en el valor de las frutas
        updatedExp += Math.floor(betAmount / 10); // XP basado en la apuesta
        const finalInventory = { ...updatedInventory, coins: updatedInventory.coins + winnings };
        setInventory(finalInventory);
        AsyncStorage.setItem('inventory', JSON.stringify(finalInventory)); // Guardamos en AsyncStorage
        Alert.alert(outcome, `¡Felicidades! Ganaste ${winnings} monedas.`, [
          {
            text: 'OK',
            onPress: () => handleLevelUp(updatedExp, currentLevel, updatedInventory),
          },
        ]);
      } else {
        updatedExp += Math.floor(betAmount / 10); // XP basado en la apuesta
        Alert.alert(outcome, `Perdiste ${betAmount} monedas.`, [
          {
            text: 'OK',
            onPress: () => handleLevelUp(updatedExp, currentLevel, updatedInventory),
          },
        ]);
      }
    }, 2000); // Simula el giro durante 2 segundos
  };
  
  // Función separada para manejar el nivel
  const handleLevelUp = (updatedExp, currentLevel, updatedInventory) => {
    let nextLevelXP = calculateNextLevelXP(currentLevel);
    while (updatedExp >= nextLevelXP) {
      updatedExp -= nextLevelXP; // Transferimos el exceso al siguiente nivel
      currentLevel++;
      nextLevelXP = calculateNextLevelXP(currentLevel);
      Alert.alert('¡Felicidades!', `¡Has subido al nivel ${currentLevel}!`);
    }
  
    // Actualizamos el inventario con el XP y nivel
    const finalInventory = {
      ...updatedInventory,
      exp: updatedExp,
      level: currentLevel,
    };
    setInventory(finalInventory);
    AsyncStorage.setItem('inventory', JSON.stringify(finalInventory)); // Guardamos en AsyncStorage
  
    // Incrementamos el contador de tiradas
    const newSpinCount = spinCount + 1;
    setSpinCount(newSpinCount);
  
    // Sincronizamos con la base de datos si llegamos a 10 tiradas
    if (newSpinCount >= 10) {
      updateInventoryInDB(finalInventory);
      setSpinCount(0); // Reiniciamos el contador de tiradas
    }
  };
  
  
  

  const handleBetChange = (value) => {
    if (value < 10) return; // No permite que el valor de la apuesta sea menor que 10
    setBetAmount(value);
  };

  const handleGoHome = async () => {
    // Aquí sincronizamos antes de regresar al home
    if (spinCount > 0) {
      updateInventoryInDB(inventory);
    }
    navigation.replace('Home');
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
      <Text style={styles.greeting}>¡Bienvenido a Slot Machine!</Text>

      {/* Cuadro del slot */}
      <View style={styles.slotContainer}>
        <Text style={styles.slotTitle}>¡Haz girar el slot!</Text>
        <View style={styles.slot}>
          <Text style={styles.slotText}>
            {spinning ? 'Girando...' : `${fruits[0]} ${fruits[1]} ${fruits[2]}`}
          </Text>
          <Text style={styles.slotValueText}>
            {spinning ? '' : `Valor: ${slotValues.join(' - ')}`}
          </Text>
        </View>
      </View>

      {/* Campo de cantidad de apuesta */}
      <View style={styles.betContainer}>
        <Text style={styles.betText}>Cantidad para apostar:</Text>
        <View style={styles.betControls}>
          <TouchableOpacity onPress={() => handleBetChange(betAmount - 10)}>
            <Text style={styles.betButton}>-</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.betInput}
            value={String(betAmount)}
            onChangeText={(value) => handleBetChange(Number(value))}
            keyboardType="numeric"
          />
          <TouchableOpacity onPress={() => handleBetChange(betAmount + 10)}>
            <Text style={styles.betButton}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón para girar */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSpin}
        disabled={spinning} // Deshabilita el botón durante el giro
      >
        <Text style={styles.buttonText}>Girar</Text>
      </TouchableOpacity>

      {/* Botón para volver al Home */}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleGoHome} // Aquí usas el nombre de la pantalla Home
      >
        <Text style={styles.buttonText}>Volver al Home</Text>
      </TouchableOpacity>
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
  slotContainer: { marginVertical: 20, alignItems: 'center' },
  slotTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  slot: { backgroundColor: '#f4f4f4', padding: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  slotText: { fontSize: 36 },
  slotValueText: { fontSize: 18, marginTop: 10, fontWeight: 'bold' },
  betContainer: { marginVertical: 20, alignItems: 'center' },
  betText: { fontSize: 18, marginBottom: 10 },
  betControls: { flexDirection: 'row', alignItems: 'center' },
  betButton: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 20 },
  betInput: { width: 60, height: 40, textAlign: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 5 },
  button: { backgroundColor: '#007BFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
