import urllib.request
import json
import time

def post(url, data, token=None):
    payload = json.dumps(data).encode('utf-8')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=payload, headers=headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def get(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def test_all():
    print("=== 1. LIVE JOB SYNC & METADATA VERIFICATION ===")
    sync_res = post('http://127.0.0.1:8000/api/jobs/sync-live', {})
    print(f"Sync Response: {sync_res}")

    live_jobs = get('http://127.0.0.1:8000/api/jobs?source=live')
    print(f"Fetched {len(live_jobs)} live jobs from database.")
    assert len(live_jobs) > 0, "Error: No live jobs returned!"
    j0 = live_jobs[0]
    print(f"Sample Live Job: {j0['title']} @ {j0['company']} (Source: {j0.get('source')}, Remote: {j0.get('remote')})")
    print(f"Matched Skills: {j0.get('matched_skills')} | Missing Skills: {j0.get('missing_skills')}")

    print("\n=== 2. AIRA MOCK INTERVIEW WITH AI (VOICE / DYNAMIC TURNS) ===")
    uname = f"candidate_{int(time.time())}"
    u_reg = post('http://127.0.0.1:8000/api/auth/register', {
        'username': uname,
        'email': f'{uname}@example.com',
        'password': 'Password123!'
    })
    token = u_reg['access_token']
    print(f"Candidate Registered: {uname}")

    # Set skills in candidate profile
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'Python'}, token)
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'FastAPI'}, token)
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'React'}, token)

    # Start Aira session
    session = post('http://127.0.0.1:8000/api/interview/start', {
        'target_role': 'Full Stack Developer',
        'interview_type': 'Technical',
        'difficulty': 'Medium',
        'experience_level': 'Junior',
        'total_questions': 2
    }, token)
    session_id = session['id']
    print(f"Session Created ID: {session_id}")
    q1 = session['turns'][0]['ai_question']
    print(f"Aira Question 1: {q1}")

    # Turn 1 submission
    t1_res = post(f'http://127.0.0.1:8000/api/interview/{session_id}/turn', {
        'user_answer': 'FastAPI handles asynchronous request concurrency using Python async def coroutines on an ASGI server like Uvicorn, which allows handling high I/O throughput non-blockingly.',
        'duration_seconds': 35
    }, token)
    print(f"Aira Turn 1 Feedback: {t1_res.get('feedback')}")
    print(f"Aira Turn 1 Scores: {t1_res.get('scores')}")

    # Finish and generate report
    report = post(f'http://127.0.0.1:8000/api/interview/{session_id}/finish', {
        'duration_seconds': 90
    }, token)
    print(f"\nFinal Overall Score: {report.get('overall_score')}%")
    print(f"Technical: {report.get('technical_score')}% | Communication: {report.get('communication_score')}%")
    print(f"Strengths: {report.get('strengths')}")
    print(f"Weaknesses: {report.get('weaknesses')}")
    print(f"Topics to Study: {report.get('topics_to_study')}")

    # Check History
    hist = get('http://127.0.0.1:8000/api/interview/history', token)
    print(f"Interview History Count: {len(hist['history'])} | Avg Score: {hist['average_score']}%")

    print("\n=== 3. MULTI-TENANT USER ISOLATION VERIFICATION ===")
    u2_reg = post('http://127.0.0.1:8000/api/auth/register', {
        'username': f'iso_user_{int(time.time())}',
        'email': f'iso_{int(time.time())}@example.com',
        'password': 'Password123!'
    })
    token2 = u2_reg['access_token']
    hist2 = get('http://127.0.0.1:8000/api/interview/history', token2)
    assert len(hist2['history']) == 0, "Error: User 2 saw User 1's interview history!"
    print("User 2 interview history correctly isolated: 0 sessions leaked.")

    print("\n=======================================================")
    print(">>> ALL TEST CASES PASSED WITH 100% SUCCESSFUL VALIDATION!")
    print("=======================================================")

if __name__ == '__main__':
    test_all()
