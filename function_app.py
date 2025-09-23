import logging
import json
import os
import azure.functions as func
from azure.confidentialledger.certificate import ConfidentialLedgerCertificateClient
from azure.confidentialledger.client import ConfidentialLedgerClient
from azure.identity import ManagedIdentityCredential

# This line initializes your Function App
app = func.FunctionApp()

# --- CONFIGURATION ---
# These are read from your Function App's "Configuration" settings
LEDGER_ENDPOINT = os.environ.get("LEDGER_ENDPOINT")
IDENTITY_CLIENT_ID = os.environ.get("IDENTITY_CLIENT_ID")

# This decorator replaces the need for function.json
@app.iot_hub_trigger(
    arg_name="event",
    event_hub_name="messages/events",
    connection="IoTHubConnectionString",
    cardinality=func.Cardinality.ONE,
    consumer_group="$Default")
def ReceiveAndStoreWeights(event: func.EventHubEvent):
    """
    Triggered by a message to IoT Hub. Authenticates using a Managed Identity
    and writes the message body to the Azure Confidential Ledger.
    """
    logging.info("Python IoT Hub trigger function processed a message.")
    
    try:
        if not LEDGER_ENDPOINT or not IDENTITY_CLIENT_ID:
            logging.error("FATAL: LEDGER_ENDPOINT or IDENTITY_CLIENT_ID is not set in App Settings.")
            return

        message_body = event.get_body().decode('utf-8')
        logging.info(f"Received message: {message_body[:200]}...")

        # 1. Authenticate with the Ledger using the Function App's own identity
        credential = ManagedIdentityCredential(client_id=IDENTITY_CLIENT_ID)
        
        # 2. Get the ledger's TLS certificate
        cert_client = ConfidentialLedgerCertificateClient(credential)
        ledger_cert = cert_client.get_ledger_identity(ledger_id=LEDGER_ENDPOINT.split('.')[0])
        
        # 3. Create the main client to interact with the ledger
        ledger_client = ConfidentialLedgerClient(endpoint=LEDGER_ENDPOINT, credential=credential, ledger_certificate=ledger_cert)
        
        # 4. Write the message body as a new entry to the ledger
        logging.info("Appending entry to Confidential Ledger...")
        append_result = ledger_client.append_entry(entry=message_body)
        
        transaction_id = append_result['transaction_id']
        logging.info(f"Successfully appended entry with transaction ID: {transaction_id}")

    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
