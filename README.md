# FedGrid AI Innovation

A privacy-preserving federated learning platform that enables secure collaboration between energy prosumers while maintaining data privacy and providing auditable records through blockchain-inspired ledger technology.

## Overview

FedGrid AI Innovation is a comprehensive solution that combines federated learning with energy grid optimization. The platform allows prosumers (producers + consumers) to collaboratively train machine learning models without sharing sensitive data, while maintaining complete transparency and auditability of all transactions.

## Technologies Used

### Frontend

- **React** - Modern UI framework for building interactive dashboards
- **HTML/CSS** - Core web technologies for structure and styling
- **JavaScript** - Dynamic functionality and API interactions

### Backend

- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework for API development

### Machine Learning

- **Python** - Primary language for ML operations
- **TensorFlow** - Deep learning framework for model training
- **scikit-learn** - Machine learning library for data analysis

### Cloud Platform

- **Azure Static Web Apps** - Frontend hosting and deployment
- **Azure App Service** - Backend API hosting
- **Azure SQL Database with Ledger Tables** - Auditable record storage


```

### Running the Client Demo 💻

To demonstrate the privacy-preserving pipeline, we will run the client script from our Azure ML Compute Instance. This script simulates a prosumer training a model and sending its weights to the API.

#### Demo Steps:

1. **Execute the client script:**

   ```bash
   python send_weights_final.py
   ```

2. **Verify successful transmission:**

   - The script will output a `200 OK` response
   - This confirms that the weights were successfully received by the live API

3. **View real-time updates:**
   - Refresh the dashboard
   - Observe the data being updated live
   - This demonstrates a complete end-to-end working system

## Features

- **Privacy-Preserving**: Federated learning ensures data never leaves local devices
- **Auditable**: Blockchain-inspired ledger tables provide complete transaction history
- **Real-time Dashboard**: Live updates showing system status and model performance
- **Scalable Architecture**: Cloud-native design supports multiple prosumers
- **Secure API**: RESTful endpoints with proper authentication and validation

## Architecture

The system follows a federated learning architecture where:

1. **Prosumers** train models locally on their data
2. **Model weights** are securely transmitted to the central server
3. **Aggregation** happens on the server without accessing raw data
4. **Updated models** are distributed back to participants
5. **All transactions** are recorded in auditable ledger tables

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Azure CLI (for deployment)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd FedGrid-AIINNOVATION
   ```

2. **Install frontend dependencies:**

   ```bash
   npm install
   ```

3. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Start the backend server:**
   ```bash
   node server.js
   ```

## Deployment

The application is deployed using Azure services:

- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service
- **Database**: Azure SQL Database with Ledger Tables
- **ML Compute**: Azure Machine Learning Compute Instance

## Contributing

This project was developed for the AI Innovation Hackathon. For questions or contributions, please reach out to the development team.

## License

See the [LICENSE](LICENSE) file for details.
