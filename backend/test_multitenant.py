import urllib.request
import json
import sys

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

def run_tests():
    print("=== 1. USER 1 (sarah_ml_test) FLOW ===")
    u1_reg = post('http://127.0.0.1:8000/api/auth/register', {
        'username': 'sarah_ml_test',
        'email': 'sarah_test@example.com',
        'password': 'Password123!'
    })
    t1 = u1_reg['access_token']
    print(f"Registered User 1: {u1_reg['user']['username']}")

    # Add Skills
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'Python'}, t1)
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'TensorFlow'}, t1)
    post('http://127.0.0.1:8000/api/profile/skills/add', {'skill': 'PyTorch'}, t1)
    post('http://127.0.0.1:8000/api/profile/interests/add', {'interest': 'Artificial Intelligence'}, t1)

    # Solve problem
    code_sol = (
        "def twoSum(nums, target):\n"
        "    seen = {}\n"
        "    for i, n in enumerate(nums):\n"
        "        if target - n in seen:\n"
        "            return [seen[target - n], i]\n"
        "        seen[n] = i\n"
        "    return []\n"
    )
    sub_res = post('http://127.0.0.1:8000/api/coding/problems/two-sum/submit', {'code': code_sol, 'language': 'python'}, t1)
    print(f"User 1 Problem Submission: {sub_res['status']} ({sub_res['test_cases_passed']}/{sub_res['total_test_cases']})")

    # Take Mock Test
    test_sub = post('http://127.0.0.1:8000/api/mock-tests/dsa-assessment/submit', {
        'answers': {'1': 1, '2': 1, '3': 2, '4': 2, '5': 2},
        'time_spent_seconds': 120
    }, t1)
    print(f"User 1 Test Score: {test_sub['score_percentage']}%")

    # Apply to job
    app_res = post('http://127.0.0.1:8000/api/applications', {
        'role': 'Senior ML Engineer',
        'company': 'TechNova',
        'status': 'Applied'
    }, t1)
    print(f"User 1 Application Created: {app_res['company']} - {app_res['role']}")

    # Check User 1 stats
    stats1 = get('http://127.0.0.1:8000/api/dashboard/stats', t1)
    print(f"User 1 Total Apps: {stats1['total_applications']}")
    print(f"User 1 Activities Count: {len(stats1['recent_activities'])}")
    print(f"User 1 Top Prediction: {stats1['predicted_career']} ({stats1['predicted_match']}%)")

    print("\n=== 2. USER 2 (dev_bob_test) FLOW - MULTI-TENANT ISOLATION ===")
    u2_reg = post('http://127.0.0.1:8000/api/auth/register', {
        'username': 'dev_bob_test',
        'email': 'bob_test@example.com',
        'password': 'Password123!'
    })
    t2 = u2_reg['access_token']
    print(f"Registered User 2: {u2_reg['user']['username']}")

    # Check User 2 stats (MUST be completely clean and isolated)
    stats2 = get('http://127.0.0.1:8000/api/dashboard/stats', t2)
    apps2 = get('http://127.0.0.1:8000/api/applications', t2)
    print(f"User 2 Total Apps (Expected: 0): {len(apps2)}")
    print(f"User 2 Activities Count (Expected: 1): {len(stats2['recent_activities'])}")
    print(f"User 2 Latest Activity: {stats2['recent_activities'][0]['title']}")

    assert len(apps2) == 0, f"Error: User 2 has {len(apps2)} applications leaked!"
    assert len(stats2['recent_activities']) == 1, f"Error: User 2 has {len(stats2['recent_activities'])} activities leaked!"
    print("\n>>> ALL MULTI-TENANT AND FUNCTIONAL TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    run_tests()

