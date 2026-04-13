from datetime import date

from fastapi import APIRouter, HTTPException
from app.database import db
from app.models import ParticipantRegister

router = APIRouter()


@router.get("/api/bike-week")
async def bike_week_combined():
    """Combined endpoint returning all Bike Week data in one call."""
    overview = await bike_week_overview()
    participants = await list_participants()
    events = await list_events()
    results = await race_results()
    guardians = await list_guardians()
    return {
        "kpis": overview,
        "participants": participants,
        "events": events,
        "race_results": results,
        "guardians": guardians,
    }


@router.get("/api/bike-week/overview")
async def bike_week_overview():
    total_participants = await db.scalar("SELECT COUNT(*) FROM Participant")
    total_events = await db.scalar("SELECT COUNT(*) FROM Event")
    avg_age = await db.scalar("SELECT AVG(CAST(Age AS FLOAT)) FROM Participant")
    total_reg_revenue = await db.scalar(
        "SELECT ISNULL(SUM(e.RegistrationFee), 0) "
        "FROM EventRegistration er "
        "JOIN Event e ON er.EventID = e.EventID"
    )

    return {
        "total_participants": total_participants or 0,
        "total_events": total_events or 0,
        "avg_age": round(float(avg_age), 1) if avg_age else 0,
        "total_registration_revenue": float(total_reg_revenue) if total_reg_revenue else 0,
    }


@router.get("/api/bike-week/participants")
async def list_participants():
    return await db.query(
        "SELECT p.ParticipantID, "
        "p.FirstName + ' ' + p.LastName AS ParticipantName, "
        "p.Age, "
        "g.FirstName + ' ' + g.LastName AS GuardianName, "
        "g.GuardianID, "
        "p.City, p.State, "
        "COUNT(er.EventID) AS EventsRegistered "
        "FROM Participant p "
        "JOIN Guardian g ON p.GuardianID = g.GuardianID "
        "LEFT JOIN EventRegistration er ON p.ParticipantID = er.ParticipantID "
        "GROUP BY p.ParticipantID, p.FirstName, p.LastName, p.Age, "
        "g.GuardianID, g.FirstName, g.LastName, p.City, p.State "
        "ORDER BY p.LastName"
    )


@router.get("/api/bike-week/events")
async def list_events():
    return await db.query(
        "SELECT e.EventID, e.EventName, "
        "CASE WHEN re.EventID IS NOT NULL THEN 'Race' "
        "     WHEN rec.EventID IS NOT NULL THEN 'Recreational' "
        "     ELSE 'Unknown' END AS EventType, "
        "CASE WHEN re.EventID IS NOT NULL THEN re.RaceType ELSE NULL END AS RaceType, "
        "e.EventDate, e.EventTime, l.LocationName, "
        "e.RegistrationFee, e.AgeGroupBracket, "
        "COUNT(er.ParticipantID) AS RegisteredCount "
        "FROM Event e "
        "LEFT JOIN RaceEvent re ON e.EventID = re.EventID "
        "LEFT JOIN RecreationalEvent rec ON e.EventID = rec.EventID "
        "JOIN Location l ON e.LocationID = l.LocationID "
        "LEFT JOIN EventRegistration er ON e.EventID = er.EventID "
        "GROUP BY e.EventID, e.EventName, re.EventID, re.RaceType, "
        "rec.EventID, e.EventDate, e.EventTime, l.LocationName, "
        "e.RegistrationFee, e.AgeGroupBracket "
        "ORDER BY e.EventDate, e.EventTime"
    )


@router.get("/api/bike-week/results")
async def race_results():
    return await db.query(
        "SELECT e.EventName, re.RaceType, "
        "p.FirstName + ' ' + p.LastName AS ParticipantName, "
        "p.Age, rr.FinishTime, rr.Placement "
        "FROM RaceResult rr "
        "JOIN Event e ON rr.EventID = e.EventID "
        "JOIN RaceEvent re ON e.EventID = re.EventID "
        "JOIN Participant p ON rr.ParticipantID = p.ParticipantID "
        "ORDER BY e.EventName, rr.Placement"
    )


@router.get("/api/bike-week/guardians")
async def list_guardians():
    """List all guardians for the registration form dropdown."""
    return await db.query(
        "SELECT GuardianID, FirstName + ' ' + LastName AS Name "
        "FROM Guardian ORDER BY LastName"
    )


@router.post("/api/bike-week/register")
async def register_participant(body: ParticipantRegister):
    guardian_id = body.guardian_id

    # Create guardian if not provided
    if guardian_id is None:
        if not body.guardian_first_name or not body.guardian_last_name:
            raise HTTPException(
                status_code=400,
                detail="Must provide guardian_id or guardian name fields",
            )
        guardian_id = await db.execute_return_id(
            "INSERT INTO Guardian (FirstName, LastName, StreetAddress, City, State, "
            "ZipCode, WaiverSigned) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                body.guardian_first_name,
                body.guardian_last_name,
                body.guardian_street,
                body.guardian_city,
                body.guardian_state,
                body.guardian_zip,
                1 if body.guardian_waiver else 0,
            ),
        )
        if not guardian_id:
            raise HTTPException(status_code=500, detail="Failed to create guardian")

    # Create participant
    participant_id = await db.execute_return_id(
        "INSERT INTO Participant (FirstName, LastName, Age, GuardianID, WaiverSigned) "
        "VALUES (?, ?, ?, ?, 1)",
        (body.first_name, body.last_name, body.age, guardian_id),
    )
    if not participant_id:
        raise HTTPException(status_code=500, detail="Failed to create participant")

    # Register for events
    today = date.today().isoformat()
    for event_id in body.event_ids:
        await db.execute(
            "INSERT INTO EventRegistration (ParticipantID, EventID, RegistrationDate) "
            "VALUES (?, ?, ?)",
            (participant_id, event_id, today),
        )

    return {
        "participant_id": participant_id,
        "guardian_id": guardian_id,
        "events_registered": len(body.event_ids),
    }
