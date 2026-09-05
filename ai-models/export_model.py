#!/usr/bin/env python3
"""
Model Export Script for Viswah Music Learning App

Exports TensorFlow/Keras models to TFLite format for mobile deployment.
"""

import argparse
import os
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def create_pitch_detection_model():
    """Create a simple CNN model for pitch detection."""
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers
    except ImportError:
        logger.error("TensorFlow is not installed. Install with: pip install tensorflow")
        sys.exit(1)

    model = keras.Sequential([
        layers.Input(shape=(4410, 1)),
        layers.Conv1D(32, kernel_size=3, activation="relu", padding="same"),
        layers.MaxPooling1D(pool_size=2),
        layers.Conv1D(64, kernel_size=3, activation="relu", padding="same"),
        layers.MaxPooling1D(pool_size=2),
        layers.Conv1D(128, kernel_size=3, activation="relu", padding="same"),
        layers.GlobalAveragePooling1D(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dense(1, activation="linear", name="frequency"),
        layers.Dense(1, activation="sigmoid", name="confidence")
    ])

    model.compile(
        optimizer="adam",
        loss={"frequency": "mse", "confidence": "binary_crossentropy"},
        metrics={"frequency": "mae", "confidence": "accuracy"}
    )

    return model


def create_speech_analysis_model():
    """Create a simple RNN model for speech analysis."""
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers
    except ImportError:
        logger.error("TensorFlow is not installed. Install with: pip install tensorflow")
        sys.exit(1)

    model = keras.Sequential([
        layers.Input(shape=(44100, 1)),
        layers.LSTM(64, return_sequences=True),
        layers.LSTM(32),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(32, activation="relu"),
        layers.Dense(3, activation="sigmoid", name="scores")
    ])

    model.compile(
        optimizer="adam",
        loss="mse",
        metrics=["mae"]
    )

    return model


def create_note_recognition_model():
    """Create a simple CNN model for note recognition."""
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers
    except ImportError:
        logger.error("TensorFlow is not installed. Install with: pip install tensorflow")
        sys.exit(1)

    model = keras.Sequential([
        layers.Input(shape=(8820,)),
        layers.Reshape((8820, 1)),
        layers.Conv1D(32, kernel_size=5, activation="relu", padding="same"),
        layers.MaxPooling1D(pool_size=4),
        layers.Conv1D(64, kernel_size=5, activation="relu", padding="same"),
        layers.MaxPooling1D(pool_size=4),
        layers.Conv1D(128, kernel_size=5, activation="relu", padding="same"),
        layers.GlobalAveragePooling1D(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(88, activation="softmax", name="midi_note"),
        layers.Dense(1, activation="linear", name="velocity"),
        layers.Dense(1, activation="linear", name="onset_time")
    ])

    model.compile(
        optimizer="adam",
        loss={"midi_note": "sparse_categorical_crossentropy", "velocity": "mse", "onset_time": "mse"},
        metrics={"midi_note": "accuracy"}
    )

    return model


MODEL_CREATORS = {
    "pitch_detection": create_pitch_detection_model,
    "speech_analysis": create_speech_analysis_model,
    "note_recognition": create_note_recognition_model,
}


def convert_to_tflite(model, output_path):
    """Convert a Keras model to TFLite format."""
    try:
        import tensorflow as tf
    except ImportError:
        logger.error("TensorFlow is not installed. Install with: pip install tensorflow")
        sys.exit(1)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    try:
        tflite_model = converter.convert()
    except Exception as e:
        logger.error(f"TFLite conversion failed: {e}")
        sys.exit(1)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "wb") as f:
        f.write(tflite_model)

    logger.info(f"Model saved to: {output_path}")
    logger.info(f"Model size: {len(tflite_model) / 1024:.2f} KB")


def main():
    parser = argparse.ArgumentParser(
        description="Export Viswah AI models to TFLite format"
    )
    parser.add_argument(
        "--model_type",
        type=str,
        required=True,
        choices=list(MODEL_CREATORS.keys()),
        help="Type of model to export"
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./saved_models",
        help="Output directory for saved models (default: ./saved_models)"
    )
    parser.add_argument(
        "--model_name",
        type=str,
        default=None,
        help="Custom model filename (default: <model_type>.tflite)"
    )

    args = parser.parse_args()

    logger.info(f"Creating {args.model_type} model...")

    create_fn = MODEL_CREATORS[args.model_type]
    model = create_fn()

    model.summary()

    if args.model_name:
        filename = args.model_name
    else:
        filename = f"{args.model_type}.tflite"

    output_path = os.path.join(args.output_dir, filename)

    logger.info(f"Converting to TFLite format...")
    convert_to_tflite(model, output_path)

    logger.info("Export complete!")


if __name__ == "__main__":
    main()
