# Viswah ML Models

## Overview

The `ai-models/` directory contains the machine learning pipeline for audio analysis. Three model types work together to provide real-time feedback on musical performance.

```
Audio Input → Preprocessing → Model Inference → Post-processing → Feedback Output
```

---

## Model Types

### 1. Pitch Detection (`pitch_detection/`)

Detects the fundamental frequency (F0) of audio input in real-time. Used for:
- Vocal pitch tracking during singing
- Piano note identification

**Input:** Raw audio waveform (4410 samples = ~100ms at 44.1kHz)

**Output:**
- `frequency` - Detected frequency in Hz (linear activation)
- `confidence` - Detection confidence 0-1 (sigmoid activation)

**Architecture:** 1D CNN

```
Input (4410, 1)
  → Conv1D(32, kernel=3, relu) → MaxPool1D(2)
  → Conv1D(64, kernel=3, relu) → MaxPool1D(2)
  → Conv1D(128, kernel=3, relu) → GlobalAvgPool1D
  → Dense(128, relu) → Dropout(0.3)
  → Dense(64, relu)
  → Dense(1, linear, name="frequency")
  → Dense(1, sigmoid, name="confidence")
```

**Loss:** MSE (frequency) + Binary Crossentropy (confidence)

---

### 2. Speech Analysis (`speech_analysis/`)

Analyzes singing performance quality. Used for:
- Pitch accuracy assessment
- Voice stability measurement
- Volume consistency checking

**Input:** Audio waveform (44100 samples = 1 second at 44.1kHz)

**Output:** 3-dimensional score vector (sigmoid):
- Score 0: Pitch accuracy
- Score 1: Stability
- Score 2: Volume consistency

**Architecture:** LSTM RNN

```
Input (44100, 1)
  → LSTM(64, return_sequences=True)
  → LSTM(32)
  → Dense(64, relu) → Dropout(0.3)
  → Dense(32, relu)
  → Dense(3, sigmoid, name="scores")
```

**Loss:** MSE

---

### 3. Note Recognition (`note_recognition/`)

Identifies individual piano notes from audio. Used for:
- Piano performance assessment
- MIDI note detection
- Onset timing

**Input:** Audio waveform (8820 samples = ~200ms at 44.1kHz)

**Output:**
- `midi_note` - MIDI note number 21-108 (88 keys, softmax)
- `velocity` - Note velocity (linear)
- `onset_time` - Note onset in seconds (linear)

**Architecture:** 1D CNN

```
Input (8820,)
  → Reshape (8820, 1)
  → Conv1D(32, kernel=5, relu) → MaxPool1D(4)
  → Conv1D(64, kernel=5, relu) → MaxPool1D(4)
  → Conv1D(128, kernel=5, relu) → GlobalAvgPool1D
  → Dense(128, relu) → Dropout(0.3)
  → Dense(88, softmax, name="midi_note")
  → Dense(1, linear, name="velocity")
  → Dense(1, linear, name="onset_time")
```

**Loss:** Sparse Categorical Crossentropy (midi_note) + MSE (velocity, onset_time)

---

## Directory Structure

```
ai-models/
├── README.md                  # Overview documentation
├── export_model.py            # Model export/conversion script
├── pitch_detection/
│   └── README.md              # Pitch detection documentation
├── speech_analysis/
│   └── README.md              # Speech analysis documentation
├── note_recognition/
│   └── README.md              # Note recognition documentation
└── saved_models/              # Exported TFLite models (generated)
    ├── pitch_detection.tflite
    ├── speech_analysis.tflite
    └── note_recognition.tflite
```

---

## Training Workflow

### 1. Data Preparation

Audio data should be organized as:
```
data/
├── pitch_detection/
│   ├── audio/          # .wav files
│   └── labels.csv      # filename, frequency
├── speech_analysis/
│   ├── audio/          # .wav files
│   └── labels.csv      # filename, score_1, score_2, score_3
└── note_recognition/
    ├── audio/          # .wav files
    └── labels.csv      # filename, midi_note, velocity, onset_time
```

### 2. Training

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# Load and preprocess data
# ...

