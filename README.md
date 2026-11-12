# Karnataka Stays

Karnataka Stays is a hotel discovery and trip-planning website focused on Karnataka, India. Visitors can explore destinations and stays, save properties, ask the travel assistant for itinerary ideas, and send booking or enquiry requests. Administrators manage listings, bookings, WhatsApp support, and AI provider settings from the dashboard.

## Project overview

- **Frontend:** React, Vite, Tailwind CSS, and React Router.
- **Backend:** Node.js, Express, and Mongoose.
- **Database:** MongoDB stores accounts, hotels, destinations, enquiries, bookings, and site settings.
- **Payments:** Optional Razorpay checkout, enabled when server credentials are configured.
- **AI assistant:** Gemini, Mistral, or OpenRouter can be configured from **Admin → Settings**. One provider key is enough. Keys are encrypted in MongoDB using `JWT_SECRET`.

### Main folders

```text
frontend/
  src/                 React app, pages, components, and destination data
  scripts/             Image and contact research utilities
  package.json         Frontend scripts and dependencies
backend/
  src/
    config/            Database connection
    middleware/        Authentication and authorization
    models/             MongoDB models
    routes/             API endpoints
    utils/              AI settings and travel assistant helpers
  test/                 Backend tests
  .env.example          Local backend configuration template
  package.json          Backend scripts and dependencies
```

The frontend and backend are separate npm projects; run npm commands from their respective folders.

## Hotel photo sourcing

Finding original photographs for every hotel was difficult. Most of the photos collected were found on official hotel or property websites, but some properties do not have a confirmed original photo source and some images may come from non-official listings. Photo ownership and reuse permission have **not** been confirmed for every image.

The images are remote URLs and may change or stop working. Before using the site publicly or commercially, check that each image depicts the correct property, verify its source, and obtain written permission or a suitable licence. Replace images when the source or usage rights cannot be confirmed. The research dataset intentionally does not use AI-generated hotel photos.

## Requirements

- Node.js 20.19 or newer, or 22.12 or newer, and npm.
- MongoDB running locally or a MongoDB Atlas database.
- A modern browser.
- Optional: Razorpay credentials for online payments.
- Optional: an API key from Gemini, Mistral, or OpenRouter for AI responses.

## Run locally

### 1. Configure the backend

Open PowerShell in the project folder:

```powershell
Set-Location .\backend
npm install
Copy-Item .env.example .env
```

Edit `backend\.env`. At minimum, set a MongoDB connection string, a secure `JWT_SECRET`, and admin login details:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/karnataka_stays
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
ADMIN_NAME=Karnataka Stays Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-password-of-at-least-10-characters
```

You can generate a random secret in PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Keep `.env` private and never commit real passwords, API keys, or payment secrets. Keep `JWT_SECRET` stable after saving AI keys in the Admin dashboard; changing it makes previously stored AI keys unreadable.

### 2. Start MongoDB and seed the database

Start your local MongoDB service, or use an Atlas connection string in `MONGODB_URI`. Then, in a terminal opened in `backend`:

```powershell
npm run seed
```

The seed command imports the included hotel and destination data and creates or resets the admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. It upserts the imported hotel and destination records, so running it again can overwrite edits to those seeded records. Use it for initial setup or when you intentionally want to refresh the bundled data.

### 3. Start the API

In the same `backend` folder:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. Check that it is responding at `http://localhost:5000/api/health`.

### 4. Start the frontend

Open a second terminal in the project folder:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Vite proxies `/api` requests to the local backend on port `5000`.

Sign in to the admin area at `http://localhost:5173/admin/login` using the email and password set in `backend\.env`.

## Admin settings

Open **Admin → Settings** to:

- Add a Gemini, Mistral, or OpenRouter API key. Any one key enables the assistant; the configured provider is selected automatically.
- Set the preferred provider when more than one key is saved.
- Configure the WhatsApp support number shown on the public site.

AI keys are encrypted before they are stored in MongoDB and are never sent back to the browser. Provider calls and web search may incur charges. Gemini and OpenRouter support web-grounded destination information; Mistral responses do not include live web search.

## Optional Razorpay setup

To enable online payments, add the following to `backend\.env`:

```dotenv
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

Use Razorpay test credentials during development. Configure the webhook URL as `https://YOUR_DOMAIN/api/webhooks/razorpay` in the Razorpay dashboard and subscribe to the payment events required by your deployment. Never put private payment credentials in frontend files.

Without Razorpay credentials, visitors can still send booking requests and administrators can manage enquiries and quotes, but online payment is unavailable.

## How bookings work

1. Visitors can browse without an account.
2. An account is required to send an enquiry or request a booking.
3. A booking begins as a request. An administrator checks the dates and price with the property, then sends a quote.
4. The visitor can pay the approved quote through Razorpay when payment is configured.
5. The team confirms the reservation with the hotel and updates its status.

The catalogue does not provide dependable live room availability or pricing. A booking request is not a confirmed reservation; availability and final terms must be verified with the property.

## Tests and production build

Run backend tests from `backend`:

```powershell
npm test
```

Build the frontend from `frontend`:

```powershell
npm run build
```

For production, set secure production environment values, use HTTPS and a managed MongoDB deployment, and configure the web server to route `/api` requests to the Express API. Review hotel information, photo permissions, privacy notices, payment settings, and business policies before launch.
