# Lyrics Creator Service - AI-Powered Lyrics Generation

import json
import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Try to import OpenAI
OPENAI_AVAILABLE = False
client = None

try:
    import openai
    _openai_key = os.getenv("OPENAI_API_KEY", "")
    if _openai_key and _openai_key != "your-openai-api-key-here" and len(_openai_key) >= 20:
        client = openai.OpenAI(api_key=_openai_key)
        OPENAI_AVAILABLE = True
except ImportError:
    logger.info("OpenAI package not installed")
except Exception as e:
    logger.error(f"OpenAI init failed: {e}")


# Genre templates for fallback lyrics
GENRE_TEMPLATES = {
    "pop": {
        "structure": ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
        "themes": ["love", "friendship", "dreams", "summer", "nights"],
        "style": "catchy, upbeat, radio-friendly"
    },
    "rock": {
        "structure": ["verse", "chorus", "verse", "chorus", "solo", "chorus"],
        "themes": ["freedom", "rebellion", "strength", "roads", "fire"],
        "style": "powerful, energetic, guitar-driven"
    },
    "ballad": {
        "structure": ["verse", "verse", "chorus", "verse", "chorus", "outro"],
        "themes": ["heartbreak", "memories", "loss", "home", "rain"],
        "style": "emotional, slow, piano-based"
    },
    "hiphop": {
        "structure": ["verse1", "hook", "verse2", "hook", "verse3", "hook"],
        "themes": ["hustle", "streets", "success", "life", "real"],
        "style": "rhythmic, wordplay, flow-based"
    },
    "country": {
        "structure": ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
        "themes": ["truck", "girl", "road", "home", "whiskey"],
        "style": "storytelling, twangy, heartland"
    },
    "rnb": {
        "structure": ["verse", "pre-chorus", "chorus", "verse", "chorus", "bridge"],
        "themes": ["love", "desire", "night", "body", "soul"],
        "style": "smooth, groovy, soulful"
    }
}

# Rhyme patterns
RHYME_PATTERNS = {
    "aabb": lambda lines: _pair_rhyme(lines, 0, 1) and _pair_rhyme(lines, 2, 3),
    "abab": lambda lines: _pair_rhyme(lines, 0, 2) and _pair_rhyme(lines, 1, 3),
    "abcb": lambda lines: _pair_rhyme(lines, 1, 3),
}


def _pair_rhyme(lines: list[str], i: int, j: int) -> bool:
    """Simple rhyme check using last words"""
    if i >= len(lines) or j >= len(lines):
        return False
    word1 = lines[i].strip().split()[-1].lower() if lines[i].strip() else ""
    word2 = lines[j].strip().split()[-1].lower() if lines[j].strip() else ""
    # Fix #19: Compare last 3 chars for better rhyme accuracy
    return word1[-3:] == word2[-3:] if len(word1) > 2 and len(word2) > 2 else False


def _parse_json_response(content: str) -> dict:
    """Parse JSON from OpenAI response, stripping markdown code fences"""
    text = content.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)


