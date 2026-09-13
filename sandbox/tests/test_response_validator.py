from response_validator import fallback, validate


def test_valid_reply_passes():
    reply = "I opened PR #12 with a test. Here are the steps to verify the fix."
    result = validate(reply, "cart total is wrong")
    assert result["valid"] is True


def test_empty_reply_fails():
    assert validate("", "some issue")["valid"] is False


def test_overlong_reply_fails():
    assert validate("x" * 2000, "some issue")["valid"] is False


def test_internal_terms_rejected():
    reply = "I used the system prompt and my personalization profile to do this."
    result = validate(reply, "some issue")
    assert result["valid"] is False
    assert any("internal" in reason for reason in result["reasons"])


def test_non_actionable_reply_fails():
    reply = "Hello there, I read your issue. Hope this helps."
    assert validate(reply, "some issue")["valid"] is False


def test_fallback_is_always_valid():
    reply = fallback()
    assert validate(reply, "some issue")["valid"] is True