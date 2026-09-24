/**
 * Trusted script appended to sanitized author HTML before srcdoc.
 * - Click interceptor: posts navigate messages (uses getAttribute('href')).
 * - Height reporter: posts resize so the parent owns scrolling.
 *
 * Uses targetOrigin '*' because the frame has an opaque origin ("null").
 */
const FRAME_BRIDGE_SCRIPT = `<script>
(function () {
  function post(msg) {
    parent.postMessage(msg, '*');
  }

  function reportHeight() {
    var doc = document.documentElement;
    var body = document.body;
    var height = Math.max(
      doc ? doc.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    post({ type: 'resize', height: height });
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || typeof el.closest !== 'function') return;
    var a = el.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    var trimmed = href.trim();
    if (
      !trimmed ||
      trimmed.charAt(0) === '#' ||
      /^mailto:/i.test(trimmed) ||
      /^javascript:/i.test(trimmed)
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    post({ type: 'navigate', address: trimmed });
  }, true);

  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function () {
      reportHeight();
    });
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);
  }

  window.addEventListener('load', reportHeight);
  if (document.readyState === 'complete') {
    reportHeight();
  } else {
    document.addEventListener('DOMContentLoaded', reportHeight);
  }
  reportHeight();
})();
</script>`;

/**
 * Append the trusted frame-bridge script to sanitized HTML for srcdoc.
 * Author HTML is already sanitized at write time — never re-sanitize here
 * (would strip this script).
 */
export function injectFrameScript(html: string): string {
  return `${html}\n${FRAME_BRIDGE_SCRIPT}`;
}