def generate_lyrics(topic: str, genre: str = "pop", mood: str = "happy", 
                    language: str = "english") -> dict:
    """Generate lyrics using AI or fallback"""
    if OPENAI_AVAILABLE and client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"You are a talented songwriter specializing in {genre} music."},
                    {"role": "user", "content": f"""Write {genre} lyrics about {topic} in a {mood} mood.
                    
Return JSON with:
- title: song title
- genre: {genre}
- mood: {mood}
- lyrics: array of sections, each with:
  - section_name: (verse, chorus, bridge, outro, etc.)
  - lines: array of lyric lines
- rhyme_scheme: (aabb, abab, abcb)
- word_count: total word count
- suggested_tempo: BPM suggestion
- suggested_key: musical key suggestion"""}
                ],
                temperature=0.8,
                max_tokens=1500
            )
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty AI response")
            return _parse_json_response(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI lyrics error: {e}")

    return _get_fallback_lyrics(topic, genre, mood)


def _get_fallback_lyrics(topic: str, genre: str, mood: str) -> dict:
    """Generate fallback lyrics when AI is unavailable"""
    theme = topic.lower()

    lyrics_data = {
        "pop": {
            "happy": {
                "title": f"Shining {theme.title()}",
                "lyrics": [
                    {"section_name": "verse1", "lines": [
                        "Woke up this morning, feeling so bright",
                        "Thinking about you, everything's right",
                        "The sun is shining, sky so blue",
                        "Every moment I spend with you"
                    ]},
                    {"section_name": "chorus", "lines": [
                        f"Oh {theme}, you make me smile",
                        "Stay with me, stay a while",
                        "Dancing through the day and night",
                        "You and me, everything's alright"
                    ]},
                    {"section_name": "verse2", "lines": [
                        "Walking down the street, hand in hand",
                        "Nothing in this world could be so grand",
                        "The music plays, we sing along",
                        "With you here, where I belong"
                    ]},
                    {"section_name": "chorus", "lines": [
                        f"Oh {theme}, you make me smile",
                        "Stay with me, stay a while",
                        "Dancing through the day and night",
                        "You and me, everything's alright"
                    ]},
                    {"section_name": "bridge", "lines": [
                        "When the world gets crazy and loud",
                        "You're the one who makes me proud",
                        "Hold my hand and don't let go",
                        "Together we'll grow and grow"
                    ]},
                    {"section_name": "outro", "lines": [
                        f"{theme.title()}, oh {theme.title()}",
                        "You make everything feel good"
                    ]}
                ]
            },
            "sad": {
                "title": f"Missing {theme.title()}",
                "lyrics": [
                    {"section_name": "verse1", "lines": [
                        "The rain is falling, tears drop too",
                        "Everything reminds me of you",
                        "Empty rooms and silent nights",
                        "Nothing feels quite right"
                    ]},
                    {"section_name": "chorus", "lines": [
                        "I miss you more than words can say",
                        "You've been gone so many days",
                        f"{theme.title()}, you were my light",
                        "Now I wander through the night"
                    ]},
                    {"section_name": "verse2", "lines": [
                        "Found your picture on the floor",
                        "Can't believe you're not here anymore",
                        "The memories playing in my head",
                        "I wish I'd never said what I said"
                    ]},
                    {"section_name": "chorus", "lines": [
                        "I miss you more than words can say",
                        "You've been gone so many days",
                        f"{theme.title()}, you were my light",
                        "Now I wander through the night"
                    ]},
                    {"section_name": "bridge", "lines": [
                        "If I could turn back time",
                        "I'd make everything fine",
                        "But all I have are these tears to cry",
                        "As the days go passing by"
                    ]}
                ]
            }
        },
        "rock": {
            "happy": {
                "title": f"Burning {theme.title()}",
                "lyrics": [
                    {"section_name": "verse1", "lines": [
                        "Turn it up, feel the sound",
                        f"{theme.title()}, shake the ground",
                        "We're alive, we're on fire",
                        "Lifting higher and higher"
                    ]},
                    {"section_name": "chorus", "lines": [
                        f"WE ARE {theme.upper()}!",
                        "WE WILL NEVER STOP!",
                        "FEEL THE POWER IN YOUR SOUL",
                        "LET THE MUSIC TAKE CONTROL!"
                    ]},
                    {"section_name": "verse2", "lines": [
                        "Breaking walls, breaking chains",
                        "Running wild through the plains",
                        "No more limits, no more rules",
                        "We're the leaders, we're the tools"
                    ]},
                    {"section_name": "chorus", "lines": [
                        f"WE ARE {theme.upper()}!",
                        "WE WILL NEVER STOP!",
                        "FEEL THE POWER IN YOUR SOUL",
                        "LET THE MUSIC TAKE CONTROL!"
                    ]}
                ]
            }
        }
    }

    # Get genre template, fallback to pop
    genre_data = lyrics_data.get(genre.lower(), lyrics_data.get("pop", {}))
    # Get mood template, fallback to happy
    mood_data = genre_data.get(mood.lower(), genre_data.get("happy", {}))

    # Ultimate fallback
    if not mood_data:
        mood_data = {
            "title": f"{theme.title()} Song",
            "lyrics": [
                {"section_name": "verse1", "lines": [
                    f"Thinking about {theme} today",
                    "It takes my breath away",
                    "The world is spinning round and round",
                    f"With {theme} I can be found"
                ]},
                {"section_name": "chorus", "lines": [
                    f"Oh {theme}, you're so fine",
                    "You're always on my mind",
                    "Sing it loud, sing it clear",
                    f"{theme.title()} is why we're here"
                ]}
            ]
        }

    return {
        "title": mood_data.get("title", f"{theme.title()} Song"),
        "genre": genre,
        "mood": mood,
        "lyrics": mood_data.get("lyrics", []),
        "rhyme_scheme": "aabb",
        "word_count": sum(len(line.split()) for section in mood_data.get("lyrics", []) for line in section.get("lines", [])),
        "suggested_tempo": 120,
        "suggested_key": "C Major"
    }


def improve_lyrics(lyrics: str, instruction: str = "make it more emotional") -> dict:
    """Improve existing lyrics using AI"""
    if OPENAI_AVAILABLE and client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional songwriter and lyricist."},
                    {"role": "user", "content": f"""Improve these lyrics by {instruction}:

{lyrics}

Return JSON with:
- improved_lyrics: the improved lyrics text
- changes_made: list of changes made
- suggestions: list of additional suggestions"""}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty AI response")
            return _parse_json_response(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI lyrics improvement error: {e}")

    return {
        "improved_lyrics": lyrics,
        "changes_made": ["Unable to improve without AI"],
        "suggestions": ["Try adding more descriptive words", "Use metaphors", "Create vivid imagery"]
    }


def analyze_lyrics(lyrics: str) -> dict:
    """Analyze lyrics for various metrics"""
    words = lyrics.split()
    lines = [line.strip() for line in lyrics.split("\n") if line.strip()]

    # Simple syllable count
    def count_syllables(word):
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        if word[0] in vowels:
            count += 1
        for i in range(1, len(word)):
            if word[i] in vowels and word[i - 1] not in vowels:
                count += 1
        if word.endswith("e"):
            count -= 1
        if count == 0:
            count = 1
        return count

    total_syllables = sum(count_syllables(w) for w in words)

    # Find rhyme scheme
    last_words = []
    for line in lines:
        line_words = line.split()
        if line_words:
            last_words.append(line_words[-1].lower())
        else:
            last_words.append("")

    # Simple sentiment
    positive_words = {"love", "happy", "joy", "beautiful", "amazing", "wonderful", "great", "good", "bright", "shine"}
    negative_words = {"sad", "cry", "tears", "pain", "hurt", "broken", "lost", "dark", "cold", "alone"}

    pos_count = sum(1 for w in words if w.lower() in positive_words)
    neg_count = sum(1 for w in words if w.lower() in negative_words)

    sentiment = "neutral"
    if pos_count > neg_count:
        sentiment = "positive"
    elif neg_count > pos_count:
        sentiment = "negative"

    return {
        "word_count": len(words),
        "line_count": len(lines),
        "avg_words_per_line": round(len(words) / max(len(lines), 1), 1),
        "total_syllables": total_syllables,
        "avg_syllables_per_word": round(total_syllables / max(len(words), 1), 1),
        "sentiment": sentiment,
        "positive_words": pos_count,
        "negative_words": neg_count,
        "unique_words": len({w.lower() for w in words}),
        "readability": "easy" if len(words) < 100 else "medium" if len(words) < 200 else "complex"
    }


def format_lyrics(lyrics_data: dict, format_type: str = "text") -> str:
    """Format lyrics for display or export"""
    if format_type == "text":
        lines = []
        for section in lyrics_data.get("lyrics", []):
            lines.append(f"=== {section.get('section_name', 'Section').upper()} ===")
            for line in section.get("lines", []):
                lines.append(line)
            lines.append("")
        return "\n".join(lines)

    elif format_type == "chords":
        lines = []
        for section in lyrics_data.get("lyrics", []):
            lines.append(f"[{section.get('section_name', 'Section').upper()}]")
            for line in section.get("lines", []):
                lines.append(f"  {line}")
            lines.append("")
        return "\n".join(lines)

    elif format_type == "lrc":
        lines = []
        time = 0
        for section in lyrics_data.get("lyrics", []):
            for line in section.get("lines", []):
                minutes = int(time // 60)
                seconds = int(time % 60)
                lines.append(f"[{minutes:02d}:{seconds:02d}] {line}")
                time += 4  # ~4 seconds per line
        return "\n".join(lines)

    return json.dumps(lyrics_data, indent=2)


def get_genres() -> list[dict]:
    """Get available genres with descriptions"""
    return [
        {"id": "pop", "name": "Pop", "description": "Catchy, upbeat, radio-friendly"},
        {"id": "rock", "name": "Rock", "description": "Powerful, energetic, guitar-driven"},
        {"id": "ballad", "name": "Ballad", "description": "Emotional, slow, piano-based"},
        {"id": "hiphop", "name": "Hip-Hop", "description": "Rhythmic, wordplay, flow-based"},
        {"id": "country", "name": "Country", "description": "Storytelling, twangy, heartland"},
        {"id": "rnb", "name": "R&B", "description": "Smooth, groovy, soulful"},
    ]


def get_moods() -> list[dict]:
    """Get available moods"""
    return [
        {"id": "happy", "name": "Happy", "emoji": "😊"},
        {"id": "sad", "name": "Sad", "emoji": "😢"},
        {"id": "angry", "name": "Angry", "emoji": "😠"},
        {"id": "romantic", "name": "Romantic", "emoji": "❤️"},
        {"id": "energetic", "name": "Energetic", "emoji": "⚡"},
        {"id": "chill", "name": "Chill", "emoji": "😌"},
    ]
