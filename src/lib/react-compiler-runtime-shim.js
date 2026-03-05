// Shim for react/compiler-runtime (React 19 feature)
// Required because sanity@5.x depends on @portabletext/plugin-markdown-shortcuts
// which imports react/compiler-runtime, unavailable in React 18.
'use strict';

module.exports = {
  c: function (size) {
    return new Array(size);
  },
};
