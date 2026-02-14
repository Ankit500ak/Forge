#!/usr/bin/env python3

"""
Comprehensive Testing Suite for Food Detection System
Tests all components: Frontend, Backend API, and ML Model
"""

import requests
import json
import base64
import time
from pathlib import Path
from typing import Dict, Any

# ────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ────────────────────────────────────────────────────────────────────

API_BASE_URL = "http://localhost:3001/api"
CAMERA_ENDPOINT = f"{API_BASE_URL}/camera"
FOOD_ENDPOINT = f"{API_BASE_URL}/food"

# Test image paths (you'll need sample food images)
TEST_IMAGES_DIR = Path("./test-images")

class Colors:
    """Terminal colors for output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_test(name: str):
    """Print test name"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}TEST: {name}{Colors.ENDC}")
    print("─" * 60)

def print_pass(message: str):
    """Print passing test"""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_fail(message: str):
    """Print failing test"""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

def print_result(data: Dict[str, Any]):
    """Pretty print JSON result"""
    print(json.dumps(data, indent=2))

# ────────────────────────────────────────────────────────────────────
# CAMERA ENDPOINT TESTS
# ────────────────────────────────────────────────────────────────────

def test_camera_health_check():
    """Test camera health check endpoint"""
    print_test("Camera Health Check")
    
    try:
        response = requests.get(f"{CAMERA_ENDPOINT}/health-check")
        response.raise_for_status()
        
        data = response.json()
        print_result(data)
        
        if data.get("status") == "healthy":
            print_pass("Camera service is healthy")
            return True
        else:
            print_fail(f"Camera service unhealthy: {data.get('status')}")
            return False
            
    except Exception as e:
        print_fail(f"Health check failed: {e}")
        return False

def test_camera_settings():
    """Test camera settings endpoint"""
    print_test("Get Camera Settings")
    
    params = {
        "useCase": "food",
        "deviceType": "mobile"
    }
    
    try:
        response = requests.get(f"{CAMERA_ENDPOINT}/settings", params=params)
        response.raise_for_status()
        
        data = response.json()
        print_result(data)
        
        if "settings" in data and "recommendations" in data:
            print_pass("Camera settings retrieved successfully")
            return True
        else:
            print_fail("Missing settings or recommendations in response")
            return False
            
    except Exception as e:
        print_fail(f"Failed to get settings: {e}")
        return False

