import json
import time
import random
import math
import os
from datetime import datetime

# --- Configuration ---
# You can tweak these values to change the simulation
BASE_CONSUMPTION_KW = 2500  # Average sum of kW over 24 hours
DAILY_VARIATION = 500       # How much consumption fluctuates during the day
NOISE_LEVEL = 50            # Random noise to make it look real
MAX_ERROR_PERCENT = 8.0     # Maximum % error for the prediction
SECONDS_BETWEEN_FILES = 5   # Generate a new file every 5 seconds
NUMBER_OF_FILES = 50        # Generate 50 files in total

# Federated Learning Configuration
FEDERATED_NODES = [
    {"id": "node_north", "name": "North Mangalore Node", "weight": 0.25},
    {"id": "node_south", "name": "South Mangalore Node", "weight": 0.20},
    {"id": "node_east", "name": "East Mangalore Node", "weight": 0.18},
    {"id": "node_west", "name": "West Mangalore Node", "weight": 0.22},
    {"id": "node_central", "name": "Central Mangalore Node", "weight": 0.15}
]

# --- Main Simulation ---

def generate_predictions():
    output_dir = "public/frontend_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    print("Starting backend simulation...")
    print(f"Generating {NUMBER_OF_FILES} prediction files every {SECONDS_BETWEEN_FILES} seconds.")
    print("Press Ctrl+C to stop.")

    for i in range(NUMBER_OF_FILES):
        # Simulate time passing to create a daily cycle
        # Each step is like an hour passing for the sine wave
        time_step = i 
        daily_cycle = math.sin(2 * math.pi * time_step / 24) # 24-hour cycle

        # 1. Calculate the "Actual" value
        noise = random.uniform(-NOISE_LEVEL, NOISE_LEVEL)
        actual_value = BASE_CONSUMPTION_KW + (daily_cycle * DAILY_VARIATION) + noise

        # 2. Calculate a realistic "Predicted" value
        error_multiplier = 1 + random.uniform(-MAX_ERROR_PERCENT / 100, MAX_ERROR_PERCENT / 100)
        predicted_value = actual_value * error_multiplier
        
        # Ensure predictions are non-negative
        actual_value = max(0, actual_value)
        predicted_value = max(0, predicted_value)

        # 3. Calculate metrics
        error_percent = abs(predicted_value - actual_value) / (actual_value + 1e-9) * 100
        status = "✅ Success" if error_percent < 5 else "⚠️ Warning"

        # 4. Generate federated learning node contributions
        node_contributions = []
        total_weighted_prediction = 0
        
        for node in FEDERATED_NODES:
            # Each node generates its own local prediction with some variation
            node_variation = random.uniform(-0.1, 0.1)  # ±10% variation per node
            node_prediction = predicted_value * (1 + node_variation)
            node_accuracy = random.uniform(85, 98)  # Node accuracy between 85-98%
            
            node_data = {
                "node_id": node["id"],
                "node_name": node["name"],
                "local_prediction_kw": round(node_prediction, 2),
                "node_weight": node["weight"],
                "accuracy_score": round(node_accuracy, 2),
                "contribution": round(node_prediction * node["weight"], 2)
            }
            node_contributions.append(node_data)
            total_weighted_prediction += node_data["contribution"]

        # 5. Create the JSON payload with federated learning data
        prediction_data = {
            "timestamp_utc": datetime.utcnow().isoformat() + "Z",
            "prediction_id": f"pred_{int(time.time())}_{i}",
            "actual_24h_sum_kw": round(actual_value, 2),
            "predicted_24h_sum_kw": round(predicted_value, 2),
            "federated_prediction_kw": round(total_weighted_prediction, 2),
            "error_percent": round(error_percent, 2),
            "federated_error_percent": round(abs(total_weighted_prediction - actual_value) / (actual_value + 1e-9) * 100, 2),
            "status": status,
            "model_version": f"2.1.{random.randint(0, 5)}",
            "federated_nodes": node_contributions,
            "aggregation_method": "weighted_average",
            "total_nodes": len(FEDERATED_NODES)
        }

        # 5. Save to a JSON file
        file_path = os.path.join(output_dir, f"prediction_{i+1:03d}.json")
        with open(file_path, 'w') as f:
            json.dump(prediction_data, f, indent=2)

        print(f"Generated {file_path} -> Predicted: {predicted_value:.2f} kW")

        # Wait before generating the next file
        time.sleep(SECONDS_BETWEEN_FILES)

    print("\nSimulation finished.")

if __name__ == "__main__":
    generate_predictions()