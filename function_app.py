import logging
import json
import os
import azure.functions as func
from azure.storage.blob import BlobClient
from azure.confidentialledger.client import ConfidentialLedgerClient
from azure.confidentialledger.certificate import ConfidentialLedgerCertificateClient
from azure.identity import ManagedIdentityCredential

# This line initializes your Function App
app = func.FunctionApp()

# --- CONFIGURATION ---
# These are read from your Function App's "Configuration" settings
LEDGER_ENDPOINT = os.environ.get("LEDGER_ENDPOINT")
IDENTITY_CLIENT_ID = os.environ.get("IDENTITY_CLIENT_ID")

@app.iot_hub_trigger(
    arg_name="event",
    event_hub_name="messages/events", # This is the default for IoT Hub
    connection="IoTHubConnectionString",
    cardinality=func.Cardinality.ONE,
    consumer_group="$Default")
def ReceiveAndStoreWeights(event: func.EventHubEvent):
    """
    This function is triggered by a notification from IoT Hub.
    It reads a blob URL from the message, downloads the weights file,
    and records the notification to the Azure Confidential Ledger.
    """
    logging.info("Python IoT Hub trigger function processed a notification message.")
    
    try:
        # 1. Parse the incoming notification message to get the blob URL
        notification_body = event.get_body().decode('utf-8')
        notification_json = json.loads(notification_body)
        blob_url = notification_json.get("blob_url")
        
        if not blob_url:
            logging.error("FATAL: No 'blob_url' found in the notification message.")
            return

        logging.info(f"Received notification for blob at: {blob_url}")

        # 2. Download the content of the weights file from Blob Storage
        # This requires the function's identity to have the 'Storage Blob Data Reader' role.
        credential = ManagedIdentityCredential(client_id=IDENTITY_CLIENT_ID)
        blob_client = BlobClient.from_blob_url(blob_url, credential=credential)
        
        logging.info("Downloading weights file from Blob Storage...")
        weights_data = blob_client.download_blob().readall()
        # For now, we just confirm the download. In the future, you could parse this data.
        logging.info(f"Successfully downloaded {len(weights_data)} bytes from blob.")
        
        # 3. Authenticate with the Confidential Ledger
        if not LEDGER_ENDPOINT or not IDENTITY_CLIENT_ID:
            logging.error("FATAL: LEDGER_ENDPOINT or IDENTITY_CLIENT_ID is not set in App Settings.")
            return
            
        cert_client = ConfidentialLedgerCertificateClient(credential)
        ledger_cert = cert_client.get_ledger_identity(ledger_id=LEDGER_ENDPOINT.split('.')[0])
        ledger_client = ConfidentialLedgerClient(endpoint=LEDGER_ENDPOINT, credential=credential, ledger_certificate=ledger_cert)
        
        # 4. Write the original notification message to the ledger as proof
        logging.info("Appending notification to Confidential Ledger...")
        append_result = ledger_client.append_entry(entry=notification_body)
        
        transaction_id = append_result['transaction_id']
        logging.info(f"Successfully appended entry to ledger with transaction ID: {transaction_id}")

    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
