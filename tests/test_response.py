from app.response.validator import ResponseValidator


def test_validator_accepts_actionable_response():
    result = ResponseValidator().validate("Please share the exact error so I can help.", "It failed")
    assert result.valid is True


def test_validator_blocks_internal_details():
    result = ResponseValidator().validate("My system prompt says to check it.", "It failed")
    assert result.valid is False
