import sys
import subprocess
import tempfile
import time
import json
import os
from typing import Dict, Any, List

def execute_python_code(code: str, test_cases: List[Dict[str, Any]], starter_function: str = "") -> Dict[str, Any]:
    """
    Safely executes Python user code against provided test cases in a subprocess.
    """
    total_cases = len(test_cases)
    passed_cases = 0
    test_results = []
    start_all = time.time()
    
    # Python executable from current venv
    py_bin = sys.executable

    for idx, tc in enumerate(test_cases):
        input_data = tc.get("input", "")
        expected_output = str(tc.get("expected_output", "")).strip()
        is_hidden = tc.get("hidden", False)

        # Create a test harness runner script
        harness = f"""
import sys
import json
import math
import collections
import heapq
import itertools

# User Code
{code}

# Test Execution Harness
try:
    test_input = {repr(input_data)}
    if '{starter_function}' and '{starter_function}' in globals():
        fn = globals()['{starter_function}']
        if isinstance(test_input, dict):
            res = fn(**test_input)
        elif isinstance(test_input, (list, tuple)):
            res = fn(*test_input)
        else:
            res = fn(test_input)
        if isinstance(res, (dict, list, bool)):
            print(json.dumps(res))
        else:
            print(res)
    else:
        # Code might execute directly and print
        pass
except Exception as e:
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
"""

        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tf:
            tf.write(harness)
            tf_path = tf.name

        try:
            start_t = time.time()
            proc = subprocess.run(
                [py_bin, tf_path],
                capture_output=True,
                text=True,
                timeout=3.5
            )
            runtime_ms = int((time.time() - start_t) * 1000)
            
            stdout = proc.stdout.strip()
            stderr = proc.stderr.strip()

            if proc.returncode != 0:
                test_results.append({
                    "test_case": idx + 1,
                    "status": "Runtime Error",
                    "runtime_ms": runtime_ms,
                    "input": "[Hidden]" if is_hidden else input_data,
                    "expected": "[Hidden]" if is_hidden else expected_output,
                    "actual": stderr.split("\n")[-1] if stderr else "Execution error",
                    "error": stderr
                })
            else:
                # Compare output with expected
                # Normalize json or string comparison
                is_match = False
                if stdout == expected_output:
                    is_match = True
                else:
                    try:
                        # Attempt json comparison
                        if json.loads(stdout) == json.loads(expected_output):
                            is_match = True
                    except Exception:
                        if stdout.lower() == expected_output.lower():
                            is_match = True

                if is_match:
                    passed_cases += 1
                    test_results.append({
                        "test_case": idx + 1,
                        "status": "Passed",
                        "runtime_ms": runtime_ms,
                        "input": "[Hidden]" if is_hidden else input_data,
                        "expected": "[Hidden]" if is_hidden else expected_output,
                        "actual": "[Hidden]" if is_hidden else stdout
                    })
                else:
                    test_results.append({
                        "test_case": idx + 1,
                        "status": "Wrong Answer",
                        "runtime_ms": runtime_ms,
                        "input": "[Hidden]" if is_hidden else input_data,
                        "expected": "[Hidden]" if is_hidden else expected_output,
                        "actual": "[Hidden]" if is_hidden else stdout
                    })

        except subprocess.TimeoutExpired:
            test_results.append({
                "test_case": idx + 1,
                "status": "Time Limit Exceeded",
                "runtime_ms": 3500,
                "input": "[Hidden]" if is_hidden else input_data,
                "expected": "[Hidden]" if is_hidden else expected_output,
                "actual": "Time Limit Exceeded (>3.0s)"
            })
        finally:
            if os.path.exists(tf_path):
                try:
                    os.remove(tf_path)
                except Exception:
                    pass

    total_runtime_ms = int((time.time() - start_all) * 1000)

    # Determine overall status
    if passed_cases == total_cases:
        overall_status = "Accepted"
    elif any(r["status"] == "Time Limit Exceeded" for r in test_results):
        overall_status = "Time Limit Exceeded"
    elif any(r["status"] == "Runtime Error" for r in test_results):
        overall_status = "Runtime Error"
    else:
        overall_status = "Wrong Answer"

    return {
        "status": overall_status,
        "test_cases_passed": passed_cases,
        "total_test_cases": total_cases,
        "runtime_ms": total_runtime_ms,
        "results": test_results
    }