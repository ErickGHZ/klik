import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../src/api'; // Importar la configuración de Axios

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado para la pantalla de carga
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mensajes de error
  const [nameError, setNameError] = useState(''); // Estado para el error del nombre
  const [emailError, setEmailError] = useState(''); // Estado para el error del email

  const handleRegister = async () => {
    setIsLoading(true); // Activar la pantalla de carga

    try {
      // Hacer la petición al backend
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      // Si la respuesta es exitosa
      if (response.status === 201) {
        Alert.alert('Registro exitoso', 'Usuario registrado con éxito');
        navigation.navigate('Login'); // Redirigir al login después de registrar
      }
    } catch (error) {
      setIsLoading(false); // Desactivar la pantalla de carga

      if (error.response) {
        // Manejar errores específicos del backend (nombre o correo duplicados)
        if (error.response.data.message.includes('nombre')) {
          setNameError('El nombre ya está registrado');
        } else if (error.response.data.message.includes('correo')) {
          setEmailError('El correo ya está registrado');
        } else {
          setErrorMessage('Ocurrió un error desconocido');
        }
      } else {
        // Si hay un error general (problema con la red)
        setErrorMessage('Sin conexión al servidor');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>

      {/* Nombre */}
      <TextInput
        style={[styles.input, nameError ? styles.inputError : null]}
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
      />
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

      {/* Correo electrónico */}
      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Mensaje de error general */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {/* Botón de registro */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      {/* Pantalla de carga */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 15, paddingHorizontal: 10 },
  inputError: { borderColor: 'red' }, // Estilo para inputs con error
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 5 },
  loadingContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: -30 }] },
});
