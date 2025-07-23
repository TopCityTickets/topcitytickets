# Top City Tickets

Welcome to the Top City Tickets project! This application allows users to apply to become sellers and manage their events through a seller dashboard.

## Project Structure

The project is organized as follows:

```
topcitytickets
├── src
│   ├── app
│   │   ├── apply-seller
│   │   │   └── page.tsx          # Apply Seller page component
│   │   ├── seller
│   │   │   └── dashboard
│   │   │       └── page.tsx      # Seller Dashboard page component
│   │   ├── api
│   │   │   └── auto-approve-seller
│   │   │       └── route.ts       # API route for auto-approving sellers
│   │   ├── globals.css            # Global CSS styles
│   │   ├── layout.tsx             # Main layout component
│   │   └── page.tsx               # Main entry point for the application
│   ├── components
│   │   └── ui
│   │       └── index.ts           # Reusable UI components
│   └── types
│       └── index.ts               # TypeScript types and interfaces
├── public
│   └── favicon.ico                 # Favicon for the application
├── package.json                    # npm configuration file
├── tailwind.config.js              # Tailwind CSS configuration
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project documentation
```

## Getting Started

To get started with the project, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd topcitytickets
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Features

- **Apply to Become a Seller:** Users can fill out a form to apply for seller status.
- **Seller Dashboard:** Approved sellers can manage their events and view relevant information.
- **Responsive Design:** The application is designed to be responsive and user-friendly.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.