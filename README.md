[![EventSync CI/CD](https://github.com/youssefrezk1/EventSync-DevOps/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/youssefrezk1/EventSync-DevOps/actions/workflows/ci-cd.yml)

# EventSync

EventSync is a campus–wide events and activities hub for the German University in Cairo (GUC).  
It brings together students, staff, professors, vendors, and the event office on a single platform
to discover, create, and manage workshops, trips, conferences, bazaars, booths, and sports events.

---

## Table of Contents

1. [Project Title](#project-title)
2. [Motivation](#motivation)
3. [Build Status](#build-status)
4. [Code Style](#code-style)
5. [Screenshots](#screenshots)
6. [Tech / Framework Used](#tech--framework-used)
7. [Features](#features)
8. [Code Examples](#code-examples)
9. [Installation](#installation)
10. [API References](#api-references)
11. [Tests](#tests)
12. [How to Use](#how-to-use)
13. [Contribute](#contribute)
14. [Credits](#credits)
15. [License](#license)

---

## Project Title

**EventSync – GUC Campus Events Platform**

A full‑stack web application for managing all on‑campus events and activities in one place.

---

## Motivation

Universities typically advertise events using scattered channels (posters, emails, WhatsApp groups,
spreadsheets). This makes it hard to:

- Discover events relevant to your role (Student, Staff, Professor, Vendor, Event Office, Admin).
- Register for events before they are full.
- Track event history, favorites, and loyalty benefits.
- Coordinate approval workflows for workshops, trips, and bazaars.

**EventSync** solves this by providing a **single, role‑aware platform** where:

- Students easily discover and register for activities.
- Event Office members manage approvals and logistics.
- Vendors request bazaars and booths.
- Admins track the full events ecosystem and reporting.

---

## Build Status

- **Sprint:** 2  
- **Status:** Feature‑complete for core flows, under active refinement and bug‑fixing.  
- **Front‑end:** Next.js app builds and runs with `npm run dev` / `npm run build`.  
- **Back‑end:** Express server runs on `http://localhost:4000`.  
- **Known issues:**
  - Some UI polish and responsive tweaks are still in progress.
  - Error messages from some API endpoints are not yet localized for the UI.

---

## Code Style

The project uses a consistent, modern TypeScript / React style:

- **Language:** TypeScript (`.ts` / `.tsx`) for both front‑end and most back‑end logic.
- **Framework:** Next.js 14 App Router (`app/` directory).
- **Styling:** MUI (`@mui/material`) + custom theme in `app/app/lib/theme.tsx`.
- **Conventions:**
  - Components are **PascalCase** (`EventCard.tsx`, `FavoritesButton.tsx`).
  - Hooks and utilities are **camelCase** (`useEvents`, `roleToPath`).
  - No `any` unless absolutely necessary; prefer typed interfaces.
  - Prettier / ESLint settings from `eslint.config.mjs` ensure consistent formatting.

When contributing, please run your code through ESLint and follow the existing patterns in
`app/app/shared` and `app/app/components`.

---

## Screenshots

### Student Home / Hero section
![Home 1](docs/screenshots/Home.png)
![Home 2](docs/screenshots/Home2.png)
![Home 3](docs/screenshots/Home3.png)
![Home 4](docs/screenshots/Home4.png)

### Student dashboard – events list
![Events 1](docs/screenshots/Events.png)
![Events 2](docs/screenshots/Events2.png)

### Student dashboard – courts reservation
![Courts 1](docs/screenshots/Courts.png)
![Courts 2](docs/screenshots/Courts2.png)

### Student dashboard – gym classes reservation
![Gym 1](docs/screenshots/Gym.png)
![Gym 2](docs/screenshots/Gym2.png)

### Event Office – analytics and reports page
![Analytics 1](docs/screenshots/Analytics.png)
![Analytics 2](docs/screenshots/Analytics2.png)

### Vendor booth registration
![Booth 1](docs/screenshots/Booth.png)
![Booth 2](docs/screenshots/Booth2.png)
![Booth 3](docs/screenshots/Booth3.png)

### Workshop / trip detail page
![Workshop 1](docs/screenshots/Workshop.png)
![Workshop 2](docs/screenshots/Workshop2.png)
![Workshop 3](docs/screenshots/Workshop3.png)
![Workshop 4](docs/screenshots/Workshop4.png)


---

## Tech / Framework Used

**Front‑end**

- **Next.js 14** (App Router, `app/` directory)
- **React 18** with client components where needed (`"use client"`)
- **TypeScript**
- **MUI (Material UI)** for layout, grid, typography, buttons, dialogs, tables
- **Axios** for HTTP requests (`app/api.ts`)

**Back‑end**

- **Node.js + Express**
- **MongoDB + Mongoose** models for Trips, Workshops, Bazaars, Conferences, Booths, Users
- **JWT** authentication & role‑based access control

**Tooling**

- ESLint / TypeScript config in `eslint.config.mjs` and `tsconfig.json`
- npm scripts defined in `package.json`

---

## Features

> This section lists the **currently implemented** features (Sprint 2).

- **Role‑based Dashboards**
  - Student, Staff, Professor, Vendor, Event Office, Admin
  - Each dashboard has its own navigation, event views, and permissions.

- **Events Catalog**
  - Unified events listing with support for **workshops**, **trips**, **bazaars**, **conferences**, and **booths**.
  - Search / filter functionality by name, type, date, and location (see dashboards’ Events pages).

- **Event Discovery on Landing Page**
  - Public home page with hero section and role‑aware CTA (login / sign up).
  - Highlight cards for sample events by type (workshops, trips, bazaars, conferences, booths).

- **Registration & Favorites**
  - Students and staff can register for events (where allowed).
  - Favorites system with `FavoritesButton` and favorites dashboard section.

- **Notifications**
  - `NotificationBell` shows notifications for event approvals, reminders, workshop status changes, etc.
  - Notifications deep‑link into the relevant dashboard page or event detail.

- **Vendor & Bazaar Management**
  - Vendors can request participation in bazaars and booths.
  - Event Office / Admin can review, approve, or reject requests.

- **Loyalty Program (Points)**
  - Some dashboards include a loyalty program section where users accumulate points
    based on participation.

- **Role‑based Auth & Redirects**
  - Auth pages under `app/app/dashboards/auth` handle login + signup for multiple roles.
  - Token decoding and redirect logic routes each user to the correct dashboard.

---

## Code Examples

Below are **5+ concise code snippets** that demonstrate key parts of the system.

### 1. Axios API Client (`app/api.ts`)

```ts
// app/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000", // backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Events Hook (`app/app/shared/services.tsx` – simplified)

```ts
// useEvents hook – fetches events by type or all events
export const useEvents = (eventType?: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (filters: Partial<SearchFilters> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      // ... other filters ...

      let endpoint = "/api/events";
      if (eventType && eventType !== "all") {
        endpoint = `/api/events/type/${eventType}`;
      }

      const response = await api.get(`${endpoint}?${params.toString()}`);
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, fetchEvents };
};
```

### 3. AuthGuard Component (Role & Token Check)

```tsx
// app/app/components/AuthGuard.tsx (excerpt)
export default function AuthGuard({ allowedRoles = [], children }: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function verifyUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/dashboards/auth/login");
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const role = res.data?.user?.role;

        if (allowedRoles.length && !allowedRoles.includes(role)) {
          router.push("/unauthorized");
          return;
        }
      } catch (err) {
        localStorage.removeItem("token");
        router.push("/dashboards/auth/login");
      } finally {
        setChecked(true);
      }
    }

    verifyUser();
  }, [allowedRoles, router]);

  if (!checked) return <CircularProgress />;
  return <>{children}</>;
}
```

### 4. Role‑Based Redirect After Login

```tsx
// app/app/dashboards/auth/page.tsx (excerpt)
useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const urlParams = new URLSearchParams(window.location.search);
  const queryToken = urlParams.get("token");
  const activeToken = queryToken || storedToken;

  if (!activeToken) {
    setToken("No token found");
    return;
  }

  const decoded = jwtDecode<DecodedToken>(activeToken);

  switch (decoded.role) {
    case "admin":
      router.push("/dashboards/admin");
      break;
    case "event-office":
      router.push("/dashboards/eventOffice");
      break;
    case "vendor":
      router.push("/dashboards/vendor");
      break;
    case "student":
      router.push("/dashboards/student");
      break;
    // ... more roles ...
    default:
      router.push("/dashboards/auth/login");
  }
}, [router]);
```

### 5. Event Card Rendering on Landing Page (Simplified)

```tsx
// app/app/page.tsx (excerpt)
const renderEventCard = (event: EventData, label: string) => (
  <Card
    elevation={0}
    onClick={() => handleEventClick(event)}
    sx={{
      height: "100%",
      minHeight: 200,
      borderRadius: 3,
      border: `1px solid ${theme.palette.primary.light}30`,
      bgcolor: theme.palette.background.paper,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 8px 24px ${theme.palette.primary.main}15`,
      },
    }}
  >
    <CardContent>
      <Chip label={label} size="small" />
      <Typography variant="h6">{event.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {event.location}
      </Typography>
    </CardContent>
  </Card>
);
```

---

## Installation

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** running locally or accessible via connection string

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/EventSync.git
cd EventSync/app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend root (if not already present) and define the following:

```bash
PORT=4000
MONGO_URI=mongodb+srv://anbardummy:2005@cluster0.olnsayf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<REDACTED>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000 
EMAIL=bodyanbar2005@gmail.com
EMAIL_PASSWORD=<REDACTED>
CLOUDINARY_NAME=dl7601b7a
CLOUDINARY_API_KEY=114141452979866
CLOUDINARY_API_SECRET=<REDACTED>
USER_EMAIL=bodyanbar2005@gmail.com
CLIENT_ID=1080606868729-5e031oo2ig5j8laeghode8e97ke6s2dg.apps.googleusercontent.com
CLIENT_SECRET=<REDACTED>
REFRESH_TOKEN=<REDACTED>
STRIPE_SECRET_KEY=<REDACTED>
STRIPE_WEBHOOK_SECRET=<REDACTED>
```

For the Next.js app you can add a `.env.local` if you need to override any defaults (e.g., API base URL).

### 4. Run the Back‑end

```bash
cd backend
npm run dev
```

The server should start at `http://localhost:4000`.

### 5. Run the Front‑end (in a Seperate Terminal from the Back-end)

```bash
cd app
npm run dev
```

Visit: `http://localhost:3000`

---

## API References

Base URL: `http://localhost:4000`

### Authentication

- **POST** `/api/auth/login`  
  Request body: `{ email, password }`  
  Response: `{ token, user }` with `role` used for redirects.

- **POST** `/api/auth/signup/student`  
  Create a new student account.

- **POST** `/api/auth/signup/staff`  
  Create a new staff account.

### Events

- **GET** `/api/events`  
  Returns all visible events (trips, workshops, bazaars, conferences, booths), optionally filtered
  by `search`, `location`, `date`, `sortBy`, `sortOrder` query parameters.

- **GET** `/api/events/type/:type`  
  Returns events for a single type. `type` ∈ `trips | workshops | bazaars | conferences | booths`.

- **GET** `/api/events/:id`  
  Returns a single event document by ID (type‑specific logic in controllers).

### Favorites

- **GET** `/api/favorites` – list current user’s favorite events.  
- **POST** `/api/favorites` – add a favorite `{ eventId, eventType }`.  
- **DELETE** `/api/favorites/:id` – remove favorite by ID.

---

## Tests

For Sprint 2, testing is primarily done using **Postman** collections.

### 1. Bazaar Payment – redirect to stripe
![Bazaar Payment](docs/screenshots/BazaarPayment.jpeg)

`POST /api/payments/bazaar/[id]/pay` returns stripe url + session id.

---

### 2. Booth Payment – failed
![Booth Payment Fail](docs/screenshots/BoothFail.jpeg)

Same endpoint but with rejected booth instead of accepted bazaar returns error message.

---

### 3. Cancelling a Rejected Booth Registration
![Cancel Fail](docs/screenshots/BoothCancelFail.jpeg)

`POST /api/payments/booths/[id]/cancel` returns an error message as this booth is rejected.

---

### 4. Workshop Payment - redirect to stripe
![Workshop Payment](docs/screenshots/WorkshopPayment.jpeg)

`POST /api/payments/payforworkshop/[id]` returns stripe url and session id.

---

### 5. Cancelling Workshop Successfully
![Workshop Cancellation](docs/screenshots/WorkshopCancel.jpeg)

`POST /api/payments/workshops/[id]/cancel` returns cancellation success message.

---

You can import a Postman collection (not included here by default) with the above requests and run them as a simple automated test suite.


---

## How to Use

1. **Open the app** at `http://localhost:3000`.
2. **Sign up** as a student, staff, professor, vendor, or event office user.
3. **Log in** and you will be redirected automatically to the correct dashboard.
4. Use the **Events** / **Workshops** / **Trips** / **Bazaars** / **Conferences** / **Booths**
   tabs to explore activities relevant to your role.
5. **Register** for events (if allowed) or mark them as **favorites** for later.
6. If you are part of Event Office or Admin, you can **review requests**, **approve / reject**
   events, and access **reports** and **loyalty program** dashboards.

The landing page is also usable for visitors: it highlights sample events and provides
clear CTAs to log in or sign up.

---

## Contribute

We welcome contributions that improve the UI/UX, add tests, or extend event types.

To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/my-improvement`.
3. Make your changes and ensure `npm run lint` (if configured) passes.
4. Add or update tests (Postman or Jest) where relevant.
5. Submit a Pull Request describing **what** you changed and **why**.

Please avoid large, unrelated changes in a single PR – keep contributions focused and easy to review.

---

## Credits

- **Team Members:**  
  - Omar Adham 58-2539
  - AbdelRahman Anbar 58-7433
  - Salma Ibrahim 58-4017
  - Aly Talaat 58-4123
  - Mohammed Wahba 58-21320
  - Mohamed Ayman 58-13475
  - Youssef Rezk 59-30006
  - Kareem Wael 59-30008
  - Mohamed Karim 58-1483
  - Amr Mostafa 58-14976

- **Resources Used:**  
  - Great Learning article on how to write a good README (for structure & guidelines).  
  - MUI documentation for components and theming.  
  - Next.js & React official docs for routing and best practices.  
  - Any additional tutorials, StackOverflow answers, or libraries used in the project.

---

## License

This project is licensed under the MIT License.

This project also uses third-party libraries, including the Stripe Node.js SDK,
which is licensed under the MIT License. You must include Stripe’s license notice
if you distribute or modify this project.

Stripe Node.js License:
https://github.com/stripe/stripe-node/blob/master/LICENSE

---

_Last updated: Sprint 2 — please keep this README up‑to‑date as the project evolves._

# EventSync