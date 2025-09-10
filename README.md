# Reduxy Dashboard

A modern analytics and monitoring dashboard for the Reduxy AI Gateway, built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

✅ **Completed (Phase 1 - MVP)**
- Next.js 15 with Tailwind CSS + shadcn/ui components
- Mock authentication login page
- Request logs viewer with pagination
- Real-time metrics dashboard with charts
- Dark/light theme toggle
- Responsive design
- API client for backend communication
- Loading states and error handling
- Basic data visualization with Recharts

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Theme**: System-aware dark/light mode
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The dashboard will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features Overview

### Dashboard
- Real-time metrics (requests, costs, PII detections, response times)
- Interactive charts for request volume and PII detections
- System status indicators
- Time period filters

### Logs
- Paginated request logs table
- Status badges (success, error, etc.)
- PII detection indicators
- Request details with timestamps
- Filter and search capabilities

### Authentication
- Mock login page with demo credentials
- Protected routes (future enhancement)

### Theme
- System-aware dark/light mode toggle
- Persistent theme preference
- Smooth transitions

## API Integration

The dashboard connects to the Reduxy Gateway API endpoints:

- `GET /logs/` - Fetch paginated request logs
- `GET /logs/metrics` - Get usage metrics
- `GET /logs/chart-data` - Get chart data
- `GET /health/detailed` - Health check

## Deployment

This dashboard is configured for automatic deployment on Vercel:

1. Connected to `dashboard.reduxy.ai`
2. Automatic builds on push to main branch
3. Environment variables configured in Vercel dashboard

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── sidebar.tsx     # Navigation sidebar
│   └── theme-provider.tsx
├── lib/                # Utilities and API
│   ├── api.ts          # API client functions
│   └── utils.ts        # Helper functions
└── styles/             # Global styles
```

### Adding New Pages

1. Create page in `src/app/[page]/page.tsx`
2. Add route to sidebar navigation
3. Implement API integration if needed

## Future Enhancements (Phase 2)

- Real authentication with JWT
- Advanced filtering and search
- Policy editor UI
- Real-time updates with WebSockets
- Data export functionality
- User management interface

## License

MIT License

## Development
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)
