'use strict';

var UnicodeTrie = require('unicode-trie');
var fs = require('fs');

var Trie = new UnicodeTrie(fs.readFileSync(__dirname + '/../data/WordBreakProperty.trie'));
var Categories = require('../data/WordBreakPropertyCategories');
var C = Categories;

function isAHLetter(c) { return c === C.ALetter || c === C.Hebrew_Letter; }
function isMidLetterOrMidNumLetQ(c) { return c === C.MidLetter || c === C.MidNumLet || c === C.Single_Quote; }
function isMidNumOrMidNumLetQ(c) { return c === C.MidNum || c === C.MidNumLet || c === C.Single_Quote; }
function isExtendOrFormat(c) { return c === C.Extend || c === C.Format; }
function isNewlineOrCrOrLf(c) { return c === C.Newline || c === C.CR || c === C.LF; }

/**
 * Returns what to do at the position between c2 and c3.
 *
 * The input values are codepoint _categories_, not the codepoints themselves.
 *
 * The word boundary rules at
 * http://www.unicode.org/reports/tr29/#Word_Boundary_Rules can have up to
 * two characters on the left and two characters on the right. That's why
 * we have four inputs here. To process a string, we need to read two
 * characters ahead of a position to know whether it makes up a boundary.
 *
 * According to the tables at said list of rules, c1 and c2 are to the left of
 * the operator; c3 and c4 are to the right.
 *
 * The return values mean:
 *
 * * ÷: this is a word break
 * * ×: this is not a word break
 * * →: skip the character at c3
 */
function findOperation(c1, c2, c3, c4) {
  if (c2 === null && c3 !== null) {
    // "Break at the start and end of text"
    return '÷'; // WB1
  } else if (c2 !== null && c3 === null) {
    return '÷'; // WB2
  } else if (c2 === C.CR && c3 === C.LF) {
    // "Do not break within CRLF"
    return '×'; // WB3
  } else if (isNewlineOrCrOrLf(c2)) {
    // "Otherwise break before and after Newlines (including CR and LF)"
    return '÷'; // WB3a
  } else if (isNewlineOrCrOrLf(c3)) {
    return '÷'; // WB3b
  } else if (c1 !== null && isExtendOrFormat(c2)) {
    // "Ignore Format and Extend characters, except when they appear at the beginning of a region of text"
    return '→'; // WB4
  } else if (isAHLetter(c2) && isAHLetter(c3)) {
    // "Do not break between most letters"
    return '×'; // WB5
  } else if (isAHLetter(c2) && isMidLetterOrMidNumLetQ(c3) && isAHLetter(c4)) {
    // "Do not break letters across certain punctuation"
    return '×'; // WB6
  } else if (isAHLetter(c1) && isMidLetterOrMidNumLetQ(c2) && isAHLetter(c3)) {
    return '×'; // WB7
  } else if (c2 === C.Hebrew_Letter && c3 === C.Single_Quote) {
    return '×'; // WB7a
  } else if (c2 === C.Hebrew_Letter && c3 === C.Double_Quote && c4 === C.Hebrew_Letter) {
    return '×'; // WB7b
  } else if (c1 === C.Hebrew_Letter && c2 === C.Double_Quote && c3 === C.Hebrew_Letter) {
    return '×'; // WB7c
  } else if (c2 === C.Numeric && c3 === C.Numeric) {
    // "Do not break within sequences of digits, or digits adjacent to letters (“3a”, or “A3”)"
    return '×'; // WB8
  } else if (isAHLetter(c2) && c3 === C.Numeric) {
    return '×'; // WB9
  } else if (c2 === C.Numeric && isAHLetter(c3)) {
    return '×'; // WB10
  } else if (c1 === C.Numeric && isMidNumOrMidNumLetQ(c2) && c3 === C.Numeric) {
    // "Do not break within sequences, such as “3.2” or “3,456.789”"
    return '×'; // WB11
  } else if (c2 === C.Numeric && isMidNumOrMidNumLetQ(c3) && c4 === C.Numeric) {
    return '×'; // WB12
  } else if (c2 === C.Katakana && c3 === C.Katakana) {
    // "Do not break between Katakana"
    return '×'; // WB13
  } else if (
    (c2 === C.ALetter || c2 === C.Hebrew_Letter || c2 === C.Numeric || c2 === C.Katakana || c2 === C.ExtendNumLet)
      && c3 === C.ExtendNumLet) {
    // "Do not break from extenders"
    return '×'; // WB13a
  } else if (c2 === C.ExtendNumLet
      && (c3 === C.ALetter || c3 === C.Hebrew_Letter || c3 === C.Numeric || c3 === C.Katakana)) {
    return '×'; // WB13b
  } else if (c2 === C.Regional_Indicator && c3 === C.Regional_Indicator) {
    // "Do not break between regional indicator symbols"
    return '×'; // WB13c
  } else {
    // "Otherwise, break everywhere (including around ideographs)"
    return '÷'; // WB14
  }
}

