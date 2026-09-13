from calendar_tools import COMPLEXITY_WINDOWS, resolve_fix_window


def test_all_levels_have_windows():
    for level, window in COMPLEXITY_WINDOWS.items():
        assert window["duration_minutes"] >= 15
        assert window["start_in_minutes"] >= 0
        assert window["duration_minutes"] <= 180


def test_complexity_maps_to_window():
    assert resolve_fix_window("simple") == (15, 30)
    assert resolve_fix_window("medium") == (15, 60)
    assert resolve_fix_window("complex") == (30, 120)
    assert resolve_fix_window("critical") == (5, 180)


def test_complexity_is_case_and_space_insensitive():
    assert resolve_fix_window("  COMPLEX ") == (30, 120)


def test_unknown_complexity_falls_back_to_medium():
    assert resolve_fix_window("huge") == (15, 60)


def test_explicit_overrides_win():
    assert resolve_fix_window("critical", start_in_minutes=60, duration_minutes=90) == (60, 90)


def test_partial_overrides():
    assert resolve_fix_window("simple", start_in_minutes=5) == (5, 30)
    assert resolve_fix_window("complex", duration_minutes=45) == (30, 45)


def test_clamps_bad_values():
    assert resolve_fix_window("simple", start_in_minutes=-40) == (0, 30)
    assert resolve_fix_window("simple", duration_minutes=5) == (15, 15)