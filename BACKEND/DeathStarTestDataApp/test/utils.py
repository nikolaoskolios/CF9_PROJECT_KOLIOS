from datetime import date
from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from ..database import Base
from ..main import app
from fastapi.testclient import TestClient
import pytest
from ..models import TestResults, Users
from ..routers.auth import bcrypt_context
from ..rate_limit import limiter

SQLALCHEMY_DATABASE_URL = "sqlite:///./testdb.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass = StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def override_get_current_user():
    return {'username': 'vader', 'id': 1, 'user_role': 'admin'}

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    limiter.reset()


@pytest.fixture
def test_test_result():
    test_result = TestResults(
        test_date=date(2026, 8, 28),
        build="death_star_iter_139.001",
        overall_test_rate=99.0,
        superlaser_concentration_static_check=100.0,
        hypermatter_reactor_core_startup_test=100.0,
        sublight_ion_engines_sanity_check=100.0,
        superlaser_focal_lenses_coordination_test=100.0,
        class_3_hyperdrive_coordinate_input_test=100.0,
        deflector_shield_generator_stress_test=100.0,
        turbolaser_ion_cannon_power_on_test=100.0,
        tractor_beam_projectors_response_test=97.0,
        exhaust_ports_control_test=100.0,
        kyber_crystal_sample_response_test=100.0,
        owner_id=1,
    )

    db = TestingSessionLocal()
    db.add(test_result)
    db.commit()
    yield test_result
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM test_results;"))
        connection.commit()


@pytest.fixture
def test_user():
    user = Users(
        username="vader",
        email="vader@empire.gov",
        first_name="Anakin",
        last_name="Skywalker",
        hashed_password=bcrypt_context.hash("testpassword"),
        role="admin",
        phone_number="(111)-111-1111"
    )
    db = TestingSessionLocal()
    db.add(user)
    db.commit()
    yield user
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM users;"))
        connection.commit()
