# Scalability and Deployment

## Phase 0/Demo Deployment (Current)
The current ORION prototype is designed for an offline, single-laptop demonstration environment.
- **Backend:** FastAPI running via Uvicorn.
- **Frontend:** React SPA bundled by Vite.
- **Data Persistence:** Local SQLite database (`orion.db`) operating in WAL mode.
- **Reset Capability:** Included a `scripts/reset_demo.py` tool for reliable, clean-state demonstrations.

## Production Scalability Plan (Roadmap)
For real-world deployment across academic, government, or enterprise bodies, the architecture must scale:
1. **Containerization:** All services (Frontend, API, Worker pools) will be packaged into Docker containers and orchestrated via Kubernetes.
2. **Database Migration:** Replace SQLite with a horizontally scalable RDBMS like PostgreSQL for incident and registry data.
3. **Asynchronous Processing:** Long-running module execution (especially Tier 1 media processing) will be offloaded to an asynchronous ingestion queue (e.g., RabbitMQ or Kafka) and consumed by scalable worker nodes.
4. **Model Serving:** Separate the model inference tier (e.g., using Triton Inference Server) from the core REST API for granular scaling of computationally expensive detection logic.
5. **Multi-Tenancy & RBAC:** Implement strict role-based access control and tenant isolation directly at the database and API routing layers.
