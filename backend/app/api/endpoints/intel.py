from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.app.core.database import get_db

router = APIRouter()

@router.get("/constellations", response_model=Dict[str, Any])
def get_threat_constellations():
    """
    Returns a graph representation of Threat Constellations.
    Nodes: Incidents (by correlation_id or incident_id) and Entities (by entity_pk).
    Edges: Incident -> Entity.
    """
    try:
        with get_db() as conn:
            # 1. Fetch incidents that have entities and are considered threats
            # For this demo, let's just get all incidents that are linked to entities.
            incident_rows = conn.execute(
                "SELECT incident_id, correlation_id, threat_type, severity, module FROM incidents"
            ).fetchall()
            
            incidents = {}
            for r in incident_rows:
                incidents[r["incident_id"]] = {
                    "id": r["incident_id"],
                    "type": "incident",
                    "correlation_id": r["correlation_id"],
                    "threat_type": r["threat_type"],
                    "severity": r["severity"],
                    "module": r["module"]
                }
                
            # 2. Fetch entities
            entity_rows = conn.execute(
                "SELECT entity_pk, entity_type, value_canonical FROM entities"
            ).fetchall()
            
            entities = {}
            for r in entity_rows:
                entities[r["entity_pk"]] = {
                    "id": f"entity-{r['entity_pk']}",
                    "type": "entity",
                    "entity_type": r["entity_type"],
                    "value_canonical": r["value_canonical"]
                }
                
            # 3. Fetch edges (incident_entities)
            edge_rows = conn.execute(
                "SELECT incident_id, entity_pk FROM incident_entities"
            ).fetchall()
            
            edges = []
            
            # To keep the graph clean, we'll only include nodes that are part of an edge
            active_incident_ids = set()
            active_entity_pks = set()
            
            for r in edge_rows:
                incident_id = r["incident_id"]
                entity_pk = r["entity_pk"]
                
                active_incident_ids.add(incident_id)
                active_entity_pks.add(entity_pk)
                
                edges.append({
                    "source": incident_id,
                    "target": f"entity-{entity_pk}"
                })
                
            nodes = []
            for inc_id in active_incident_ids:
                if inc_id in incidents:
                    nodes.append(incidents[inc_id])
                    
            for ent_pk in active_entity_pks:
                if ent_pk in entities:
                    nodes.append(entities[ent_pk])
                    
            return {
                "nodes": nodes,
                "edges": edges
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
