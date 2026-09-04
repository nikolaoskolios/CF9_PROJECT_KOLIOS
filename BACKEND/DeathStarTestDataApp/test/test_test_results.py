from ..routers.test_results import get_db, get_current_user
from fastapi import status
from ..models import TestResults
from .utils import *

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


def test_read_all_authenticated(test_test_result):
    response = client.get("/test-results/")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 1
    assert body['skip'] == 0
    assert body['limit'] == 20
    assert len(body['items']) == 1
    item = body['items'][0]
    assert item['build'] == 'death_star_iter_139.001'
    assert item['overall_test_rate'] == 99.0
    assert item['superlaser_concentration_static_check'] == 100.0
    assert item['tractor_beam_projectors_response_test'] == 97.0
    assert item['owner_id'] == 1


def test_read_all_pagination(test_test_result):
    db = TestingSessionLocal()
    db.add_all([
        TestResults(test_date=date(2026, 8, 29), build='death_star_iter_139.002',
                    overall_test_rate=92.0, owner_id=1),
        TestResults(test_date=date(2026, 8, 30), build='death_star_iter_139.003',
                    overall_test_rate=84.0, owner_id=1),
    ])
    db.commit()

    response = client.get("/test-results/?skip=0&limit=2")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 3
    assert body['skip'] == 0
    assert body['limit'] == 2
    assert len(body['items']) == 2
    assert body['items'][0]['id'] == 1
    assert body['items'][1]['id'] == 2

    response = client.get("/test-results/?skip=2&limit=2")
    body = response.json()
    assert body['total'] == 3
    assert len(body['items']) == 1
    assert body['items'][0]['id'] == 3


def test_read_all_limit_capped_at_100():
    response = client.get("/test-results/?limit=500")
    assert response.status_code == 422


def test_read_all_includes_other_owners_results(test_test_result):
    # Test results are shared across all users, not scoped to the submitter.
    db = TestingSessionLocal()
    db.add(TestResults(test_date=date(2026, 8, 29), build='death_star_iter_139.999',
                        overall_test_rate=50.0, owner_id=999))
    db.commit()

    response = client.get("/test-results/")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 2
    builds = {item['build'] for item in body['items']}
    assert 'death_star_iter_139.999' in builds


