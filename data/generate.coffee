fs = require('fs')
UnicodeTrieBuilder = require('unicode-trie/builder')

DataFile = __dirname + '/WordBreakProperty.txt'

trie = new UnicodeTrieBuilder

categories = [] # there are only 15, so no need to index them
categoryIndices = {} # hash of String -> index

addCodepoint = (codepoint, category) ->
  categoryIndex = if category of categoryIndices
    categoryIndices[category]
  else
    categories.push(category)
    categoryIndices[category] = categories.length - 1

  trie.set(codepoint, categoryIndex)

# Expands a Unicode Character Database list of numbers to actual numbers.
#
# 0022 -> [ 0x22 ]
# 05D0..05D2 -> [ 0x5D0, 0x5D1, 0x5D2 ]
expandRange = (string) ->
  if (m = /([a-f0-9]+)\.\.([a-f0-9]+)/i.exec(string))?
    i1 = parseInt(m[1], 16)
    i2 = parseInt(m[2], 16)
    [ i1 .. i2 ]
  else
    [ parseInt(string, 16) ]

# The gist of this parser comes from https://github.com/devongovett/codepoints/blob/master/parser.coffee
data = fs.readFileSync(DataFile, 'ascii')
for line in data.split('\n')
  continue if line.length == 0
  continue if line[0] == '#'
  [ range, category ] = line.split(/[\s;]+/, 3)
  for codepoint in expandRange(range)
    addCodepoint(codepoint, category)

fs.writeFileSync(__dirname + '/WordBreakProperty.trie', trie.toBuffer())

categoryJs = 'module.exports = {\n'
categoryJs += ("  #{category}: #{i}" for category, i in categories).join(',\n')
categoryJs += '\n};\n'
fs.writeFileSync(__dirname + '/WordBreakPropertyCategories.js', categoryJs, 'ascii');