# Build model (see architectures above)
model = create_pitch_detection_model()

# Compile
model.compile(
    optimizer="adam",
    loss={"frequency": "mse", "confidence": "binary_crossentropy"},
    metrics={"frequency": "mae", "confidence": "accuracy"}
)

# Train
model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=50,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=5),
        keras.callbacks.ModelCheckpoint("best_model.keras")
    ]
)
```

### 3. Export to TFLite

```bash
python export_model.py --model_type pitch_detection --output_dir ./saved_models
python export_model.py --model_type speech_analysis --output_dir ./saved_models
python export_model.py --model_type note_recognition --output_dir ./saved_models
```

The export script:
1. Creates a fresh model instance
2. Converts to TFLite with default optimizations
3. Saves to `saved_models/<model_type>.tflite`

---

## Integration with Backend

### Current: Signal Processing

The backend currently uses traditional signal processing (not the ML models) for real-time analysis:

**Pitch Detection** (`services/speech_analysis.py`):
- **With numpy:** Autocorrelation-based pitch detection
  - DC offset removal
  - Full autocorrelation
  - Peak finding in valid frequency range (50-1000 Hz)
  - Windowed stability analysis
- **Without numpy:** Zero-crossing rate estimation
  - Simpler but less accurate

**Volume Analysis:**
- RMS (Root Mean Square) calculation
- Peak amplitude
- dB conversion
- Level classification (quiet/normal/loud)

**Scoring:**
- Pitch accuracy (40 points): Note match + cents deviation
- Stability (30 points): Coefficient of variation across windows
- Volume (15 points): dB level in optimal range
- Confidence (15 points): Autocorrelation peak value

### Future: ML Model Integration

To integrate the TFLite models into the backend:

```python
import numpy as np

def load_tflite_model(model_path):
    """Load a TFLite model for inference."""
    import tensorflow as tf
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter

def predict_pitch(audio_data, model_path="saved_models/pitch_detection.tflite"):
    """Run pitch detection using the ML model."""
    interpreter = load_tflite_model(model_path)

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Preprocess: normalize and reshape
    audio = np.array(audio_data, dtype=np.float32)
    audio = audio / (np.max(np.abs(audio)) + 1e-8)
    audio = audio[:4410].reshape(1, 4410, 1)

    interpreter.set_tensor(input_details[0]['index'], audio)
    interpreter.invoke()

    frequency = interpreter.get_tensor(output_details[0]['index'])[0][0]
    confidence = interpreter.get_tensor(output_details[1]['index'])[0][0]

    return {"frequency": float(frequency), "confidence": float(confidence)}
```

---

## Adding New Models

### Step 1: Define the model architecture

Create a new directory:

```bash
mkdir ai-models/my_new_model
```

Add a `README.md` documenting the model's purpose, architecture, and data requirements.

### Step 2: Add a creator function to `export_model.py`

```python
def create_my_new_model():
    """Create model for [purpose]."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

    model = keras.Sequential([
        layers.Input(shape=(YOUR_INPUT_SHAPE)),
        # ... layers ...
        layers.Dense(NUM_OUTPUTS, activation="softmax")
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model
```

### Step 3: Register the model

```python
MODEL_CREATORS = {
    "pitch_detection": create_pitch_detection_model,
    "speech_analysis": create_speech_analysis_model,
    "note_recognition": create_note_recognition_model,
    "my_new_model": create_my_new_model,  # Add here
}
```

### Step 4: Export

```bash
python export_model.py --model_type my_new_model --output_dir ./saved_models
```

### Step 5: Integrate with backend

Add inference code to the appropriate service in `backend/services/` and create a new route in `backend/routes/`.

---

## Performance Considerations

- **TFLite models** are optimized for mobile/edge inference
- **Quantization** (via `tf.lite.Optimize.DEFAULT`) reduces model size ~4x with minimal accuracy loss
- **Backend analysis** uses signal processing for real-time response without model loading overhead
- **ML models** are better suited for on-device inference via React Native TFLite integration

## Requirements

```
tensorflow>=2.12
numpy
librosa
```