/**
 * Given a String (which has boundaries), determine whether it's a token.
 *
 * It's a Token if it includes an alphabetic or numeric character.
 */
function isToken(input) {
  var pos = 0;
  var codepoint; // codepoint at input position pos
  var lowSurrogate = null; // used when handling surrogate pairs
  var c; // category of character at input position pos

  while (pos < input.length) {
    codepoint = input.charCodeAt(pos);
    // Untangle surrogate pairs. Logic copied from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
    if (codepoint >= 0xd800 && codepoint <= 0xdbff) {
      lowSurrogate = input.charCodeAt(pos + 1);
      codepoint = (codepoint - 0xd800) * 0x400 + lowSurrogate - 0xdc00 + 0x10000
    }

    c = Trie.get(codepoint);

    if (c === C.ALetter || c === C.Hebrew_Letter || c === C.Katakana || c === C.Numeric) {
      return true;
    }

    if (lowSurrogate) {
      pos += 2;
    } else {
      pos++;
    }
  }

  return false;
}

/**
 * Given a String and list of boundaries, returns the tokens.
 *
 * For instance, given: ` foo bar `, with boundaries
 * `[ 0, 1, 4, 5, 8, 9 ]`, the result would be `[ 'foo', 'bar' ]`. The
 * algorithm works as though it built all possible strings and then filtered
 * for the ones that include at least one (Katakana|Hebrew|Alphabetic|Numeric)
 * character.
 */
function stringAndBoundariesToTokens(input, boundaries) {
  var tokens = [];

  for (var pos = 1; pos < boundaries.length; pos++) {
    var maybeToken = input.slice(boundaries[pos - 1], boundaries[pos]);
    if (isToken(maybeToken)) { tokens.push(maybeToken); }
  }

  return tokens;
}

module.exports = function(input) {
  var pos = 0; // Current position in the input string
  var wordStart = 0; // Position of beginning of word
  var codepoint; // codepoint at position pos (may be >65535)
  var lowSurrogate = null; // used when handling surrogate pairs
  var c1, c2, c3, c4 = null; // the categories at pos-3, pos-2, pos-1 and pos
  var c3Pos = 0; // this is where we're checking for a boundary
  var op; // what we've decided to do at c3Pos

  var boundaries = []; // Array of all boundary positions. For "the quick", that's [ 0, 3, 4, 9 ].

  function shiftCategories(newCodepoint) {
    c1 = c2;
    c2 = c3;
    c3 = c4;
    if (newCodepoint !== null) {
      c4 = Trie.get(codepoint);
    } else {
      c4 = null;
    }
  }

  function step() {
    switch (findOperation(c1, c2, c3, c4)) {
      case '÷':
        // we found a boundary!
        boundaries.push(c3Pos);
        break;
      case '×':
        // do nothing
        break;
      case '→':
        // skip the character at position 2
        c2 = c1;
        break;
    }

    c3Pos = pos;
  }

  while (pos < input.length) {
    codepoint = input.charCodeAt(pos);
    // Untangle surrogate pairs. Logic copied from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
    if (codepoint >= 0xd800 && codepoint <= 0xdbff) {
      lowSurrogate = input.charCodeAt(pos + 1);
      codepoint = (codepoint - 0xd800) * 0x400 + lowSurrogate - 0xdc00 + 0x10000
    }

    shiftCategories(codepoint);
    if (c3 !== null) step();

    if (lowSurrogate !== null) {
      pos += 2; // skip the low surrogate
      lowSurrogate = null; // so the next iteration doesn't run the above line
    } else {
      pos += 1;
    }
  }

  // Now we need to process c3 and c4...
  shiftCategories(null);
  step();
  shiftCategories(null);
  step();

  return stringAndBoundariesToTokens(input, boundaries);
};
