from datetime import date
from typing import Annotated, List, Literal, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from starlette import status
from ..models import TestResults
from ..database import SessionLocal
from ..query_language import parse_query_expression, QuerySyntaxError
from .auth import get_current_user, get_current_user_or_api_key

# Query-selectable subsystem test column for GET /test-results/?attribute=...
SubsystemAttribute = Literal[
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

# Always-present columns when filtering the response down to one attribute.
BASE_FIELDS = ['id', 'test_date', 'build', 'overall_test_rate', 'owner_id']

router = APIRouter(
    prefix='/test-results',
    tags=['test-results']
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]
# Accepts either the usual login JWT or an X-API-Key header - lets scripts
# upload results with a long-lived API key instead of a 20-minute session token.
user_or_api_key_dependency = Annotated[dict, Depends(get_current_user_or_api_key)]

class TestResultRequest(BaseModel):
    __test__ = False  # not a pytest test class, despite the name

    test_date: date
    build: str = Field(min_length=3)
    overall_test_rate: Optional[float] = Field(default=None, ge=0, le=100)
    superlaser_concentration_static_check: Optional[float] = Field(default=None, ge=0, le=100)
    hypermatter_reactor_core_startup_test: Optional[float] = Field(default=None, ge=0, le=100)
    sublight_ion_engines_sanity_check: Optional[float] = Field(default=None, ge=0, le=100)
    superlaser_focal_lenses_coordination_test: Optional[float] = Field(default=None, ge=0, le=100)
    class_3_hyperdrive_coordinate_input_test: Optional[float] = Field(default=None, ge=0, le=100)
    deflector_shield_generator_stress_test: Optional[float] = Field(default=None, ge=0, le=100)
    turbolaser_ion_cannon_power_on_test: Optional[float] = Field(default=None, ge=0, le=100)
    tractor_beam_projectors_response_test: Optional[float] = Field(default=None, ge=0, le=100)
    exhaust_ports_control_test: Optional[float] = Field(default=None, ge=0, le=100)
    kyber_crystal_sample_response_test: Optional[float] = Field(default=None, ge=0, le=100)


class TestResultResponse(BaseModel):
    __test__ = False  # not a pytest test class, despite the name

    id: int
    test_date: date
    build: str
    overall_test_rate: Optional[float]
    superlaser_concentration_static_check: Optional[float]
    hypermatter_reactor_core_startup_test: Optional[float]
    sublight_ion_engines_sanity_check: Optional[float]
    superlaser_focal_lenses_coordination_test: Optional[float]
    class_3_hyperdrive_coordinate_input_test: Optional[float]
    deflector_shield_generator_stress_test: Optional[float]
    turbolaser_ion_cannon_power_on_test: Optional[float]
    tractor_beam_projectors_response_test: Optional[float]
    exhaust_ports_control_test: Optional[float]
    kyber_crystal_sample_response_test: Optional[float]
    owner_id: int

    model_config = {'from_attributes': True}


class PaginatedTestResults(BaseModel):
    items: List[TestResultResponse]
    total: int
    skip: int
    limit: int


@router.get("/", status_code=status.HTTP_200_OK)
async def read_all(user: user_dependency, db: db_dependency,
                   skip: int = Query(default=0, ge=0),
                   limit: int = Query(default=20, ge=1, le=100),
                   attribute: Optional[SubsystemAttribute] = Query(default=None)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    base_query = db.query(TestResults)
    total = base_query.count()
    records = base_query.order_by(TestResults.id).offset(skip).limit(limit).all()

    if attribute is None:
        items = [TestResultResponse.model_validate(record).model_dump() for record in records]
    else:
        fields = BASE_FIELDS + [attribute]
        items = [{field: getattr(record, field) for field in fields} for record in records]

    return {'items': items, 'total': total, 'skip': skip, 'limit': limit}


@router.get("/query", status_code=status.HTTP_200_OK, response_model=PaginatedTestResults)
async def query_test_results(user: user_dependency, db: db_dependency,
                             q: str = Query(
                                 ...,
                                 description='Boolean filter expression. Fields: build (string) and any '
                                             'numeric column (overall_test_rate or a subsystem test). '
                                             'Operators: = == != < <= > >=. Combine with AND / OR and '
                                             'parentheses. Example: (overall_test_rate < 92) AND '
                                             '(superlaser_concentration_static_check > 95)'),
                             skip: int = Query(default=0, ge=0),
                             limit: int = Query(default=20, ge=1, le=100)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    try:
        condition = parse_query_expression(q)
    except QuerySyntaxError as e:
        raise HTTPException(status_code=422, detail=f'Invalid query: {e}')

    base_query = db.query(TestResults).filter(condition)
    total = base_query.count()
    records = base_query.order_by(TestResults.id).offset(skip).limit(limit).all()
    items = [TestResultResponse.model_validate(record).model_dump() for record in records]

    return {'items': items, 'total': total, 'skip': skip, 'limit': limit}


@router.get("/{test_result_id}", status_code=status.HTTP_200_OK, response_model=TestResultResponse)
async def read_test_result(user: user_dependency, db: db_dependency, test_result_id: int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    test_result_model = db.query(TestResults).filter(TestResults.id == test_result_id).first()
    if test_result_model is not None:
        return test_result_model
    raise HTTPException(status_code=404, detail='Test result not found.')


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_test_result(user: user_or_api_key_dependency, db: db_dependency,
                             test_result_request: TestResultRequest):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    test_result_model = TestResults(**test_result_request.model_dump(), owner_id=user.get('id'))

    db.add(test_result_model)
    db.commit()
