import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, TextInput } from 'react-native';
import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SlotMachine({ navigation }) {
  const [inventory, setInventory] = useState(null);
  const [betAmount, setBetAmount] = useState(10); // Valor inicial de la apuesta
  const [spinning, setSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0); // Contador de tiradas
  const [slotValues, setSlotValues] = useState([
    { name: 'seven', value: 50, image: require('../assets/fruits/seven.png') },
    { name: 'seven', value: 50, image: require('../assets/fruits/seven.png') },
    { name: 'seven', value: 50, image: require('../assets/fruits/seven.png') },
  ]);
  const [outcomeMessage, setOutcomeMessage] = useState('');

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
    // Definir las frutas con sus probabilidades y valores ajustados a 1
    const fruits = [
      { name: 'grape', value: 2, image: require('../assets/fruits/grape.png'), probability: 0.4 }, // 40% de chance
      { name: 'lemon', value: 4, image: require('../assets/fruits/lemon.png'), probability: 0.3 }, // 30% de chance
      { name: 'watermelon', value: 8, image: require('../assets/fruits/watermelon.png'), probability: 0.2 }, // 20% de chance
      { name: 'cherry', value: 16, image: require('../assets/fruits/cherry.png'), probability: 0.1 }, // 10% de chance
      { name: 'seven', value: 32, image: require('../assets/fruits/seven.png'), probability: 0.05 }, // 5% de chance
    ];
  
  
    // Generar un número aleatorio entre 0 y 1
    const rand = Math.random();
  
    // Calcular la fruta a partir de las probabilidades
    let cumulativeProbability = 0;
    for (let fruit of fruits) {
      cumulativeProbability += fruit.probability;
      if (rand <= cumulativeProbability) {
        return fruit; // Devolver la fruta seleccionada
      }
    }
  };
  
  const handleSpin = () => {
    if (betAmount > inventory.coins) {
      Alert.alert('Error', 'No tienes suficientes monedas.');
      return;
    }
  
    // Descontamos las monedas inmediatamente al pulsar "Girar"
    const updatedInventory = { ...inventory, coins: inventory.coins - betAmount };
  
    // Agregar animación para descontar monedas
    animateCoins(inventory.coins, updatedInventory.coins);
  
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
      setSlotValues([slot1, slot2, slot3]); // Aquí cambiamos de valores a objetos completos
  
      // Comprobamos cuántas frutas se repiten
      const fruits = [slot1.name, slot2.name, slot3.name];
      const uniqueFruits = new Set(fruits);
      let winnings = 0;
  
      // Premios según combinaciones
      if (uniqueFruits.size === 1) {
        // Tres iguales
        winnings = betAmount * (slot1.value / 1); // Premio proporcional al valor de la fruta
      } else if (uniqueFruits.size === 2) {
        // Dos iguales: encontrar la fruta que se repite y usar su valor
        const repeatedFruit = fruits.find(
          (fruit) => fruits.filter((f) => f === fruit).length === 2
        );
        const matchingSlot = [slot1, slot2, slot3].find(
          (slot) => slot.name === repeatedFruit
        );
        winnings = betAmount * (matchingSlot.value / 2); // Premio moderado
      } else {
        // Ninguna repetida
        winnings = 0;
      }
  
      // Determinar el resultado
      const outcome = winnings > 0 ? '¡Ganaste!' : 'Perdiste...';
  
      let updatedExp = inventory.exp; // Comenzamos con el XP actual
      let currentLevel = inventory.level; // Nivel actual
      let nextLevelXP = calculateNextLevelXP(currentLevel); // XP necesario para el siguiente nivel
  
      if (outcome === '¡Ganaste!') {
        const xpGained = Math.floor(betAmount / 10);
        const newExp = inventory.exp + xpGained;
        animateXP(inventory.exp, newExp);

        updatedExp += xpGained;

        const newCoins = updatedInventory.coins + winnings;
        
  
        // Agregar animación para sumar monedas
        animateCoins(updatedInventory.coins, newCoins);
  
        updatedInventory.coins = newCoins; // Ganancia de monedas
      } else {
        const xpGained = Math.floor(betAmount / 10);
        const newExp = inventory.exp + xpGained;
        animateXP(inventory.exp, newExp);

        updatedExp += xpGained;

      }
  
      // Actualizamos el inventario con la nueva XP y monedas
      setInventory(updatedInventory);
      AsyncStorage.setItem('inventory', JSON.stringify(updatedInventory)); // Guardamos en AsyncStorage
  
      // Primero muestra la alerta de ganancia o pérdida
      setOutcomeMessage(
        outcome === '¡Ganaste!'
          ? `Ganaste ${winnings} monedas.`
          : '¡Inténtalo de nuevo!'
      );
      checkLevelUp(updatedInventory, updatedExp, currentLevel, nextLevelXP);
  
      // Incrementamos el contador de tiradas
      const newSpinCount = spinCount + 1;
      setSpinCount(newSpinCount);
  
      // Si llegamos a 10 tiradas, sincronizamos con la base de datos
      if (newSpinCount >= 10) {
        updateInventoryInDB(updatedInventory);
        setSpinCount(0); // Reiniciamos el contador de tiradas
      }
    }, 1000); // Simula el giro durante 2 segundos
  };
  
  
  
  

  const checkLevelUp = (updatedInventory, updatedExp, currentLevel, nextLevelXP) => {
    // Verificamos si el usuario sube de nivel después del resultado
    let levelUpMessage = '';  // Mensaje de subida de nivel
    while (updatedExp >= nextLevelXP) {
      updatedExp -= nextLevelXP; // Transferimos el exceso al siguiente nivel
      currentLevel++;
      nextLevelXP = calculateNextLevelXP(currentLevel);
      levelUpMessage = `¡Has subido al nivel ${currentLevel}!`; // Preparamos el mensaje
    }
  
    // Actualizamos el inventario con el XP y nivel
    const finalInventory = {
      ...updatedInventory,
      exp: updatedExp,
      level: currentLevel,
    };
    setInventory(finalInventory);
    AsyncStorage.setItem('inventory', JSON.stringify(finalInventory)); // Guardamos en AsyncStorage
  
    // Si hubo subida de nivel, mostramos la alerta de subida de nivel
    if (levelUpMessage) {
      Alert.alert('¡Felicidades!', levelUpMessage);
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


  const animateCoins = (start, end, duration = 100) => {
    const difference = end - start;
    const step = difference / 20; // Número de pasos (ajusta según sea necesario)
    let current = start;
    const interval = duration / 20; // Duración total dividida entre pasos
  
    const intervalId = setInterval(() => {
      current += step;
      if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
        current = end; // Asegúrate de no pasar del valor final
        clearInterval(intervalId);
      }
      setInventory((prev) => ({ ...prev, coins: Math.round(current) }));
    }, interval);
  };
  const animateXP = (start, end, duration = 100) => {
    const difference = end - start;
    const step = difference / 20; // Número de pasos
    let current = start;
    const interval = duration / 20; // Duración total dividida entre pasos
  
    const intervalId = setInterval(() => {
      current += step;
      if (current >= end) {
        current = end; // Asegúrate de no pasar del valor final
        clearInterval(intervalId);
      }
      setInventory((prev) => ({
        ...prev,
        exp: Math.round(current),
      }));
    }, interval);
  };
  
  

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
      <Text style={styles.greeting}>¡Bienvenido a Slot Machine!</Text>

      <View style={styles.slotContainer}>
        <Text style={styles.slotTitle}>¡Haz girar el slot!</Text>
        <View style={styles.slot}>
          {slotValues.map((slot, index) => (
            <Image
              key={index}
              source={slot.image}
              style={styles.slotImage} // Añadimos estilo para las imágenes
            />
          ))}
        </View>
      </View>

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

      {outcomeMessage ? (
          <View
            style={[
              styles.outcomeContainer,
              outcomeMessage.includes('Ganaste') ? { backgroundColor: 'green' } : { backgroundColor: 'red' },
            ]}
          >
            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>
              {outcomeMessage}
            </Text>
          </View>
        ) :         <View
        style={[
          styles.outcomeContainer,
        ]}
      >
     
      </View>}


      <TouchableOpacity
        style={styles.button}
        onPress={handleSpin}
        disabled={spinning}
      >
        <Text style={styles.buttonText}>Girar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleGoHome}
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
  slot: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  slotImage: { width: 60, height: 60, marginHorizontal: 5 },
  betContainer: { marginVertical: 20, alignItems: 'center' },
  betText: { fontSize: 18, marginBottom: 10 },
  betControls: { flexDirection: 'row', alignItems: 'center' },
  betButton: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 20 },
  betInput: { width: 60, height: 40, textAlign: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 5 },
  button: { backgroundColor: '#007BFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  outcomeContainer: {
    height: 50, // Altura fija
    alignSelf: 'center', // Centrar horizontalmente
    padding: 10, // Espaciado interno
    borderRadius: 5, // Bordes redondeados
  },  
  outcomeMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    padding: 10,
    borderRadius: 5,
  },
  outcomeWin: {
    color: 'white',
    backgroundColor: 'green',
  },
  outcomeLose: {
    color: 'white',
    backgroundColor: 'red',
  },
  
});
