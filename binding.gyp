{
  "targets": [
    {
      "target_name": "tokenize",
      "sources": [ "src/tokenize.cc" ],
      "conditions": [
        ['OS=="linux"', {
          'cflags_cc': [
            '<!@(pkg-config icu-i18n --cflags)'
          ],
          'libraries': [
            '<!@(pkg-config icu-i18n --libs)'
          ]
        }]
      ]
    }
  ]
}
