from .utils import *
from ..routers.admin import get_db, get_current_user
from fastapi import status
from ..models import TestResults, Users

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

def test_admin_read_all_authenticated(test_test_result):
    response = client.get("/admin/test-results")
    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert len(body) == 1
    assert body[0]['build'] == 'death_star_iter_139.001'


def test_admin_update_test_result(test_test_result):
    request_data = {
        'test_date': '2026-08-28',
        'build': 'death_star_iter_139.001',
        'overall_test_rate': 84.0,
        'superlaser_concentration_static_check': 84.0,
        'hypermatter_reactor_core_startup_test': 100.0,
        'sublight_ion_engines_sanity_check': 100.0,
        'superlaser_focal_lenses_coordination_test': 100.0,
        'class_3_hyperdrive_coordinate_input_test': 100.0,
        'deflector_shield_generator_stress_test': 100.0,
        'turbolaser_ion_cannon_power_on_test': 100.0,
        'tractor_beam_projectors_response_test': 100.0,
        'exhaust_ports_control_test': 100.0,
        'kyber_crystal_sample_response_test': 100.0,
    }

    response = client.put('/admin/test-results/1', json=request_data)
    assert response.status_code == 204

    db = TestingSessionLocal()
    model = db.query(TestResults).filter(TestResults.id == 1).first()
    assert model.overall_test_rate == 84.0
    assert model.superlaser_concentration_static_check == 84.0
    assert model.owner_id == 1  # ownership untouched by the update


def test_admin_update_test_result_ignores_owner(test_test_result):
    # Admin can edit a record even if it belongs to a different user.
    db = TestingSessionLocal()
    other = db.query(TestResults).filter(TestResults.id == 1).first()
    other.owner_id = 2
    db.commit()

    request_data = {
        'test_date': '2026-08-28',
        'build': 'death_star_iter_139.001',
        'overall_test_rate': 50.0,
    }
    response = client.put('/admin/test-results/1', json=request_data)
    assert response.status_code == 204

    db = TestingSessionLocal()
    model = db.query(TestResults).filter(TestResults.id == 1).first()
    assert model.overall_test_rate == 50.0
    assert model.owner_id == 2


def test_admin_update_test_result_not_found():
    request_data = {
        'test_date': '2026-08-28',
        'build': 'death_star_iter_139.001',
    }
    response = client.put('/admin/test-results/9999', json=request_data)
    assert response.status_code == 404
    assert response.json() == {'detail': 'Test result not found.'}


def test_admin_update_test_result_forbidden_for_non_admin(test_test_result):
    app.dependency_overrides[get_current_user] = lambda: {'username': 'luke', 'id': 2, 'user_role': 'user'}
    request_data = {
        'test_date': '2026-08-28',
        'build': 'death_star_iter_139.001',
    }
    response = client.put('/admin/test-results/1', json=request_data)
    assert response.status_code == 401
    assert response.json() == {'detail': 'Authentication Failed'}
    app.dependency_overrides[get_current_user] = override_get_current_user


def test_admin_delete_test_result(test_test_result):
    response = client.delete("/admin/test-results/1")
    assert response.status_code == 204

    db = TestingSessionLocal()
    model = db.query(TestResults).filter(TestResults.id == 1).first()
    assert model is None


def test_admin_delete_test_result_not_found():
    response = client.delete("/admin/test-results/9999")
    assert response.status_code == 404
    assert response.json() == {'detail': 'Test result not found.'}


def test_admin_create_user():
    request_data = {
        'username': 'luke', 'email': 'luke@rebellion.gov', 'first_name': 'Luke',
        'last_name': 'Skywalker', 'password': 'testpassword', 'role': 'user',
        'phone_number': '(222)-222-2222'
    }
    response = client.post('/admin/user', json=request_data)
    assert response.status_code == 201

    db = TestingSessionLocal()
    model = db.query(Users).filter(Users.username == 'luke').first()
    assert model is not None
    assert model.email == 'luke@rebellion.gov'
    assert model.role == 'user'
    db.delete(model)
    db.commit()


def test_admin_create_user_forbidden_for_non_admin():
    app.dependency_overrides[get_current_user] = lambda: {'username': 'luke', 'id': 2, 'user_role': 'user'}
    request_data = {
        'username': 'luke', 'email': 'luke@rebellion.gov', 'first_name': 'Luke',
        'last_name': 'Skywalker', 'password': 'testpassword', 'role': 'user',
        'phone_number': '(222)-222-2222'
    }
    response = client.post('/admin/user', json=request_data)
    assert response.status_code == 401
    assert response.json() == {'detail': 'Authentication Failed'}
    app.dependency_overrides[get_current_user] = override_get_current_user
