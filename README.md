# Bitespeed Identity Reconciliation

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Seeding the Database](#seeding-the-database)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)



## Introduction

The Bitespeed Identity Reconciliation project aims to manage customer identities in an e-commerce application. It identifies and links customer contacts based on provided email and phone numbers, ensuring a unified view of customer interactions across multiple orders.

## Features

- Identify and link contacts based on provided email and phone numbers.
- Automatically create new primary contacts if no matching contacts are found.
- Link secondary contacts to primary contacts when matches are found.

## Prerequisites

- Node.js (>= 14.x)
- PostgreSQL
- npm (>= 6.x)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/shubhsardana29/bitespeed-identity-reconciliation.git
    cd bitespeed-identity-reconciliation
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```
## Database Setup

1. Configure the database connection:
  - Create .env file with your database connection details
  - Add the following variables:
    ```
    DATABASE_URL="postgresql://yourusername:yourpassword@localhost:5432/yourdatabase"
    ```
2. Create the database schema:
  - Run Prisma migrations to create the database schema:
     ```
      npx prisma migrate dev --name init
     ```
## Seeding the Database

To populate the database with initial data for testing, run the seed script:
 ```
      npm run seed
 ```

## Running the Application

1. Start the development server:
    ```bash
    npm start
    ```
    
2. The server will start on http://localhost:3000

## API Endpoints

 Identify Contact
  - Endpoint: POST /api/identify
  - Description: Identifies and links contacts based on provided email and phone number.
  - Hosted API URL: https://bitespeed-identity-reconciliation-c8h5.onrender.com/api/identify
  - Request Body:
    ```
    {
    "email": "customer@example.com",
    "phoneNumber": "1234567890"
    }
    ```
  - Response:
    ```
    {
    "contact": {
      "primaryContactId": 1,
      "emails": ["customer@example.com", "another@example.com"],
      "phoneNumbers": ["1234567890", "0987654321"],
      "secondaryContactIds": [2, 3]
      }
    }
    ```
    
