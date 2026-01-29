"""
IzzU Face Service v8.0 - Pure Dlib Security (Stable)
====================================================
Architecture:
- High-Stability: Removed MediaPipe dependency (broken on M-series)
- Recognition: dlib (ResNet Model) - 99.38% Accuracy
- Liveness: Dlib 68-Point Landmarks (Blink/Gaze/Pose)
- Storage: AES-256-GCM Encrypted Vectors
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import numpy as np
import cv2
import shutil
import os
import uuid
import face_recognition # Core engine (dlib)
from typing import Optional, List, Dict, Tuple
import math
import json
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("izzu-face-id")

app = FastAPI(title="IzzU Face Service", version="8.0 - Dlib Secure")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "secure_storage"
PHOTO_DIR = "login_photos"
KEY_FILE = "master.key"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PHOTO_DIR, exist_ok=True)

# Master Key
if not os.path.exists(KEY_FILE):
    key = AESGCM.generate_key(bit_length=256)
    with open(KEY_FILE, "wb") as f:
        f.write(key)
else:
    with open(KEY_FILE, "rb") as f:
        key = f.read()

aesgcm = AESGCM(key)

# Thresholds
MATCH_THRESHOLD = 0.48 
ANTI_SPOOF_VARIANCE_MIN = 35.0 
EAR_THRESHOLD = 0.21

# In-memory DB
# Disk-based DB
DB_FILE = os.path.join(UPLOAD_DIR, "face_index.json")

def load_db() -> Dict[str, str]:
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"DB Load Error: {e}")
        return {}

def save_db(db: Dict[str, str]):
    try:
        with open(DB_FILE, "w") as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        logger.error(f"DB Save Error: {e}")

face_db: Dict[str, str] = load_db()

def encrypt_data(data: dict) -> str:
    nonce = os.urandom(12)
    start_data = json.dumps(data).encode('utf-8')
    ciphertext = aesgcm.encrypt(nonce, start_data, None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_data(token: str) -> dict:
    try:
        raw = base64.b64decode(token)
        nonce = raw[:12]
        ciphertext = raw[12:]
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(plaintext.decode('utf-8'))
    except Exception:
        return None

def calculate_ear(eye_points):
    # Dlib landmarks: 6 points per eye
    # Vertical distances
    v1 = math.dist(eye_points[1], eye_points[5])
    v2 = math.dist(eye_points[2], eye_points[4])
    # Horizontal
    h = math.dist(eye_points[0], eye_points[3])
    return (v1 + v2) / (2.0 * h) if h > 0 else 0

def analyze_face_dlib_secure(image_path: str) -> dict:
    """
    Validate using Dlib 68-Point Landmarks
    """
    result = { "valid": False, "error": None }
    
    img = face_recognition.load_image_file(image_path)
    
    # 1. Texture Check (Anti-Spoof) using OpenCV
    cv_img = cv2.imread(image_path)
    if cv_img is None:
        result["error"] = "Image load failed"
        return result
        
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    if variance < ANTI_SPOOF_VARIANCE_MIN:
        result["error"] = "Spoof detected: Flat image (screen/photo)"
        return result

    # 2. Landmarks & Face Detection
    landmarks_list = face_recognition.face_landmarks(img)
    if not landmarks_list:
        result["error"] = "No face detected (Alignment failed)"
        logger.warning("No face landmarks found")
        return result
        
    landmarks = landmarks_list[0]
    
    # 3. Eye Check (EAR)
    # face_recognition returns dict: 'left_eye': [(x,y), ...], 'right_eye': ...
    left_eye = landmarks['left_eye']
    right_eye = landmarks['right_eye']
    
    avg_ear = (calculate_ear(left_eye) + calculate_ear(right_eye)) / 2
    
    # 4. Gaze/Pose Check (Nose vs Face Width)
    nose_bridge = landmarks['nose_bridge']
    chin = landmarks['chin']
    
    # Simple Yaw Estimation: Dist of nose tip to left vs right face edge?
    # Landmarks don't give perfect edges, but 'chin' points 0-16 define jawline.
    # Point 27 is top nose bridge, 30 is tip? face_recognition just gives list.
    # Actually face_recognition 'chin' is points 0-16. 8 is bottom chin.
    # 'nose_tip' is point 33.
    
    nose_tip = landmarks['nose_tip'][0] # List of points
    jaw = landmarks['chin']
    left_jaw = jaw[0]
    right_jaw = jaw[-1]
    
    face_width = math.dist(left_jaw, right_jaw)
    dist_l = math.dist(nose_tip, left_jaw)
    dist_r = math.dist(nose_tip, right_jaw)
    
    yaw_ratio = abs(dist_l - dist_r) / face_width
    
    if yaw_ratio > 0.35:
        result["error"] = "Look straight at camera"
        return result
        
    if avg_ear < EAR_THRESHOLD:
        result["error"] = "Eyes closed"
        return result

    # 5. Encoding
    encodings = face_recognition.face_encodings(img)
    if not encodings:
        result["error"] = "Encoding generation failed"
        return result

    result["valid"] = True
    result["encoding"] = encodings[0]
    return result

@app.get("/")
def health_check():
    return {
        "status": "active", 
        "engine": "dlib (Pure)",
        "security": "AES-256-GCM"
    }

@app.post("/register")
async def register(user_id: str = Form(...), file: UploadFile = File(...)):
    tmp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}.jpg")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        analysis = analyze_face_dlib_secure(tmp_path)
        
        if not analysis["valid"]:
            return {"success": False, "error": analysis["error"]}
            
        # Encrypt & Store
        secure_blob = {
            "user_id": user_id,
            "vector": analysis["encoding"].tolist(),
            "model": "dlib_resnet"
        }
        token = encrypt_data(secure_blob)
        face_db[user_id] = token
        save_db(face_db)
        
        # Save Profile Photo
        photo_name = f"{user_id}_profile.jpg"
        photo_path = os.path.join(PHOTO_DIR, photo_name)
        shutil.copy(tmp_path, photo_path)
        
        return {
            "success": True,
            "photo_url": f"/faces/{photo_name}"
        }
        
    except Exception as e:
        logger.error(f"Reg Error: {e}")
        return {"success": False, "error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/identify")
async def identify(project_id: str = Form(...), file: UploadFile = File(...)):
    tmp_path = os.path.join(UPLOAD_DIR, f"scan_{uuid.uuid4()}.jpg")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        analysis = analyze_face_dlib_secure(tmp_path)
        
        if not analysis["valid"]:
             return {"identified": False, "error": analysis["error"]}
             
        target_vec = analysis["encoding"]
        
        # 1:N Match Logic
        best_match = None
        min_dist = 1.0
        
        for uid, token in face_db.items():
            data = decrypt_data(token)
            if not data or data.get("model") != "dlib_resnet": continue
            
            stored_vec = np.array(data["vector"])
            distance = np.linalg.norm(stored_vec - target_vec)
            
            if distance < MATCH_THRESHOLD and distance < min_dist:
                min_dist = distance
                best_match = uid
                
        if best_match:
            photo_name = f"{best_match}_login_{uuid.uuid4().hex[:6]}.jpg"
            shutil.copy(tmp_path, os.path.join(PHOTO_DIR, photo_name))
            
            return {
                "identified": True,
                "verified": True,
                "user_id": best_match,
                "confidence": round((1 - min_dist)*100, 1),
                "photo_url": f"/faces/{photo_name}"
            }
            
        return {"identified": False, "error": "Face not recognized"}
        
    except Exception as e:
        logger.error(f"ID Error: {e}")
        return {"identified": False, "error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/liveness-check")
async def liveness(file: UploadFile = File(...)):
    tmp_path = os.path.join(UPLOAD_DIR, f"live_{uuid.uuid4()}.jpg")
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        analysis = analyze_face_dlib_secure(tmp_path)
        
        return {
            "passed": analysis["valid"],
            "is_live": analysis["valid"],
            "error": analysis.get("error")
        }
    finally:
        if os.path.exists(tmp_path):
             os.remove(tmp_path)

@app.get("/faces/{filename}")
async def get_photo(filename: str):
    p = os.path.join(PHOTO_DIR, filename)
    if os.path.exists(p):
        return FileResponse(p)
    return {"error": "Not found"}
