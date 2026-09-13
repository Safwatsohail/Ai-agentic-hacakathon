from personalizer import build_profile


def test_profile_adapts_verbosity():
    short = ["yes", "pls fix", "ty"]
    profile = build_profile("bob", short)
    assert profile["style"]["verbosity"] == "concise"


def test_profile_detects_steps_preference():
    profile = build_profile("bob", ["can you give me steps to fix this", "give an example"])
    assert "prefers actionable steps or examples" in profile["preferences"]


def test_profile_detects_emoji():
    profile = build_profile("bob", ["works now, thanks 👍😊"])
    assert profile["style"]["emoji_usage"] == "uses emojis"


def test_profile_detects_casual_tone():
    profile = build_profile("bob", ["lol nah just delete it pls"])
    assert profile["style"]["formality"] == "casual"


def test_profile_confidence_scales_with_evidence():
    low = build_profile("bob", ["ok"])
    high = build_profile("bob", [f"sample {i}" for i in range(20)])
    assert high["confidence"] > low["confidence"]
    assert high["confidence"] <= 0.95


def test_empty_samples_produce_placeholder():
    profile = build_profile("bob", [])
    assert profile["confidence"] == 0.0
    assert profile["evidence_count"] == 0