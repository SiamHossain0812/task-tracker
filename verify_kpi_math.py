import requests
import json
import uuid
import sys
from datetime import date, timedelta

BASE_URL = 'http://localhost:8000/api/v1'
USERNAME = '01746329922' 
PASSWORD = '1ceforall'

def main():
    session = requests.Session()
    
    print("1. Logging in...")
    login_data = {'username': USERNAME, 'password': PASSWORD}
    response = session.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
        
    res_data = response.json()
    access_token = res_data.get('tokens', {}).get('access')
    user_id = res_data.get('user', {}).get('id')
    collab_id = res_data.get('user', {}).get('collaborator_id')
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print(f"Logged in. Collab ID: {collab_id}")
    
    # 2. Get first project
    print("\n2. Fetching accessible projects...")
    proj_resp = session.get(f"{BASE_URL}/projects/", headers=headers)
    projects = proj_resp.json()
    if not projects:
        print("No projects found for this user.")
        return
    project_id = projects[0]['id']
    print(f"Using Project: {projects[0]['name']} (ID: {project_id})")

    # 3. Create a task
    print("\n3. Creating a test task...")
    task_data = {
        "title": f"KPI Verification Task {uuid.uuid4().hex[:6]}",
        "description": "Auto-generated task for verification",
        "project": project_id,
        "date": str(date.today()),
        "time": "12:00:00",
        "priority": "medium",
        "estimated_hours": 5.0,
        "type": "task",
        "collaborator_ids": [collab_id]
    }
    create_resp = session.post(f"{BASE_URL}/agendas/", json=task_data, headers=headers)
    if create_resp.status_code != 201:
        print(f"Task creation failed: {create_resp.text}")
        return
    task = create_resp.json()
    task_id = task['id']
    print(f"Task created: {task['title']} (ID: {task_id})")

    # 4. Accept the task
    print("\n4. Accepting the task...")
    accept_resp = session.post(f"{BASE_URL}/agendas/{task_id}/accept/", headers=headers)
    if accept_resp.status_code == 200:
        print("Task accepted.")
    else:
        print(f"Failed to accept task: {accept_resp.text}")
        return

    # 5. Log hours (Efficiency test)
    print("\n5. Marking task as completed with quality metrics...")
    # Based on the implementation, toggle_status (url_path='toggle') accepts quality_scores dict
    complete_data = {
        "quality_scores": {
            str(collab_id): 5
        }
    }
    
    # We need to hit 'toggle' twice or set status through some other means?
    # toggle_status cycles: pending -> in-progress -> completed
    print("Cycling status to in-progress...")
    session.post(f"{BASE_URL}/agendas/{task_id}/toggle/", json={}, headers=headers)
    
    print("Cycling status to completed with scores...")
    complete_resp = session.post(f"{BASE_URL}/agendas/{task_id}/toggle/", json=complete_data, headers=headers)

    if complete_resp.status_code in [200, 201]:
        print("Task marked completed successfully.")
    else:
        print(f"Failed to complete task: {complete_resp.status_code} {complete_resp.text}")
        return

    # 6. Verify Performance Dashboard
    print("\n6. Fetching updated performance metrics...")
    perf_resp = session.get(f"{BASE_URL}/collaborators/{collab_id}/performance/", headers=headers)
    if perf_resp.status_code == 200:
        perf = perf_resp.json()
        print("--- PERFORMANCE RESULTS ---")
        print(json.dumps(perf, indent=2))
        if perf.get('total_completed_tasks', 0) > 0:
            print("\nSUCCESS: Dashboard updated correctly!")
        else:
            print("\nWARNING: Dashboard still shows 0 completed tasks.")
    else:
        print(f"Failed to fetch performance: {perf_resp.text}")

if __name__ == '__main__':
    main()
