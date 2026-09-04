import pytest

from ..query_language import parse_query_expression, QuerySyntaxError


def test_simple_equality():
    parse_query_expression('build = "death_star_iter_139.001"')


def test_or_same_field():
    parse_query_expression('build = "death_star_iter_139.001" OR build = "death_star_iter_139.002"')


def test_and_different_fields():
    parse_query_expression(
        '(overall_test_rate < 92) AND (superlaser_concentration_static_check > 95)'
    )


def test_or_different_fields():
    parse_query_expression(
        '(overall_test_rate < 92) OR (superlaser_concentration_static_check > 95)'
    )


def test_case_insensitive_operators():
    parse_query_expression('overall_test_rate < 92 and overall_test_rate > 10 or build = "x"')


def test_unknown_field_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('not_a_real_field = "x"')


def test_string_value_on_numeric_field_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('overall_test_rate = "not a number"')


def test_numeric_value_on_string_field_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('build = 5')


def test_unbalanced_parentheses_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('(overall_test_rate < 92 AND build = "x"')


def test_empty_query_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('')


def test_trailing_garbage_rejected():
    with pytest.raises(QuerySyntaxError):
        parse_query_expression('build = "x" build')
