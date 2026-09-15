"""A query language for filtering TestResults.

Grammar (AND binds tighter than OR; parentheses override):

    expr       := or_expr
    or_expr    := and_expr (OR and_expr)*
    and_expr   := term (AND term)*
    term       := condition | "(" or_expr ")"
    condition  := FIELD OP VALUE
    FIELD      := build | overall_test_rate | <any subsystem test column>
    OP         := "=" | "==" | "!=" | "<" | "<=" | ">" | ">="
    VALUE      := "quoted string" | number

Examples:
    build = "death_star_iter_139.001"
    build = "death_star_iter_139.001" OR build = "death_star_iter_139.002"
    (overall_test_rate < 92) AND (superlaser_concentration_static_check > 95)
    (overall_test_rate < 92) OR (superlaser_concentration_static_check > 95)

"""
import re

from sqlalchemy import and_, or_

from .models import TestResults, SUBSYSTEM_TEST_FIELDS

# field name -> expected Python type for its VALUE
FILTERABLE_FIELDS = {'build': str, 'overall_test_rate': float}
FILTERABLE_FIELDS.update({field: float for field in SUBSYSTEM_TEST_FIELDS})

_TOKEN_RE = re.compile(r'''
    \s*(?:
        (?P<LPAREN>\()
      | (?P<RPAREN>\))
      | (?P<AND>(?i:AND)\b)
      | (?P<OR>(?i:OR)\b)
      | (?P<OP><=|>=|!=|==|=|<|>)
      | (?P<STRING>"(?:[^"\\]|\\.)*")
      | (?P<NUMBER>-?\d+(?:\.\d+)?)
      | (?P<FIELD>[A-Za-z_][A-Za-z0-9_]*)
    )
''', re.VERBOSE)


class QuerySyntaxError(Exception):
    pass


def _tokenize(text: str):
    tokens = []
    pos = 0
    while pos < len(text):
        match = _TOKEN_RE.match(text, pos)
        if not match or match.end() == pos:
            raise QuerySyntaxError(f"Unexpected character at position {pos}: {text[pos:pos + 10]!r}")
        pos = match.end()
        tokens.append((match.lastgroup, match.group().strip()))
    return tokens


class _Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.i = 0

    def _peek(self):
        return self.tokens[self.i] if self.i < len(self.tokens) else (None, None)

    def _advance(self):
        token = self._peek()
        self.i += 1
        return token

    def _expect(self, kind):
        token_kind, token_value = self._peek()
        if token_kind != kind:
            raise QuerySyntaxError(f"Expected {kind} but got {token_kind or 'end of input'} ({token_value!r})")
        return self._advance()

    def parse(self):
        expr = self._parse_or()
        if self._peek()[0] is not None:
            raise QuerySyntaxError(f"Unexpected trailing token: {self._peek()[1]!r}")
        return expr

    def _parse_or(self):
        clauses = [self._parse_and()]
        while self._peek()[0] == 'OR':
            self._advance()
            clauses.append(self._parse_and())
        return clauses[0] if len(clauses) == 1 else or_(*clauses)

    def _parse_and(self):
        clauses = [self._parse_term()]
        while self._peek()[0] == 'AND':
            self._advance()
            clauses.append(self._parse_term())
        return clauses[0] if len(clauses) == 1 else and_(*clauses)

    def _parse_term(self):
        if self._peek()[0] == 'LPAREN':
            self._advance()
            expr = self._parse_or()
            self._expect('RPAREN')
            return expr
        return self._parse_condition()

    def _parse_condition(self):
        _, field_name = self._expect('FIELD')
        if field_name not in FILTERABLE_FIELDS:
            raise QuerySyntaxError(
                f"Unknown field '{field_name}'. Valid fields: {', '.join(sorted(FILTERABLE_FIELDS))}"
            )

        _, operator = self._expect('OP')

        value_kind, value_raw = self._advance()
        if value_kind == 'STRING':
            value = value_raw[1:-1].replace('\\"', '"')
        elif value_kind == 'NUMBER':
            value = float(value_raw)
        else:
            raise QuerySyntaxError(f"Expected a value but got {value_kind or 'end of input'} ({value_raw!r})")

        expected_type = FILTERABLE_FIELDS[field_name]
        if expected_type is str and not isinstance(value, str):
            raise QuerySyntaxError(f"Field '{field_name}' expects a quoted string value.")
        if expected_type is float and isinstance(value, str):
            raise QuerySyntaxError(f"Field '{field_name}' expects a numeric value.")

        column = getattr(TestResults, field_name)
        if operator in ('=', '=='):
            return column == value
        if operator == '!=':
            return column != value
        if operator == '<':
            return column < value
        if operator == '<=':
            return column <= value
        if operator == '>':
            return column > value
        if operator == '>=':
            return column >= value
        raise QuerySyntaxError(f"Unsupported operator '{operator}'.")  # pragma: no cover


def parse_query_expression(text: str):
    """Parse a boolean filter expression into a SQLAlchemy filter clause.

    Raises QuerySyntaxError on invalid syntax, unknown fields, or a
    value type mismatch (e.g. a string compared against a numeric field).
    """
    return _Parser(_tokenize(text)).parse()
