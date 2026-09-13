from app.issue.detector import IssueDetector


def test_detects_actionable_issue():
    result = IssueDetector().detect("My deployment failed with a timeout error")
    assert result.is_issue is True
    assert result.category == "deployment"


def test_ignores_normal_message():
    assert IssueDetector().detect("hey there").is_issue is False
