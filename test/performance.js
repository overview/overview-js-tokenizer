#!/usr/bin/env node

var fs = require('fs');

var tokenize = require('../index').tokenize; // native
///var tokenize = require('../lib/tokenize'); // non-native

console.log('Loading and tokenizing some documents');

var t1 = new Date();

function filenameToString(filename) {
  return fs.readFileSync(filename, 'utf-8')
}

var rawInputDocuments = [
  filenameToString(__filename),
  filenameToString(__dirname + '/tokenize-spec.js'),
  filenameToString(__dirname + '/../README.md'),
  filenameToString(__dirname + '/../LICENSE'),
  filenameToString(__dirname + '/../package.json'),
  filenameToString(__dirname + '/../lib/tokenize.js')
];

// Rather than include the complete works of Shakespeare, let's just copy the
// documents a few times

var documents = [];

for (var i = 0; i < 10000; i++) {
  documents.push(rawInputDocuments[i % rawInputDocuments.length]);
}

console.log('Loaded %d documents in %dms. (This is not what we are optimizing)', documents.length, new Date() - t1);

console.log('Tokenizing %d documents...', documents.length);

t1 = new Date();

documents.forEach(function(document) {
  tokenize(document);
});

console.log('Tokenized %d documents in %dms.', documents.length, new Date() - t1);
