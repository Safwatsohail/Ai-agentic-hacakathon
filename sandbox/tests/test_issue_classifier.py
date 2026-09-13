from issue_classifier import classify


def test_classifies_question():
    result = classify({"title": "How can I checkout an item?", "body": "Is there a way to use the API from python?"})
    assert result["category"] == "question"
    assert result["severity"] == "low"


def test_classifies_enhancement():
    result = classify({"title": "Feature request: add a dark theme", "body": "It would be nice to add support for a dark theme."})
    assert result["category"] == "enhancement"
    assert result["severity"] == "low"


def test_classifies_bug():
    result = classify({"title": "Checkout is broken", "body": "The cart fails with an exception when I try to pay. Incorrect total."})
    assert result["category"] == "bug"
    assert result["severity"] in ("medium", "high")


def test_classifies_incident():
    result = classify({"title": "PROD IS DOWN, 500 errors", "body": "Outage on production, service unavailable, urgent."})
    assert result["category"] == "incident"
    assert result["severity"] == "critical"


def test_empty_issue_defaults_to_question():
    result = classify({"title": "", "body": ""})
    assert result["category"] == "question"


def test_labels_aligned_with_category():
    result = classify({"title": "bug: promo applies discount twice", "body": "The promocode is applied double, wrong output."})
    assert "bug" in result["labels"]