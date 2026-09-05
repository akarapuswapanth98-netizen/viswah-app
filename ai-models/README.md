# AI Models - Viswah Music Learning App

## Overview

This directory contains the machine learning pipeline for the Viswah music learning application. The AI system consists of three core model types that work together to provide real-time feedback on musical performance.

## Model Types

### 1. Pitch Detection (`pitch_detection/`)
Detects the fundamental frequency of audio input in real-time. Used for vocal pitch tracking and piano note identification.

### 2. Speech Analysis (`speech_analysis/`)
Analyzes singing performance quality including pitch accuracy, stability, and volume consistency. Provides detailed feedback on vocal technique.

### 3. Note Recognition (`note_recognition/`)
Identifies individual piano notes from audio recordings, outputting MIDI note numbers, velocity, and onset timing for accurate performance assessment.

## Pipeline Architecture

```
Audio Input → Preprocessing → Model Inference → Post-processing → Feedback Output
```

## Directory Structure

```
ai-models/
├── README.md                 # This file
├── export_model.py           # Model export/conversion script
├── pitch_detection/
│   └── README.md             # Pitch detection model documentation
├── speech_analysis/
│   └── README.md             # Speech analysis model documentation
├── note_recognition/
│   └── README.md             # Note recognition model documentation
└── saved_models/             # Exported TFLite models (generated)
```

## Requirements

- Python 3.8+
- TensorFlow 2.x
- NumPy
- Librosa (audio processing)

## Usage

```bash
# Export a model to TFLite format
python export_model.py --model_type pitch_detection --output_dir ./saved_models
```
