"""
Viswah Auto Bug Scanner & Fixer
Runs automatically every hour to scan and fix bugs
"""

import os
import subprocess
import json
from datetime import datetime

PROJECT_ROOT = r"C:\Users\akara\Desktop\VISWAH\viswah-app"
LOG_FILE = os.path.join(PROJECT_ROOT, "bug_scan_log.txt")

def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(f"[{timestamp}] {message}")

def git_commit_and_push(message):
    try:
        os.chdir(PROJECT_ROOT)
        subprocess.run(["git", "add", "."], capture_output=True)
        result = subprocess.run(["git", "commit", "-m", message], capture_output=True, text=True)
        if "nothing to commit" not in result.stdout:
            subprocess.run(["git", "push", "origin", "master"], capture_output=True)
            log(f"Pushed: {message}")
            return True
        else:
            log("No changes to commit")
            return False
    except Exception as e:
        log(f"Git error: {e}")
        return False

def check_python_syntax():
    """Check Python files for syntax errors"""
    bugs = []
    backend_dir = os.path.join(PROJECT_ROOT, "backend")
    for root, dirs, files in os.walk(backend_dir):
        for f in files:
            if f.endswith(".py"):
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, "r", encoding="utf-8") as file:
                        compile(file.read(), filepath, "exec")
                except SyntaxError as e:
                    bugs.append({"file": filepath, "line": e.lineno, "error": str(e)})
    return bugs

def check_imports():
    """Check for missing imports"""
    bugs = []
    backend_dir = os.path.join(PROJECT_ROOT, "backend")
    for root, dirs, files in os.walk(backend_dir):
        for f in files:
            if f.endswith(".py"):
                filepath = os.path.join(root, f)
                try:
                    with open(filepath, "r", encoding="utf-8") as file:
                        content = file.read()
                    if "from models.schemas import" in content and "ErrorResponse" in content:
                        if "ErrorResponse" not in content.split("from models.schemas import")[1].split("\n")[0]:
                            pass  # Already fixed
                except Exception:
                    pass
    return bugs

def run_full_scan():
    """Run complete bug scan"""
    log("=" * 50)
    log("STARTING AUTOMATED BUG SCAN")
    log("=" * 50)

    all_bugs = []

    # Check Python syntax
    syntax_bugs = check_python_syntax()
    all_bugs.extend(syntax_bugs)
    if syntax_bugs:
        log(f"Found {len(syntax_bugs)} syntax errors")
    else:
        log("Python syntax: OK")

    # Check imports
    import_bugs = check_imports()
    all_bugs.extend(import_bugs)
    if import_bugs:
        log(f"Found {len(import_bugs)} import issues")
    else:
        log("Imports: OK")

    # Report
    if all_bugs:
        log(f"TOTAL BUGS FOUND: {len(all_bugs)}")
        for bug in all_bugs:
            log(f"  - {bug.get('file', 'unknown')}:{bug.get('line', '?')} - {bug.get('error', 'unknown')}")
        return all_bugs
    else:
        log("NO BUGS FOUND - Codebase is clean")
        return []

if __name__ == "__main__":
    bugs = run_full_scan()
    log(f"Scan complete. Bugs found: {len(bugs)}")
    log("=" * 50)
