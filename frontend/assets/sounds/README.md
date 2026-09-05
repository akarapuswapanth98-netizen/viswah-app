# Drum Sound Assets

This directory contains audio samples for the Virtual Drums feature.

## Required Sound Files

| File | Description | Format |
|------|-------------|--------|
| `kick.mp3` | Bass drum / kick drum sound | MP3, 44100Hz, mono |
| `snare.mp3` | Snare drum sound | MP3, 44100Hz, mono |
| `hihat.mp3` | Hi-hat cymbal sound (closed) | MP3, 44100Hz, mono |
| `tom.mp3` | Tom-tom drum sound | MP3, 44100Hz, mono |
| `cymbal.mp3` | Crash cymbal sound | MP3, 44100Hz, mono |
| `clap.mp3` | Hand clap sound | MP3, 44100Hz, mono |

## Where to Get Free Drum Samples

- [Freesound.org](https://freesound.org) - Creative Commons licensed samples
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk) - Free for non-commercial use
- [Zapsplat](https://www.zapsplat.com) - Free tier available
- [Pixabay Music](https://pixabay.com/music/) - Royalty-free

## Adding Your Own Samples

1. Download or create your drum samples
2. Convert to MP3 format (44100Hz, mono recommended)
3. Place files in this directory
4. Update the drum sound loading code in `DrumsScreen.js` if needed

## File Size Guidelines

- Keep each sample under 100KB for fast loading
- Use appropriate bit rates (128kbps recommended)
- Trim silence from the beginning/end of samples

## Note

Currently, the Virtual Drums feature uses synthesized sounds via Web Audio API.
Adding actual .mp3 samples will provide more realistic drum sounds.
