# PropertyInsight AI

PropertyInsight AI is a comprehensive, production-grade real estate intelligence platform that leverages artificial intelligence to provide property valuations, market analysis, investment insights, and natural language property search.

## Features

- **Property Valuation Engine**: Automated price prediction with confidence intervals
- **Market Analysis Module**: Trend detection and forecasting
- **Investment Property Analyzer**: ROI calculations and risk assessment
- **Intelligent Search**: Natural language property discovery with RAG
- **Portfolio Management**: Real-time tracking and recommendations

## Architecture

The platform follows a microservices architecture:

- **Backend**: FastAPI (Python) - REST API, business logic, data access
- **Frontend**: Next.js (React) - User interface, interactive visualizations
- **AI Service**: Python - Model serving, RAG, feature engineering
- **Infrastructure**: Docker, Kubernetes, Terraform

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.11+ (for backend development)

### Local Development

1. Clone the repository
2. Copy environment files:
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Start services with Docker Compose:
   ```
   docker-compose up -d
   ```
4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/docs
   - AI Service: http://localhost:8001

### Database Migrations

```bash
cd backend
alembic upgrade head
```

### Running Tests

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm test
```

## Deployment

See [deployment documentation](docs/deployment/production-deployment.md) for production setup.

## Contributing

Please read [contributing.md](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
