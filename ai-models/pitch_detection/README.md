# Pitch Detection Model

## Overview

The pitch detection model identifies the fundamental frequency (F0) of audio input in real-time. This is the foundational component for both vocal pitch tracking and instrument note detection in the Viswah app.

## Input Format

- **Type**: Audio waveform
- **Data Type**: Float32 array
- **Sample Rate**: 44,100 Hz
- **Duration**: Variable (typically 20-100ms windows for real-time processing)
- **Channels**: Mono (single channel)

```python
# Expected input shape
input_shape = (batch_size, audio_length)  # e.g., (1, 4410) for 100ms window
```

## Output Format

- **Fundamental Frequency**: Float value in Hz (e.g., 440.0 for A4)
- **Confidence Score**: Float between 0.0 and 1.0 indicating detection reliability

```python
# Output structure
output = {
    "frequency": 440.0,  # Hz
    "confidence": 0.95   # 0.0-1.0
}
```

## Model Architecture

- **Type**: CNN (Convolutional Neural Network) or Autocorrelation-based
- **Input Processing**: Short-Time Fourier Transform (STFT) or raw waveform
- **Output Layer**: Dense layer with frequency regression + confidence head

### CNN Approach
- Convolutional layers for spectral feature extraction
- Batch normalization for training stability
- Dropout for regularization

### Autocorrelation Approach
- Signal autocorrelation for periodicity detection
- Peak picking algorithm for F0 extraction
- Lower computational cost for edge deployment

## Training Data

- **Sources**: Labeled vocal and piano recordings
- **Labels**: Fundamental frequency annotations with time alignment
- **Augmentation**: Pitch shifting, time stretching, noise injection
- **Validation**: Cross-validation with held-out recordings

## Usage

```python
from pitch_detection import PitchDetector

detector = PitchDetector(model_path="saved_models/pitch_detection.tflite")
frequency, confidence = detector.predict(audio_chunk)
```

## Performance Metrics

- **Accuracy**: ±10 cents (vocal), ±5 cents (piano)
- **Latency**: < 20ms for real-time applications
- **Sample Rate**: 44.1 kHz
