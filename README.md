# Karnataka Stays

A MERN application for browsing photo-backed hotels in Karnataka, sending enquiries, and requesting bookings that the Karnataka Stays team coordinates. React/Vite is the client; Express, Node.js, and MongoDB/Mongoose provide the API, accounts, and persistent admin data.

## Project structure

```text
frontend/
  src/                 React pages, components, data, and API client
  scripts/             Photo and contact-data import tools
  package.json         Vite and browser dependencies
backend/
  src/
    config/            MongoDB connection
    middleware/        Authentication and role checks
    models/            Mongoose models
    routes/            REST API routes
  test/                Backend unit tests
  .env.example         Backend environment-variable template
  package.json         Express, MongoDB, and Razorpay dependencies
package.json           npm workspace commands for both apps
```

The root `package.json` uses npm workspaces: install once at the project root, then use the root scripts below. Frontend and backend can also be installed/run separately from their own directories if needed.

## Booking and payment flow

1. Anyone can browse hotels, photos, and destinations without signing in.
2. A guest creates an account or signs in only when sending an enquiry or requesting a booking.
3. A booking starts as **Requested**. The admin checks availability and the final price with the property, then sends a quote from **Admin → Bookings**.
4. The guest signs in and pays the approved quote using Razorpay Checkout.
5. After payment, the team confirms the reservation with the hotel and marks it **Confirmed** in Admin.

The supplied hotel data does not contain dependable live inventory or prices. A booking request is not an availability guarantee. Payment is not taken until an admin has checked the stay and issued a quote. Paid reservations must be confirmed with the hotel; refunds are handled by the booking team and are not automated in this version.

## Requirements

- Node.js 20 or newer and npm
- MongoDB 7 or newer, running locally or hosted (for example, MongoDB Atlas)
- A Razorpay account for online payments (test keys for development; live keys for production)

## Install and configure

From the project directory:

```powershell
npm install
Copy-Item backend\.env.example backend\.env
```

Edit `backend\.env` and set:

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `development` locally and `production` on the deployed API. |
| `PORT` | No | API port; defaults to `5000`. |
| `CLIENT_ORIGIN` | Yes | Exact frontend origin, such as `http://localhost:5173`. Multiple origins may be comma-separated. |
| `MONGODB_URI` | Yes | MongoDB connection string. Local default: `mongodb://127.0.0.1:27017/karnataka_stays`. |
| `JWT_SECRET` | Yes | Private random secret of at least 32 characters. Keep it secret and use a different value in production. |
| `ADMIN_NAME` | Yes for seeding | Display name of the initial administrator. |
| `ADMIN_EMAIL` | Yes for seeding | Email address used to sign into `/admin/login`. |
| `ADMIN_PASSWORD` | Yes for seeding | Initial admin password; must be at least 10 characters. Use a unique password. |
| `RAZORPAY_KEY_ID` | For online payments | Razorpay test or live public key ID. The API returns this to the checkout page. |
| `RAZORPAY_KEY_SECRET` | For online payments | Private Razorpay API secret. Never put this in frontend code or expose it to guests. |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended for payments | Secret configured for the Razorpay webhook endpoint. |

Generate a secret locally in PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Start MongoDB before starting the API. For MongoDB Atlas, create a database user, allow the API host in the network access list, and put the connection URI in `MONGODB_URI`.

## Seed the database and run locally

The catalogue includes 54 source properties with photo URLs. Seed imports those hotels and the destination data, and creates or updates the admin account from the environment variables:

```powershell
npm run seed
```

The source catalogue includes 54 photo-backed properties and the currently collected details. To refresh contact details from the listed hotel websites, optionally run `npm run enrich` and inspect `frontend/src/data/scrapedContacts.json` before seeding; the refresh can take several minutes, and some properties use group reservations contacts. Only data found on the listed property sites is added; unavailable phone numbers are left blank rather than invented.

Run the API and frontend in separate terminals:

```powershell
# Terminal 1
npm run server:dev
```

```powershell
# Terminal 2
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API is available at `http://localhost:5000/api`; Vite proxies `/api` requests to it. Admin login is at `/admin/login`.

After changing `ADMIN_EMAIL` or `ADMIN_PASSWORD`, run `npm run seed` again to update the initial admin account. The seed command upserts source hotels and destinations; it does not erase customer accounts, bookings, enquiries, or admin-edited hotels.

## Razorpay setup

1. Use Razorpay test credentials in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` while developing.
2. Set `RAZORPAY_WEBHOOK_SECRET` in `backend\.env`.
3. In the Razorpay dashboard, add a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/razorpay` and subscribe to `payment.captured` and `order.paid`.
4. Restart the API after changing environment variables.
5. Test the complete flow with Razorpay test mode before enabling live keys.

If Razorpay keys are not set, guests can still request bookings and admins can send quotes, but payment attempts show an explicit configuration error. Never use live credentials in local development or commit secrets.

## Features

- Photo-backed public catalogue; hotels without image URLs are excluded from the public listing and booking endpoints.
- Optional customer account with email and optional phone; login is required for enquiries and booking requests, not for browsing. The admin can use the provided guest contact details to follow up.
- Server-side password hashing, role checks, rate-limited sign-in/register routes, and HTTP-only session cookies.
- MongoDB persistence for hotel/destination admin edits, enquiries, booking requests, quotes, and payment state.
- Admin hotel and destination management, image management, enquiry queue, quote management, and booking status controls.
- Razorpay order creation and signature verification on the server, plus a signed webhook endpoint.
- Public health endpoint: `GET /api/health`.

Saved stays and trip-bar preferences remain local to the visitor’s browser. Hotel photographs are external URLs and retain their existing source/permission notes; obtain the rights needed for your launch.

## Tests and production build

```powershell
npm run test:server
npm run build
```

For production, build the client with `npm run build`, run the API with `npm run server`, and serve `frontend/dist` from your web host. Configure the web host/reverse proxy so `/api` routes to the Express API on the same site origin; this is important for the HTTP-only session cookie. Set `CLIENT_ORIGIN` to the exact public frontend origin, use HTTPS, use MongoDB Atlas or another managed MongoDB service, and provide live Razorpay keys only in the backend environment.

The admin UI and booking flow are ready for deployment once you provide real database/payment credentials and verify the booking, cancellation, refund, privacy, and tax policies for your business. Password reset and email notifications are not configured in this project.
