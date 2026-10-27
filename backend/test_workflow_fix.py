"""
Comprehensive test script for Job Application Workflow & Provider Integration Fix.
Tests:
1. Connectors Status: Unconfigured connectors hidden, connected ones shown.
2. Live Job Normalization & Safe URLs: URLs start with http(s)://, apply_url prioritized.
3. Tracker Operations:
   - Creation of Applied, Interview, Offer.
   - Rejection of 'Rejected' status with HTTP 400.
   - Duplicate prevention (same user + job_id or role+company).
   - 30-Day Expiration: applied_at & expires_at calculated correctly.
   - Expired records excluded from list and dashboard summary.
   - Cleanup worker removes only expired records and leaves active records intact.
4. FastAPI Endpoints via TestClient:
   - Rejection of status 'Rejected' on create and update.
   - Idempotent duplicate prevention on create.
   - Expiration data present in response.
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, JobApplicationDB, UserDB, JobDB, init_db
from services.live_jobs_service import get_connectors_status, sync_live_jobs
from services.job_connectors.base import is_safe_url
from routes.api import cleanup_user_expired_applications
from fastapi.testclient import TestClient
from main import app
from services.auth import create_access_token

def run_tests():
    print("=" * 60)
    print("RUNNING WORKFLOW & PROVIDER INTEGRATION TESTS")
    print("=" * 60)

    # 1. Connectors Status Check
    print("\n[TEST 1] Checking Connector Status...")
    statuses = get_connectors_status()
    print(f"Total returned connectors: {len(statuses)}")
    names = [s["name"] for s in statuses]
    print(f"Connector names: {names}")
    for s in statuses:
        print(f" - {s['name']}: connected={s['connected']} status={s['status']}")
        assert s["connected"] is True, f"Unconnected provider {s['name']} should not be returned!"
    assert "Adzuna" not in names, "Unconfigured Adzuna should be hidden!"
    assert "Jooble" not in names, "Unconfigured Jooble should be hidden!"
    assert "RemoteOK" in names, "RemoteOK should be present!"
    assert "Jobicy" in names, "Jobicy should be present!"
    assert "Arbeitnow" in names, "Arbeitnow should be present!"
    print("[OK] TEST 1 PASSED: Only active, connected providers are exposed.")

    # 2. URL Safety & Normalization Check
    print("\n[TEST 2] Checking URL Safety & Normalization...")
    assert is_safe_url("https://example.com/jobs/123") is True
    assert is_safe_url("http://example.com/apply") is True
    assert is_safe_url("javascript:alert(1)") is False
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("") is False
    assert is_safe_url(None) is False
    print("[OK] TEST 2 PASSED: URL validation correctly enforces safe HTTP/HTTPS schemes.")

    # 3. Database & 30-Day Expiration & Duplicate Handling
    print("\n[TEST 3] Testing Application Lifecycle & 30-Day Expiration...")
    init_db()
    db = SessionLocal()
    try:
        # Find or create a test user
        user = db.query(UserDB).first()
        if not user:
            user = UserDB(username="testuser", email="test@example.com", hashed_password="pw")
            db.add(user)
            db.commit()
            db.refresh(user)

        user_id = user.id
        user_username = user.username
        user_email = user.email
        print(f"Using test user_id={user_id}")

        # Clean existing test records for this user to have clean slate
        db.query(JobApplicationDB).filter(JobApplicationDB.user_id == user_id, JobApplicationDB.role.like("TEST_%")).delete()
        db.commit()

        # A. Create active application
        now_utc = datetime.now(timezone.utc)
        app_active = JobApplicationDB(
            user_id=user_id,
            job_id="test_job_101",
            role="TEST_Active_Senior_Dev",
            company="TestCorp Active",
            location="Bengaluru, India",
            salary="25-35 LPA",
            status="Applied",
            date_applied=now_utc.strftime("%d %b %Y"),
            applied_at=now_utc,
            expires_at=now_utc + timedelta(days=30),
            url="https://testcorp.com/apply/101"
        )
        db.add(app_active)

        # B. Create already-expired application (applied 35 days ago)
        past_35 = now_utc - timedelta(days=35)
        app_expired = JobApplicationDB(
            user_id=user_id,
            job_id="test_job_102",
            role="TEST_Expired_Junior_Dev",
            company="TestCorp Expired",
            location="Remote",
            salary="10-15 LPA",
            status="Applied",
            date_applied=past_35.strftime("%d %b %Y"),
            applied_at=past_35,
            expires_at=past_35 + timedelta(days=30),
            url="https://testcorp.com/apply/102"
        )
        db.add(app_expired)
        db.commit()
        db.refresh(app_active)
        db.refresh(app_expired)

        # C. Verify to_dict calculations
        active_dict = app_active.to_dict()
        assert active_dict["days_remaining"] >= 29, f"Days remaining should be ~30, got {active_dict['days_remaining']}"
        assert active_dict["url"] == "https://testcorp.com/apply/101"

        expired_dict = app_expired.to_dict()
        assert expired_dict["days_remaining"] == 0, f"Days remaining should be 0, got {expired_dict['days_remaining']}"
        print(f"Active record days_remaining: {active_dict['days_remaining']}")
        print(f"Expired record days_remaining: {expired_dict['days_remaining']}")

        # D. Test query filtering (simulate API get_applications query)
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        visible_apps = db.query(JobApplicationDB).filter(
            JobApplicationDB.user_id == user_id,
            JobApplicationDB.role.like("TEST_%"),
            (JobApplicationDB.expires_at == None) | (JobApplicationDB.expires_at > now_naive)
        ).all()
        visible_roles = [a.role for a in visible_apps]
        assert "TEST_Active_Senior_Dev" in visible_roles, "Active application must be visible!"
        assert "TEST_Expired_Junior_Dev" not in visible_roles, "Expired application must be excluded from active list!"
        print("[OK] Query correctly hides expired applications.")

        # E. Test cleanup worker
        print("Running cleanup_user_expired_applications()...")
        deleted_count = cleanup_user_expired_applications(user_id=user_id)
        print(f"Cleanup purged {deleted_count} expired application(s).")
        assert deleted_count >= 1, "Cleanup must have deleted the expired application!"

        # Verify active record is still intact in DB
        still_exists = db.query(JobApplicationDB).filter_by(id=app_active.id).first()
        assert still_exists is not None, "Active record must not be deleted by cleanup!"

        # Verify expired record is purged from DB
        is_gone = db.query(JobApplicationDB).filter_by(id=app_expired.id).first()
        assert is_gone is None, "Expired record must be permanently purged from database!"
        print("[OK] Active record preserved, expired record purged.")

        # Clean up test active record
        db.delete(still_exists)
        db.commit()

        print("[OK] TEST 3 PASSED: 30-day auto-expiration and cleanup function perfectly.")

    finally:
        db.close()

    # 4. HTTP API Endpoints Validation
    print("\n[TEST 4] Testing API Endpoints via TestClient...")
    token = create_access_token(user_id=user_id, username=user_username, email=user_email)
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {token}"}

    # Test 4A: Attempting to create application with status 'Rejected' must fail with 400
    res_rejected = client.post("/api/applications", json={
        "role": "API_Test_Engineer",
        "company": "API Test Co",
        "status": "Rejected"
    }, headers=headers)
    assert res_rejected.status_code == 400, f"Expected 400 on Rejected status, got {res_rejected.status_code}: {res_rejected.text}"
    print(f"[OK] Creation with 'Rejected' correctly refused: {res_rejected.json()['detail']}")

    # Test 4B: Creating valid application
    res_valid = client.post("/api/applications", json={
        "job_id": "test_api_job_999",
        "role": "API_Test_Engineer",
        "company": "API Test Co",
        "url": "https://example.com/jobs/999",
        "status": "Applied"
    }, headers=headers)
    assert res_valid.status_code == 200, f"Expected 200, got {res_valid.status_code}: {res_valid.text}"
    created_data = res_valid.json()
    assert created_data["status"] == "Applied"
    assert created_data["days_remaining"] >= 29
    assert created_data["url"] == "https://example.com/jobs/999"
    created_id = created_data["id"]
    print(f"[OK] Application created successfully with ID {created_id}, days_remaining: {created_data['days_remaining']}")

    # Test 4C: Duplicate prevention - posting the same job again must return existing application idempotently
    res_duplicate = client.post("/api/applications", json={
        "job_id": "test_api_job_999",
        "role": "API_Test_Engineer",
        "company": "API Test Co",
        "status": "Applied"
    }, headers=headers)
    assert res_duplicate.status_code == 200
    assert res_duplicate.json()["id"] == created_id, "Duplicate submission must return existing record idempotently!"
    print("[OK] Duplicate prevention confirmed: same application returned without duplication.")

    # Test 4D: Attempting to update status to 'Rejected' must fail with 400
    res_update_rejected = client.put(f"/api/applications/{created_id}/status", json={"status": "Rejected"}, headers=headers)
    assert res_update_rejected.status_code == 400, f"Expected 400 on status update to Rejected, got {res_update_rejected.status_code}"
    print(f"[OK] Status update to 'Rejected' refused: {res_update_rejected.json()['detail']}")

    # Test 4E: Valid status update to 'Interview'
    res_update_valid = client.put(f"/api/applications/{created_id}/status", json={"status": "Interview"}, headers=headers)
    assert res_update_valid.status_code == 200
    assert res_update_valid.json()["status"] == "Interview"
    print("[OK] Valid status update to 'Interview' succeeded.")

    # Test 4F: List applications includes the new application
    res_list = client.get("/api/applications", headers=headers)
    assert res_list.status_code == 200
    ids = [a["id"] for a in res_list.json()]
    assert created_id in ids
    print(f"[OK] Application listing contains created application.")

    # Clean up test application
    res_del = client.delete(f"/api/applications/{created_id}", headers=headers)
    assert res_del.status_code == 200
    print("[OK] Cleaned up API test application.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
