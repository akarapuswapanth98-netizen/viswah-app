# Note Recognition Model

## Overview

The note recognition model identifies individual piano notes from audio recordings. It outputs MIDI note numbers, velocity values, and precise onset timing for accurate performance assessment and transcription.

## Input Format

- **Type**: Audio from piano
- **Format**: WAV (uncompressed)
- **Sample Rate**: 44,100 Hz
- **Channels**: Mono
- **Bit Depth**: 16-bit or 32-bit float

```python
# Expected input shape
input_shape = (batch_size, audio_length)  # e.g., (1, 8820) for 200ms window
```

## Output Format

- **MIDI Note Number**: Integer (21-108 for standard 88-key piano)
- **Velocity**: Integer (0-127) representing note intensity
- **Onset Time**: Float in seconds for precise note timing

```python
# Output structure
output = {
    "midi_note": 60,        # Middle C = 60
    "velocity": 85,         # 0-127
    "onset_time": 1.234     # seconds
}
```

## Model Architecture

- **Type**: CNN (Convolutional Neural Network)
- **Purpose**: Note classification from spectrographic features
- **Input Processing**: Mel-spectrogram or constant-Q transform
- **Output Layer**: Dense layer with softmax for note classification

### Architecture Details
- 1D/2D convolutional layers for frequency pattern recognition
- Max pooling for dimensionality reduction
- Fully connected layers for final classification
- Multi-output head for simultaneous note, velocity, and onset prediction

## Training Data

- **Sources**: Piano recordings with aligned MIDI labels
- **Labels**: MIDI note numbers, velocity values, and onset timestamps
- **Diversity**: Multiple piano types, playing styles, and dynamic ranges
- **Augmentation**: Time stretching, dynamic variation, room simulation

## Usage

```python
from note_recognition import NoteRecognizer

recognizer = NoteRecognizer(model_path="saved_models/note_recognition.tflite")
notes = recognizer.recognize(audio_chunk)
for note in notes:
    print(f"Note: {note['midi_note']}, Velocity: {note['velocity']}")
```

## Performance Metrics

- **Accuracy**: > 95% for note detection
- **Onset Detection**: ±10ms precision
- **Latency**: < 30ms for real-time applications
- **False Positive Rate**: < 2%
