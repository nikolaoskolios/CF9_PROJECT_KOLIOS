from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, Date, ForeignKey


class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    username = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String)
    phone_number = Column(String)
    api_key_hash = Column(String, unique=True, nullable=True)


# One field per subsystem test column in TestData.csv, in CSV column order.
SUBSYSTEM_TEST_FIELDS = [
    'superlaser_concentration_static_check',
    'hypermatter_reactor_core_startup_test',
    'sublight_ion_engines_sanity_check',
    'superlaser_focal_lenses_coordination_test',
    'class_3_hyperdrive_coordinate_input_test',
    'deflector_shield_generator_stress_test',
    'turbolaser_ion_cannon_power_on_test',
    'tractor_beam_projectors_response_test',
    'exhaust_ports_control_test',
    'kyber_crystal_sample_response_test',
]


class TestResults(Base):
    __tablename__ = 'test_results'
    __test__ = False  # not a pytest test class, despite the name

    id = Column(Integer, primary_key=True, index=True)
    test_date = Column(Date)
    build = Column(String)
    overall_test_rate = Column(Float, nullable=True)
    superlaser_concentration_static_check = Column(Float, nullable=True)
    hypermatter_reactor_core_startup_test = Column(Float, nullable=True)
    sublight_ion_engines_sanity_check = Column(Float, nullable=True)
    superlaser_focal_lenses_coordination_test = Column(Float, nullable=True)
    class_3_hyperdrive_coordinate_input_test = Column(Float, nullable=True)
    deflector_shield_generator_stress_test = Column(Float, nullable=True)
    turbolaser_ion_cannon_power_on_test = Column(Float, nullable=True)
    tractor_beam_projectors_response_test = Column(Float, nullable=True)
    exhaust_ports_control_test = Column(Float, nullable=True)
    kyber_crystal_sample_response_test = Column(Float, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
