#include <memory>

#include <node.h>
#include <unicode/brkiter.h>
#include <unicode/regex.h>
#include <v8.h>

void Tokenize(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);

  v8::String::Value argString(args[0]);

  UErrorCode status = U_ZERO_ERROR;

  std::auto_ptr<BreakIterator> breakIterator(BreakIterator::createWordInstance(Locale::getUS(), status));
  if (U_FAILURE(status)) {
    isolate->ThrowException(v8::Exception::Error(
      v8::String::NewFromUtf8(isolate, "Unknown error calling BreakIterator::createWordInstance()")
    ));
    return;
  }

  icu::UnicodeString unicodeString(false, *argString, argString.length());
  breakIterator->setText(unicodeString);

  v8::Handle<v8::Array> retArray(v8::Array::New(isolate, 0));
  size_t retArrayPosition = 0;

  icu::RegexMatcher tokenMatcher("\\w", 0, status);
  if (U_FAILURE(status)) {
    isolate->ThrowException(v8::Exception::Error(
      v8::String::NewFromUtf8(isolate, "Failed to compile Unicode regex")
    ));
    return;
  }

  for (
    size_t start = breakIterator->first(), end = breakIterator->next();
    static_cast<int32_t>(end) != BreakIterator::DONE;
    start = end, end = breakIterator->next()
  ) {
    icu::UnicodeString maybeToken(unicodeString.tempSubStringBetween(start, end));

    tokenMatcher.reset(maybeToken);
    if (tokenMatcher.find()) {
      v8::Handle<v8::String> token(
        v8::String::NewFromTwoByte(isolate, maybeToken.getBuffer(), v8::String::kNormalString, maybeToken.length())
      );
      retArray->Set(retArrayPosition++, token);
    }
  }

  args.GetReturnValue().Set(retArray);
}

void init(v8::Handle<v8::Object> exports) {
  NODE_SET_METHOD(exports, "tokenize", Tokenize);
}

NODE_MODULE(tokenize, init)
