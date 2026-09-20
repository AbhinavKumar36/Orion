import json
from typing import List
import sqlite3
from backend.app.models.domain import Incident, Evidence, Entity
from backend.app.core.database import get_db

class IncidentRepository:
    def save_incident(self, incident: Incident) -> None:
        """
        Saves a canonical Incident and its nested Evidence and Entities to the database.
        """
        with get_db() as conn:
            # 1. Insert Incident
            conn.execute(
                """
                INSERT INTO incidents (
                    incident_id, schema_version, timestamp, event_time, module, layer,
                    input_type, threat_type, assessment, severity, risk_score, confidence,
                    status, correlation_id, risk_breakdown_json, explanation_json,
                    recommended_actions_json, mitre_json, model_metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    incident.incident_id,
                    incident.schema_version,
                    incident.timestamp.isoformat(),
                    incident.event_time.isoformat(),
                    incident.module.value,
                    incident.layer,
                    incident.input_type,
                    incident.threat_type,
                    incident.assessment,
                    incident.severity,
                    incident.risk_score,
                    incident.confidence,
                    incident.status,
                    incident.correlation_id,
                    incident.risk_breakdown.model_dump_json(),
                    incident.explanation.model_dump_json(),
                    json.dumps([a.model_dump() for a in incident.recommended_actions]),
                    json.dumps([m.model_dump() for m in incident.mitre_attack]) if incident.mitre_attack else None,
                    json.dumps(incident.model_metadata) if incident.model_metadata else None,
                )
            )

            # 2. Insert Evidence
            for ev in incident.evidence:
                conn.execute(
                    """
                    INSERT INTO evidence (
                        evidence_id, incident_id, type, category, value_json, weight,
                        direction, contribution, contribution_pct, source_engine, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ev.evidence_id,
                        incident.incident_id,
                        ev.type,
                        ev.category,
                        json.dumps(ev.value),
                        ev.weight,
                        ev.direction,
                        ev.contribution,
                        ev.contribution_pct,
                        ev.source_engine,
                        ev.description,
                    )
                )

            # 3. Insert Entities and mapping
            for ent in incident.entities:
                # Upsert entity
                cursor = conn.execute(
                    """
                    INSERT INTO entities (entity_type, value_canonical, first_seen, last_seen)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(entity_type, value_canonical) DO UPDATE SET
                    last_seen = excluded.last_seen
                    RETURNING entity_pk
                    """,
                    (
                        ent.entity_type,
                        ent.value_canonical,
                        incident.timestamp.isoformat(),
                        incident.timestamp.isoformat()
                    )
                )
                entity_pk = cursor.fetchone()[0]

                # Map to incident
                conn.execute(
                    """
                    INSERT OR IGNORE INTO incident_entities (
                        incident_id, entity_pk, role, criticality
                    ) VALUES (?, ?, ?, ?)
                    """,
                    (
                        incident.incident_id,
                        entity_pk,
                        ent.role,
                        ent.criticality
                    )
                )

    def get_incident(self, incident_id: str) -> Incident | None:
        """
        Retrieves a canonical Incident by ID.
        """
        with get_db() as conn:
            row = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,)).fetchone()
            if not row:
                return None
                
            # Get evidence
            ev_rows = conn.execute("SELECT * FROM evidence WHERE incident_id = ?", (incident_id,)).fetchall()
            evidence = []
            for r in ev_rows:
                evidence.append(
                    Evidence(
                        evidence_id=r["evidence_id"],
                        type=r["type"],
                        category=r["category"],
                        value=json.loads(r["value_json"]),
                        weight=r["weight"],
                        direction=r["direction"],
                        contribution=r["contribution"],
                        contribution_pct=r["contribution_pct"],
                        source_engine=r["source_engine"],
                        description=r["description"]
                    )
                )
                
            # Get entities
            ent_rows = conn.execute(
                """
                SELECT e.entity_type, e.value_canonical, ie.role, ie.criticality
                FROM entities e
                JOIN incident_entities ie ON e.entity_pk = ie.entity_pk
                WHERE ie.incident_id = ?
                """, (incident_id,)
            ).fetchall()
            
            entities = [
                Entity(
                    entity_type=r["entity_type"],
                    value_canonical=r["value_canonical"],
                    role=r["role"],
                    criticality=r["criticality"]
                ) for r in ent_rows
            ]

            return Incident(
                incident_id=row["incident_id"],
                schema_version=row["schema_version"],
                timestamp=row["timestamp"],
                event_time=row["event_time"],
                module=row["module"],
                layer=row["layer"],
                input_type=row["input_type"],
                threat_type=row["threat_type"],
                assessment=row["assessment"],
                severity=row["severity"],
                risk_score=row["risk_score"],
                confidence=row["confidence"],
                status=row["status"],
                correlation_id=row["correlation_id"],
                risk_breakdown=json.loads(row["risk_breakdown_json"]),
                explanation=json.loads(row["explanation_json"]),
                recommended_actions=json.loads(row["recommended_actions_json"]),
                mitre_attack=json.loads(row["mitre_json"]) if row["mitre_json"] else None,
                model_metadata=json.loads(row["model_metadata_json"]) if row["model_metadata_json"] else None,
                evidence=evidence,
                entities=entities
            )
