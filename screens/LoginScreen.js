import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../src/api'; // Asegúrate de tener configurada tu instancia de Axios
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para guardar el token

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si hay un token almacenado al cargar la pantalla
  useEffect(() => {
    const checkSession = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Si hay un token, navegar automáticamente a la pantalla de Home
        navigation.replace('Home');
      }
    };

    checkSession();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true); // Mostrar pantalla de carga mientras se procesa
    try {
      const response = await api.post('/auth/login', { email, password });
      setLoading(false);

      if (response.status === 200) {
        // Guardamos el token en AsyncStorage para futuras peticiones
        await AsyncStorage.setItem('token', response.data.token);

        // También guardamos el inventario en AsyncStorage
        const inventory = response.data.inventory;
        await AsyncStorage.setItem('inventory', JSON.stringify(inventory)); // Guardar como string

        Alert.alert('Éxito', 'Inicio de sesión exitoso');
        navigation.navigate('Home'); // Navegar a la pantalla principal
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        const { message } = error.response.data;

        // Mostrar mensajes de error específicos
        if (message === 'Usuario no encontrado') {
          Alert.alert('Error', 'No existe una cuenta asociada a este correo.');
        } else if (message === 'Contraseña incorrecta') {
          Alert.alert('Error', 'La contraseña ingresada es incorrecta.');
        } else {
          Alert.alert('Error', 'Algo salió mal. Inténtalo de nuevo.');
        }
      } else {
        // Error general (conexión, etc.)
        Alert.alert('Error', 'No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico o Nombre de usuario"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading} // Deshabilitar mientras se carga
      >
        {loading ? (
          <ActivityIndicator color="#fff" /> // Indicador de carga
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.secondaryButtonText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 15, paddingHorizontal: 10 },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#F0F0F0' },
  secondaryButtonText: { color: '#007BFF', fontWeight: 'bold' },
});
