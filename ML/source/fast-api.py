from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import transcription
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Define data models for request payloads
class EstimateTimeRequest(BaseModel):
    fileName: str

class TranscribeAudioRequest(BaseModel):
    fileName: str
    outputFormat: str

app = FastAPI()

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],  # Whitelist localhost:4000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use raw strings for file paths
UPLOAD_FOLDER_PATH = "..\\..\\Files\\uploads"
OUTPUT_FOLDER_PATH = "..\\..\\Files\\outputs"

@app.post('/estimate-time')
def estimate_time(request: EstimateTimeRequest):
    input_file_path = os.path.join(UPLOAD_FOLDER_PATH, request.fileName)

    if not os.path.exists(input_file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        estimated_time = transcription.estimate_transcription_time(input_file_path)
        return {"estimatedTime": estimated_time}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/transcribe')
def transcribe_audio(request: TranscribeAudioRequest):
    input_file_path = os.path.join(UPLOAD_FOLDER_PATH, request.fileName)

    if os.path.getsize(input_file_path) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    try:
        output_file_path = transcription.process_audio_file(input_file_path, request.outputFormat)
        if not os.path.exists(output_file_path):
            raise FileNotFoundError(f"Output file not created: {output_file_path}")
        return {"fileName": request.fileName}
    except FileNotFoundError as fnf_error:
        raise HTTPException(status_code=404, detail=str(fnf_error))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/test-output')
def test_output():
    try:
        test_file_path = os.path.join(OUTPUT_FOLDER_PATH, 'test.txt')
        with open(test_file_path, 'w') as test_file:
            test_file.write('This is a test.')
        return {"message": f"Test file written to {test_file_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
