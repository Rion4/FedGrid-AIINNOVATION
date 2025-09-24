import numpy as np
import json
import os
import uuid
import requests # This library is for sending the web request
from azure.storage.blob import BlobServiceClient

# --- CONFIGURATION ---
# The URL of your frontend's API endpoint
API_URL = "ADD_API_URL"

# The connection string for your Storage Account
STORAGE_CONNECTION_STRING = "ADD_CONNECTION_STRING"

CONTAINER_NAME = "model-weights"
NPZ_FILE_PATH = "local_model_weights_mlp_2.npz"

def upload_weights_to_blob(storage_conn_str, container_name, file_path):
    """Uploads the NPZ file to Azure Blob Storage and returns its URL."""
    try:
        blob_service_client = BlobServiceClient.from_connection_string(storage_conn_str)
        
        # Create a container if it doesn't exist
        try:
            container_client = blob_service_client.get_container_client(container_name)
            container_client.create_container()
            print(f"Container '{container_name}' created.")
        except Exception:
            print(f"Container '{container_name}' already exists.")

        # Create a unique name for the blob to avoid overwriting
        blob_name = f"{os.path.basename(file_path).split('.')[0]}-{uuid.uuid4()}.npz"
        
        print(f"Uploading {file_path} to container '{container_name}' as blob '{blob_name}'...")
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
        
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
            
        print("Upload complete.")
        return blob_client.url
    except Exception as e:
        print(f"Error uploading to blob storage: {e}")
        return None

def send_to_frontend_api(payload):
    """Sends a payload directly to the frontend's API endpoint."""
    headers = { "Content-Type": "application/json" }
    
    try:
        print(f"Sending data directly to frontend API at {API_URL}...")
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()
        print(f"API response: {response.status_code} - {response.json()}")
        print("Data sent to frontend successfully!")
    except Exception as e:
        print(f"An error occurred while sending to the frontend API: {e}")

if __name__ == "__main__":
    if not os.path.exists(NPZ_FILE_PATH):
        print(f"ERROR: '{NPZ_FILE_PATH}' not found.")
    else:
        # 1. Upload the large file to Blob Storage
        blob_file_url = upload_weights_to_blob(STORAGE_CONNECTION_STRING, CONTAINER_NAME, NPZ_FILE_PATH)
        
        if blob_file_url:
            # 2. Create the JSON payload with the URL
            payload = {
                "deviceId": "prosumer-demo-001",
                "modelVersion": "3.1.0",
                "blobUrl": blob_file_url
            }
            
            # 3. Send the payload directly to the frontend API
            send_to_frontend_api(payload)
