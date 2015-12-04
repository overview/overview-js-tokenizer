Tokenizer
=========

The _task_ is simple: take a String as input, and return an Array of Strings,
one per word. Words may repeat.

The _logic_ is not simple.

This tokenizer implements the
[Unicode 8.0 Text Segmentation Algorithm](http://www.unicode.org/reports/tr29/).
That makes it valid for English and European languages; but it's terrible for
Chinese, Japanese, and other languages that do not have any characters between
words.

Usage
-----

You may need to install a prerequisite: `apt-get install libicu-dev` or
`dnf install libicu-devel`. (Node itself depends on ICU; you just need the
development headers.)

Then add overview-js-tokenizer to your project:
`npm install --save overview-js-tokenizer`

Next, use it. It turns a String input into an Array of String tokens:

```javascript
var tokenizer = require('overview-js-tokenizer');
var inputString = "The cat's meowed 1,000 times! Really!";
console.log(tokenizer.tokenize(inputString));
// output: [ "The", "cat's", "meowed", "1,000", "times", "Really" ]
```

Constraints
-----------

The input must be a valid Unicode. In particular, a string like `\uDC00\uD800`
is invalid (it's a low surrogate followed by a high surrogate); that will cause
undefined behavior. (This constraint is true of most programs that deal with
Strings.)

Developing
----------

Download, `npm install`, and run `npm run prepublish` to generate data files.

Run `mocha -w` in the background as you implement features. Write tests in
`test` and code in `lib`.

Memory concerns
---------------

If you're filtering for only a few words out of a huge input String, be aware
that in v8, a reference to even a one-character substring of the huge String
will keep the huge String in memory. See
https://code.google.com/p/v8/issues/detail?id=2869 for more depth and a
workaround.

TODO
----

Pull requests are welcome! In particular, this library could use:

* More unit tests: we really don't test much here
* Options: especially those suggested at http://www.unicode.org/reports/tr29
* Optimization: we have zillions of function calls and allocations

LICENSE
-------

AGPL-3.0. This project is (c) Overview Services Inc. Please contact us should
you desire a more permissive license.
