import requests
import json
import sys

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
        sys.exit(1)
        
    tokens = response.json()
    print("Login Response Layout:", tokens)
    access_token = tokens.get('tokens', {}).get('access')
    user_info = tokens.get('user', {})
    collab_id = user_info.get('collaborator_id')
    
    print(f"Logged in successfully. Collaborator ID: {collab_id}")
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    print("\n2. Finding a task or creating a new one... (Skipping creation for simplicity, let's just fetch performance)")
    
    print(f"\n3. Fetching Performance Dashboard Stats for Collaborator {collab_id}...")
    perf_response = session.get(f"{BASE_URL}/collaborators/{collab_id}/performance/", headers=headers)
    
    if perf_response.status_code == 200:
        print("Performance Data Retrieved:")
        print(json.dumps(perf_response.json(), indent=2))
    else:
        print(f"Failed to fetch performance: Status {perf_response.status_code}")
        print(perf_response.text)

if __name__ == '__main__':
    main()