def test_read_one_includes_other_owners_result():
    db = TestingSessionLocal()
    other = TestResults(test_date=date(2026, 8, 29), build='death_star_iter_139.999',
                         overall_test_rate=50.0, owner_id=999)
    db.add(other)
    db.commit()
    db.refresh(other)

    try:
        response = client.get(f"/test-results/{other.id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['build'] == 'death_star_iter_139.999'
    finally:
        with engine.connect() as connection:
            connection.execute(text("DELETE FROM test_results;"))
            connection.commit()


def test_read_all_with_attribute_filters_columns(test_test_result):
    response = client.get("/test-results/?attribute=kyber_crystal_sample_response_test")
    assert response.status_code == status.HTTP_200_OK
    item = response.json()['items'][0]
    assert set(item.keys()) == {
        'id', 'test_date', 'build', 'overall_test_rate',
        'owner_id', 'kyber_crystal_sample_response_test',
    }
    assert item['build'] == 'death_star_iter_139.001'
    assert item['kyber_crystal_sample_response_test'] == 100.0


def test_read_all_with_invalid_attribute():
    response = client.get("/test-results/?attribute=not_a_real_column")
    assert response.status_code == 422


def _seed_query_fixture_rows():
    db = TestingSessionLocal()
    db.add_all([
        TestResults(test_date=date(2026, 8, 29), build='death_star_iter_139.002',
                    overall_test_rate=90.0, superlaser_concentration_static_check=96.0, owner_id=1),
        TestResults(test_date=date(2026, 8, 30), build='death_star_iter_139.003',
                    overall_test_rate=95.0, superlaser_concentration_static_check=80.0, owner_id=1),
    ])
    db.commit()


def test_query_simple_equality(test_test_result):
    response = client.get('/test-results/query', params={'q': 'build = "death_star_iter_139.001"'})
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 1
    assert body['items'][0]['build'] == 'death_star_iter_139.001'


def test_query_or_same_field(test_test_result):
    _seed_query_fixture_rows()
    response = client.get('/test-results/query', params={
        'q': 'build = "death_star_iter_139.001" OR build = "death_star_iter_139.002"'
    })
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 2
    builds = {item['build'] for item in body['items']}
    assert builds == {'death_star_iter_139.001', 'death_star_iter_139.002'}


def test_query_and_different_fields(test_test_result):
    _seed_query_fixture_rows()
    # Only iter_139.002 has overall_test_rate<92 AND superlaser_concentration_static_check>95.
    response = client.get('/test-results/query', params={
        'q': '(overall_test_rate < 92) AND (superlaser_concentration_static_check > 95)'
    })
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['total'] == 1
    assert body['items'][0]['build'] == 'death_star_iter_139.002'


def test_query_or_different_fields(test_test_result):
    _seed_query_fixture_rows()
    # iter_139.001: overall=99 (no), superlaser=100 (>95 yes) -> included
    # iter_139.002: overall=90 (<92 yes) -> included
    # iter_139.003: overall=95 (no), superlaser=80 (no) -> excluded
    response = client.get('/test-results/query', params={
        'q': '(overall_test_rate < 92) OR (superlaser_concentration_static_check > 95)'
    })
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    builds = {item['build'] for item in body['items']}
    assert builds == {'death_star_iter_139.001', 'death_star_iter_139.002'}


def test_query_includes_other_owners_results():
    db = TestingSessionLocal()
    db.add(TestResults(test_date=date(2026, 8, 29), build='death_star_iter_139.999',
                        overall_test_rate=50.0, owner_id=999))
    db.commit()

    try:
        response = client.get('/test-results/query', params={'q': 'build = "death_star_iter_139.999"'})
        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body['total'] == 1
        assert body['items'][0]['owner_id'] == 999
    finally:
        with engine.connect() as connection:
            connection.execute(text("DELETE FROM test_results;"))
            connection.commit()


def test_query_invalid_syntax_returns_422():
    response = client.get('/test-results/query', params={'q': 'not_a_field = "x"'})
    assert response.status_code == 422
    assert 'Invalid query' in response.json()['detail']


def test_query_requires_q_param():
    response = client.get('/test-results/query')
    assert response.status_code == 422


def test_read_one_authenticated(test_test_result):
    response = client.get("/test-results/1")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body['build'] == 'death_star_iter_139.001'
    assert body['kyber_crystal_sample_response_test'] == 100.0


def test_read_one_authenticated_not_found():
    response = client.get("/test-results/999")
    assert response.status_code == 404
    assert response.json() == {'detail': 'Test result not found.'}


def test_create_test_result(test_test_result):
    request_data = {
        'test_date': '2026-08-29',
        'build': 'death_star_iter_139.002',
        'overall_test_rate': 92.0,
        'superlaser_concentration_static_check': None,
        'hypermatter_reactor_core_startup_test': None,
        'sublight_ion_engines_sanity_check': None,
        'superlaser_focal_lenses_coordination_test': 100.0,
        'class_3_hyperdrive_coordinate_input_test': 100.0,
        'deflector_shield_generator_stress_test': 100.0,
        'turbolaser_ion_cannon_power_on_test': 100.0,
        'tractor_beam_projectors_response_test': 65.0,
        'exhaust_ports_control_test': None,
        'kyber_crystal_sample_response_test': 0.0,
    }

    response = client.post('/test-results/', json=request_data)
    assert response.status_code == 201

    db = TestingSessionLocal()
    model = db.query(TestResults).filter(TestResults.id == 2).first()
    assert model.build == request_data['build']
    assert model.overall_test_rate == request_data['overall_test_rate']
    assert model.superlaser_concentration_static_check is None
    assert model.kyber_crystal_sample_response_test == 0.0


def test_create_test_result_build_too_short():
    request_data = {
        'test_date': '2026-08-29',
        'build': 'ok',
    }
    response = client.post('/test-results/', json=request_data)
    assert response.status_code == 422


def test_update_test_result_no_longer_available_here(test_test_result):
    # Updating test results moved to PUT /admin/test-results/{id} (admin-only).
    request_data = {
        'test_date': '2026-08-28',
        'build': 'death_star_iter_139.001',
    }
    response = client.put('/test-results/1', json=request_data)
    assert response.status_code == 405


def test_delete_test_result_no_longer_available_here(test_test_result):
    # Deleting test results moved to DELETE /admin/test-results/{id} (admin-only).
    response = client.delete('/test-results/1')
    assert response.status_code == 405
