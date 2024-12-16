import random

# Configuración inicial
initial_coins = 1000
bet_amount = 1
spins = 1000

# Probabilidades y valores de las frutas
fruits = [
    {"name": "grape", "value": 1, "probability": 0.30},  # 40%
    {"name": "lemon", "value": 2, "probability": 0.25},    # 30%
    {"name": "watermelon", "value": 3, "probability": 0.20}, # 20%
    {"name": "cherry", "value": 4, "probability": 0.15},   # 10%
    {"name": "seven", "value": 5, "probability": 0.1}   # 5%
]
fruits = [
    {"name": "grape", "value": 1, "probability": 0.31},  # 40%
    {"name": "lemon", "value": 2, "probability": 0.26},    # 30%
    {"name": "watermelon", "value": 3, "probability": 0.21}, # 20%
    {"name": "cherry", "value": 4, "probability": 0.16},   # 10%
    {"name": "seven", "value": 5, "probability": 0.06}   # 5%
]

# Generar fruta aleatoria según probabilidades
def get_random_fruit():
    rand = random.random()
    cumulative_probability = 0
    for fruit in fruits:
        cumulative_probability += fruit["probability"]
        if rand <= cumulative_probability:
            return fruit

# Simulación de tiradas
coins = initial_coins
wins = {"three_equal": [], "two_equal": []}  # Listas para guardar las combinaciones ganadoras

for _ in range(spins):
    if coins < bet_amount:
        break  # Termina si no hay suficientes monedas para apostar
    
    # Restar apuesta inicial
    coins -= bet_amount
    
    # Generar frutas en los tres slots
    slot1 = get_random_fruit()
    slot2 = get_random_fruit()
    slot3 = get_random_fruit()
    
    # Verificar combinaciones y calcular ganancias
    fruit_names = [slot1["name"], slot2["name"], slot3["name"]]
    unique_fruits = set(fruit_names)
    winnings = 0
    
    if len(unique_fruits) == 1:  # Tres iguales
        winnings = bet_amount * slot1["value"]
        wins["three_equal"].append(fruit_names[0])  # Guardar la fruta que ganó
    elif len(unique_fruits) == 2:  # Dos iguales
        repeated_fruit_name = max(fruit_names, key=fruit_names.count)
        matching_slot = next(slot for slot in [slot1, slot2, slot3] if slot["name"] == repeated_fruit_name)
        winnings = bet_amount * (matching_slot["value"] / 2)
        wins["two_equal"].append(repeated_fruit_name)  # Guardar la fruta que se repitió
    
    # Sumar ganancias
    coins += winnings

# Mostrar resultados finales
print(f"Jugador tiene {coins} monedas al final de las {spins} tiradas.")
print("\nCombinaciones ganadoras:")

# Analizar combinaciones de tres iguales
print("\n- Ganó con tres iguales:")
if wins["three_equal"]:
    for fruit in set(wins["three_equal"]):
        count = wins["three_equal"].count(fruit)
        print(f"  {fruit}: {count} veces")
else:
    print("  No hubo combinaciones de tres iguales.")

# Analizar combinaciones de dos iguales
print("\n- Ganó con dos iguales:")
if wins["two_equal"]:
    for fruit in set(wins["two_equal"]):
        count = wins["two_equal"].count(fruit)
        print(f"  {fruit}: {count} veces")
else:
    print("  No hubo combinaciones de dos iguales.")
