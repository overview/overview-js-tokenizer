tokenize = require('../index').tokenize;
expect = require('chai').expect;

describe('tokenize', function() {
  function test(input, expectedOutput, message) {
    it("should tokenize " + message, function() {
      expect(tokenize(input)).to.deep.eq(expectedOutput);
    });
  }

  test('This is a simple string', [ 'This', 'is', 'a', 'simple', 'string' ], 'a simple string');
  test("the foo's bar", [ "the", "foo's", "bar" ], 'a string with a possessive apostrophe');
  test('the "foo" bar', [ 'the', 'foo', 'bar' ], 'a string with quotes');
  test("the 'foo' bar", [ 'the', 'foo', 'bar' ], 'a string with single quotes');
  test("the ``foo'' bar", [ 'the', 'foo', 'bar' ], 'a string with `` and \'\' quotes');
  test('Mr. Smith', [ 'Mr', 'Smith' ], 'a string with a period');
  test('out-of-the-box', [ 'out', 'of', 'the', 'box' ], 'a string with a hyphenated word');
  test('walk 1,000.000,003 miles', [ 'walk', '1,000.000,003', 'miles' ], 'a string with a punctuated numeral');
  test('hello, there', [ 'hello', 'there' ], 'a string with a comma');
  test("the peoples' republic", [ 'the', 'peoples', 'republic' ], 'a string with a plural-possessive apostrophe');
  test(
    'The quick (“brown”) fox can’t jump 32.3 feet, right?',
    [ 'The', 'quick', 'brown', 'fox', 'can’t', 'jump', '32.3', 'feet', 'right' ],
    'the example string at http://www.unicode.org/reports/tr29/#Word_Boundaries'
  )
  test(
    "The cat's meowed 1,000 times! Really!",
    [ "The", "cat's", "meowed", "1,000", "times", "Really" ],
    'the example string in README.md'
  );
  test('', [], 'an empty string');
  test(' $ ', [], 'a string containing no tokens');
});
