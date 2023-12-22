import os
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from pydub import AudioSegment
import librosa
from fpdf import FPDF
from docx import Document
import json
import csv
import time
# from dotenv import load_dotenv

# #hello world
# # Load environment variables from .env file
# load_dotenv()

# Determine the base directory (project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Combine base directory with relative paths from .env file
OUTPUT_FOLDER_PATH = "..\\..\\Files\\outputs"

# Initialize the Whisper model and processor
processor = WhisperProcessor.from_pretrained("openai/whisper-medium")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-medium")
print(torch.cuda.is_available())
# Check if CUDA (GPU support) is available and move the model to GPU if it is
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

def convert_audio_to_wav(audio_file, output_file):
    print(f"Starting conversion of {audio_file} to WAV format, please wait.")
    start_time = time.time()
    """Converts audio files of different formats to WAV format."""
    audio = AudioSegment.from_file(audio_file)
    audio.export(output_file, format="wav")
    end_time = time.time()
    print(f"Conversion completed in {end_time - start_time} seconds.")


def transcribe_audio(audio_file, model, processor):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("Using device:", device)  # This will print whether CUDA is being used
    model.to(device)
    try:
        print(f"Starting transcription of {audio_file}.")
        start_time = time.time()

        audio_data, sr = librosa.load(audio_file, sr=16000, mono=True)
        audio_length_seconds = librosa.get_duration(y=audio_data, sr=sr)
        chunk_length_minutes = max(1, audio_length_seconds / 1800)
        max_seconds = int(chunk_length_minutes * 60)
        transcription_segments = []

        for start in range(0, len(audio_data), max_seconds * sr):
            end = start + (max_seconds * sr)
            audio_chunk = audio_data[start:end]
            input_features = processor(audio_chunk, return_tensors="pt", sampling_rate=sr).input_features
            input_features = input_features.to(device)
            with torch.no_grad():
                predicted_ids = model.generate(input_features)
            chunk_transcription = processor.batch_decode(predicted_ids)
            transcription_segments.append(chunk_transcription[0])

        full_transcription = " ".join(transcription_segments)

        end_time = time.time()
        print(f"Transcription completed in {end_time - start_time} seconds.")
        return full_transcription

    except Exception as e:
        print(f"Error during transcription: {e}")
        raise


def save_as_txt(transcription, output_file):
    try:
        with open(output_file, "w") as txt_file:
            txt_file.write(transcription)
        print(f"File saved at {output_file}")
    except Exception as e:
        print(f"Error saving TXT file: {e}")
        raise

def save_as_pdf(transcription, output_file):
    """Saves the transcription to a PDF file."""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Replace non-Latin-1 characters
        transcription = transcription.replace('\u2026', '...')

        lines = transcription.split('\n')
        for line in lines:
            pdf.multi_cell(0, 10, line, 0, 1)

        pdf.output(output_file)
        print(f"PDF file saved at {output_file}")
    except Exception as e:
        print(f"Error saving PDF file: {e}")
        raise

def save_as_word(transcription, output_file):
    """Saves the transcription to a Word (DOCX) file."""
    doc = Document()
    doc.add_paragraph(transcription)
    doc.save(output_file)

def save_as_json(transcription, output_file):
    """Saves the transcription to a JSON file."""
    with open(output_file, "w") as json_file:
        json.dump({"transcription": transcription}, json_file)

def save_as_csv(transcription, output_file):
    """Saves the transcription to a CSV file."""
    with open(output_file, "w", newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["Transcription"])
        writer.writerow([transcription])

def estimate_transcription_time(audio_file):
    """Estimate transcription time based on the audio file's size"""
    duration = librosa.get_duration(filename=audio_file)
    estimated_time = duration * 0.0615  # Adjust this factor based on your observations
    estimated_time_message = f"Estimated transcription time for {duration} seconds of audio: {estimated_time} seconds"
    print(estimated_time_message)
    return estimated_time_message

def process_audio_file(input_file, output_format="txt"):
    print(f"Processing audio file: {input_file}")

    # Convert the audio file to WAV format
    temp_wav_file = os.path.join(BASE_DIR, "temp_converted.wav")  # Adjust this path if needed
    convert_audio_to_wav(input_file, temp_wav_file)

    # Estimate the transcription time
    estimate_transcription_time(temp_wav_file)
    
    # Transcribe the WAV file
    transcription = transcribe_audio(temp_wav_file, model, processor)
    
    # Mapping of output formats to their respective saving functions
    format_to_function = {
        "txt": save_as_txt,
        "pdf": save_as_pdf,
        "json": save_as_json,
        "csv": save_as_csv
    }
    
    # Check if the desired output format is supported
    if output_format not in format_to_function:
        raise ValueError(f"Unsupported output format: {output_format}")

    # Ensure OUTPUT_FOLDER_PATH exists
    if not os.path.exists(OUTPUT_FOLDER_PATH):
        os.makedirs(OUTPUT_FOLDER_PATH)

    # Save the transcription in the desired format
    output_file_name = os.path.basename(os.path.splitext(input_file)[0]) + "." + output_format
    output_file = os.path.join(OUTPUT_FOLDER_PATH, output_file_name)
    format_to_function[output_format](transcription, output_file)
    
    # Clean up temporary files
    os.remove(temp_wav_file)
    
    print(f"Output file saved at {output_file}")
    return output_file