def test_camera_capture_with_file():
    """Test camera capture with file upload"""
    print_test("Camera Capture with File Upload")
    
    # Create a test image if needed
    test_image_path = TEST_IMAGES_DIR / "paneer-butter-chicken.jpg"
    
    if not test_image_path.exists():
        print_fail(f"Test image not found: {test_image_path}")
        print_info(f"Create test images in: {TEST_IMAGES_DIR}")
        return False
    
    try:
        with open(test_image_path, 'rb') as f:
            files = {
                'image': ('food.jpg', f, 'image/jpeg')
            }
            data = {
                'autoDetect': 'true',
                'confidenceThreshold': '0.3'
            }
            
            response = requests.post(
                f"{CAMERA_ENDPOINT}/capture",
                files=files,
                data=data
            )
            response.raise_for_status()
        
        result = response.json()
        print_result(result)
        
        if result.get("status") == "success" and result.get("capture"):
            print_pass("File capture successful")
            return True
        else:
            print_fail(f"Capture failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_fail(f"File capture test failed: {e}")
        return False

def test_camera_process_base64():
    """Test camera process with base64 image"""
    print_test("Camera Process with Base64 Image")
    
    test_image_path = TEST_IMAGES_DIR / "naan-bread.jpg"
    
    if not test_image_path.exists():
        print_fail(f"Test image not found: {test_image_path}")
        return False
    
    try:
        # Read and encode image
        with open(test_image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        payload = {
            'image_base64': f'data:image/jpeg;base64,{image_data}',
            'autoDetect': True,
            'confidenceThreshold': 0.3
        }
        
        response = requests.post(
            f"{CAMERA_ENDPOINT}/process",
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        print_result(result)
        
        if result.get("status") == "success":
            print_pass("Base64 processing successful")
            return True
        else:
            print_fail(f"Processing failed: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print_fail(f"Base64 processing test failed: {e}")
        return False

def test_get_captures():
    """Test getting list of captures"""
    print_test("Get Captures List")
    
    params = {
        "page": 1,
        "limit": 10,
        "sortBy": "timestamp",
        "order": "desc"
    }
    
    try:
        response = requests.get(
            f"{CAMERA_ENDPOINT}/captures",
            params=params
        )
        response.raise_for_status()
        
        data = response.json()
        print_result(data)
        
        if "captures" in data and "pagination" in data:
            print_pass(f"Retrieved {len(data.get('captures', []))} captures")
            return True
        else:
            print_fail("Missing captures or pagination in response")
            return False
            
    except Exception as e:
        print_fail(f"Failed to get captures: {e}")
        return False

# ────────────────────────────────────────────────────────────────────
# FOOD DETECTION ENDPOINT TESTS
# ────────────────────────────────────────────────────────────────────

def test_food_detection():
    """Test food detection endpoint"""
    print_test("Direct Food Detection")
    
    test_image_path = TEST_IMAGES_DIR / "biryani.jpg"
    
    if not test_image_path.exists():
        print_fail(f"Test image not found: {test_image_path}")
        return False
    
    try:
        with open(test_image_path, 'rb') as f:
            files = {'image': ('food.jpg', f, 'image/jpeg')}
            params = {'confidenceThreshold': 0.3}
            
            response = requests.post(
                f"{FOOD_ENDPOINT}/detect",
                files=files,
                params=params
            )
            response.raise_for_status()
        
        result = response.json()
        print_result(result)
        
        if result.get("detected_food"):
            print_pass(f"Detected: {result['detected_food']}")
            return True
        else:
            print_fail("No food detected")
            return False
            
    except Exception as e:
        print_fail(f"Detection test failed: {e}")
        return False

def test_get_all_foods():
    """Test getting all available foods"""
    print_test("Get All Foods")
    
    try:
        response = requests.get(f"{FOOD_ENDPOINT}/foods")
        response.raise_for_status()
        
        data = response.json()
        foods = data.get("foods", [])
        
        print_info(f"Available foods: {len(foods)}")
        for food in foods[:5]:
            print_info(f"  - {food.get('name', 'Unknown')}")
        if len(foods) > 5:
            print_info(f"  ... and {len(foods) - 5} more")
        
        if foods:
            print_pass(f"Retrieved {len(foods)} foods")
            return True
        else:
            print_fail("No foods found")
            return False
            
    except Exception as e:
        print_fail(f"Failed to get foods: {e}")
        return False

def test_nutrition_lookup():
    """Test nutrition lookup"""
    print_test("Nutrition Lookup")
    
    params = {
        "foodName": "Butter Chicken",
        "servingSize": "200g"
    }
    
    try:
        response = requests.get(
            f"{FOOD_ENDPOINT}/nutrition",
            params=params
        )
        response.raise_for_status()
        
        data = response.json()
        print_result(data)
        
        if data.get("nutrition"):
            print_pass("Nutrition data retrieved")
            return True
        else:
            print_fail("No nutrition data found")
            return False
            
    except Exception as e:
        print_fail(f"Nutrition lookup failed: {e}")
        return False

def test_meal_analysis():
    """Test meal analysis"""
    print_test("Meal Analysis")
    
    payload = {
        "foods": [
            {"name": "Rice", "amount": "1 cup"},
            {"name": "Butter Chicken", "amount": "200g"},
            {"name": "Naan", "amount": "1 piece"}
        ]
    }
    
    try:
        response = requests.post(
            f"{FOOD_ENDPOINT}/analyze-meal",
            json=payload
        )
        response.raise_for_status()
        
        data = response.json()
        print_result(data)
        
        if data.get("totals") or data.get("analysis"):
            print_pass("Meal analysis complete")
            return True
        else:
            print_fail("Analysis failed")
            return False
            
    except Exception as e:
        print_fail(f"Meal analysis test failed: {e}")
        return False

def test_search_foods():
    """Test food search"""
    print_test("Search Foods")
    
    params = {
        "query": "paneer",
        "limit": 10
    }
    
    try:
        response = requests.get(
            f"{FOOD_ENDPOINT}/search",
            params=params
        )
        response.raise_for_status()
        
        data = response.json()
        results = data.get("results", [])
        
        print_info(f"Found {len(results)} results")
        for result in results[:3]:
            print_info(f"  - {result.get('name', 'Unknown')}")
        
        if results:
            print_pass("Search successful")
            return True
        else:
            print_fail("No results found")
            return False
            
    except Exception as e:
        print_fail(f"Search test failed: {e}")
        return False

# ────────────────────────────────────────────────────────────────────
# PERFORMANCE & STRESS TESTS
# ────────────────────────────────────────────────────────────────────

def test_concurrent_requests():
    """Test multiple concurrent requests"""
    print_test("Concurrent Requests (5 simultaneous)")
    
    import concurrent.futures
    
    def make_request():
        try:
            response = requests.get(
                f"{CAMERA_ENDPOINT}/health-check",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            start = time.time()
            results = list(executor.map(make_request, range(5)))
            elapsed = time.time() - start
        
        passed = sum(results)
        print_info(f"Passed: {passed}/5 requests in {elapsed:.2f}s")
        
        if passed == 5:
            print_pass("All concurrent requests successful")
            return True
        else:
            print_fail(f"Only {passed}/5 requests succeeded")
            return False
            
    except Exception as e:
        print_fail(f"Concurrent test failed: {e}")
        return False

def test_response_times():
    """Measure response times"""
    print_test("Response Time Measurement")
    
    endpoints = [
        (f"{CAMERA_ENDPOINT}/health-check", "GET"),
        (f"{FOOD_ENDPOINT}/foods", "GET"),
    ]
    
    times = {}
    try:
        for endpoint, method in endpoints:
            start = time.time()
            response = requests.get(endpoint, timeout=10)
            elapsed = (time.time() - start) * 1000  # Convert to ms
            
            times[endpoint] = (elapsed, response.status_code)
            print_info(f"{method} {endpoint}: {elapsed:.2f}ms")
        
        avg_time = sum(t[0] for t in times.values()) / len(times)
        print_info(f"Average response time: {avg_time:.2f}ms")
        
        if avg_time < 1000:  # Less than 1 second
            print_pass("Response times are acceptable")
            return True
        else:
            print_fail("Response times are slow")
            return False
            
    except Exception as e:
        print_fail(f"Response time test failed: {e}")
        return False

# ────────────────────────────────────────────────────────────────────
# MAIN TEST SUITE
# ────────────────────────────────────────────────────────────────────

def run_all_tests():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║     FOOD DETECTION SYSTEM - COMPREHENSIVE TEST SUITE          ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    
    print(f"\n{Colors.BOLD}Connecting to API: {API_BASE_URL}{Colors.ENDC}")
    
    # Verify server is running
    try:
        response = requests.get(f"{CAMERA_ENDPOINT}/health-check", timeout=2)
        print_pass("API server is running")
    except:
        print_fail("API server is not running!")
        print_info("Start the server with: npm start")
        return False
    
    results = {}
    
    # Camera Tests
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}═ CAMERA ENDPOINT TESTS ═{Colors.ENDC}")
    results["Health Check"] = test_camera_health_check()
    results["Settings"] = test_camera_settings()
    results["Capture (File)"] = test_camera_capture_with_file()
    results["Process (Base64)"] = test_camera_process_base64()
    results["Get Captures"] = test_get_captures()
    
    # Food Tests
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}═ FOOD DETECTION TESTS ═{Colors.ENDC}")
    results["Detection"] = test_food_detection()
    results["All Foods"] = test_get_all_foods()
    results["Nutrition"] = test_nutrition_lookup()
    results["Meal Analysis"] = test_meal_analysis()
    results["Search"] = test_search_foods()
    
    # Performance Tests
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}═ PERFORMANCE TESTS ═{Colors.ENDC}")
    results["Concurrent"] = test_concurrent_requests()
    results["Response Times"] = test_response_times()
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                      TEST SUMMARY                              ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{Colors.OKGREEN}PASS{Colors.ENDC}" if result else f"{Colors.FAIL}FAIL{Colors.ENDC}"
        print(f"  {test_name}: {status}")
    
    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print(f"{Colors.OKGREEN}All tests passed! ✓{Colors.ENDC}\n")
        return True
    else:
        print(f"{Colors.FAIL}Some tests failed.{Colors.ENDC}\n")
        return False

if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
