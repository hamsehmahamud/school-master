const fs = require('fs');
const path = require('path');

const serviceAccount = {
  "type": "service_account",
  "project_id": "your_project_id",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "your_client_email",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "your_cert_url",
  "universe_domain": "googleapis.com"
};

const envContent = `FIREBASE_SERVICE_ACCOUNT_KEY='${JSON.stringify(serviceAccount)}'`;

// Note: This file is a template. Do not commit real credentials.
// fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
console.log('Please configure your .env.local manually or set up environment variables securely.');
