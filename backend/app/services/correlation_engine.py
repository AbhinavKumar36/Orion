import uuid
from typing import List, Dict, Any
from backend.app.repositories.incident_repo import IncidentRepository
from backend.app.core.database import get_db

class CorrelationEngine:
    """
    Correlates incidents into Threat Constellations based on shared entities.
    """
    def __init__(self, repo: IncidentRepository):
        self.repo = repo

    def correlate_incident(self, incident_id: str) -> None:
        """
        Looks up the newly saved incident, finds its entities, checks for existing
        incidents sharing those entities, and groups them under a single correlation_id.
        """
        incident = self.repo.get_incident(incident_id)
        if not incident or not incident.entities:
            return

        with get_db() as conn:
            # Get the entity PKs for this incident
            entity_pks = []
            for ent in incident.entities:
                row = conn.execute(
                    "SELECT entity_pk FROM entities WHERE entity_type = ? AND value_canonical = ?",
                    (ent.entity_type, ent.value_canonical)
                ).fetchone()
                if row:
                    entity_pks.append(row[0])

        if not entity_pks:
            return

        # Get all incidents that share these entities
        shared_incident_ids = self.repo.get_correlated_incidents(entity_pks)
        
        # We need to find if any of these shared incidents already have a correlation_id
        # We also enforce a 24-hour correlation window.
        existing_corr_ids = set()
        valid_shared_incident_ids = []
        
        with get_db() as conn:
            if shared_incident_ids:
                placeholders = ",".join("?" for _ in shared_incident_ids)
                rows = conn.execute(
                    f"SELECT incident_id, timestamp, correlation_id FROM incidents WHERE incident_id IN ({placeholders})",
                    tuple(shared_incident_ids)
                ).fetchall()
                
                from datetime import datetime, timedelta
                window_start = incident.timestamp.replace(tzinfo=None) - timedelta(hours=24)
                window_end = incident.timestamp.replace(tzinfo=None) + timedelta(hours=24)
                
                for row in rows:
                    inc_ts = datetime.fromisoformat(row[1]).replace(tzinfo=None)
                    if window_start <= inc_ts <= window_end:
                        valid_shared_incident_ids.append(row[0])
                        if row[2] is not None:
                            existing_corr_ids.add(row[2])
                
                shared_incident_ids = valid_shared_incident_ids

        # Determine the target correlation_id
        if existing_corr_ids:
            # Just pick the first one, or in a more complex system, merge them.
            # For this phase, we just pick one.
            target_corr_id = list(existing_corr_ids)[0]
        else:
            # If no existing correlation ID exists, but we have multiple incidents linked together, create one.
            if len(shared_incident_ids) > 1:
                target_corr_id = f"CORR-{uuid.uuid4().hex[:8].upper()}"
            else:
                # Only this incident, no correlation needed yet
                return

        # Update all linked incidents to use the target correlation_id
        all_incidents_to_update = list(set(shared_incident_ids + [incident_id]))
        self.repo.update_correlation_id(all_incidents_to_update, target_corr_id)
