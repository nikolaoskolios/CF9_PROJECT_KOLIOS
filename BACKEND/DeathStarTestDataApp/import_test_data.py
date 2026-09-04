"""Replace the contents of test_results with the data in ../TestData.csv.

TestResults is a 1:1 mirror of the CSV: one row per build, with every
subsystem test as its own column. This just parses each CSV row's
percentages/date and inserts it as-is (plus owner_id, which the CSV has no
equivalent for).

Run from the BACKEND directory:
    python -m DeathStarTestDataApp.import_test_data
"""
import csv
from datetime import date
from pathlib import Path

from .database import Base, SessionLocal, engine
from .models import TestResults, Users
from .routers.auth import bcrypt_context

CSV_PATH = Path(__file__).resolve().parents[2] / "TestData.csv"

OWNER_USERNAME = "vader"
OWNER_DEFAULTS = {
    "email": "vader@empire.gov",
    "first_name": "Anakin",
    "last_name": "Skywalker",
    "password": "testpassword",
    "role": "admin",
    "phone_number": "1112223333",
}

# Maps each model field to its CSV column header.
CSV_COLUMN_BY_FIELD = {
    'superlaser_concentration_static_check': 'Superlaser_Concentration_Static_Check',
    'hypermatter_reactor_core_startup_test': 'Hypermatter_Reactor_Core_Startup_Test',
    'sublight_ion_engines_sanity_check': 'Sublight_Ion_Engines_Sanity_Check',
    'superlaser_focal_lenses_coordination_test': 'Superlaser_Focal_Lenses_Coordination_Test',
    'class_3_hyperdrive_coordinate_input_test': 'Class_3_Hyperdrive_Coordinate_Input_Test',
    'deflector_shield_generator_stress_test': 'Deflector_Shield_Generator_Stress_Test',
    'turbolaser_ion_cannon_power_on_test': 'Turbolaser_Ion_Cannon_Power_On_Test',
    'tractor_beam_projectors_response_test': 'Tractor_Beam_Projectors_Response_Test',
    'exhaust_ports_control_test': 'Exhaust Ports_Control_Test',
    'kyber_crystal_sample_response_test': 'Kyber_Crystal_Sample_Response_Test',
}


def parse_percentage(raw: str):
    raw = (raw or "").strip()
    if not raw or raw.lower() == "n/a":
        return None
    return float(raw.rstrip("%"))


def parse_date(raw: str) -> date:
    day, month, year = raw.strip().split("/")
    return date(int(year), int(month), int(day))


def get_or_create_owner(db) -> Users:
    owner = db.query(Users).filter(Users.username == OWNER_USERNAME).first()
    if owner is not None:
        return owner

    owner = Users(
        username=OWNER_USERNAME,
        email=OWNER_DEFAULTS["email"],
        first_name=OWNER_DEFAULTS["first_name"],
        last_name=OWNER_DEFAULTS["last_name"],
        hashed_password=bcrypt_context.hash(OWNER_DEFAULTS["password"]),
        is_active=True,
        role=OWNER_DEFAULTS["role"],
        phone_number=OWNER_DEFAULTS["phone_number"],
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        owner = get_or_create_owner(db)

        db.query(TestResults).delete()
        db.commit()

        rows_created = 0
        with open(CSV_PATH, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if not row.get("Date"):
                    continue

                fields = {
                    'test_date': parse_date(row["Date"]),
                    'build': row["Build"].strip(),
                    'overall_test_rate': parse_percentage(row["Overall Test Rate"]),
                    'owner_id': owner.id,
                }
                for model_field, csv_column in CSV_COLUMN_BY_FIELD.items():
                    fields[model_field] = parse_percentage(row[csv_column])

                db.add(TestResults(**fields))
                rows_created += 1

        db.commit()
        print(f"Imported {rows_created} test result rows (owner: {OWNER_USERNAME}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
