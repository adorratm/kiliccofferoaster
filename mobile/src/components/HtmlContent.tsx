import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../ui';

function wrapHtml(html: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: ${colors.bg}; color: ${colors.text}; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; line-height: 1.55; }
    a { color: ${colors.accentSoft}; }
    h1, h2, h3, h4, strong { color: ${colors.text}; }
    p, li { color: ${colors.muted}; }
    img, video { max-width: 100%; height: auto; }
    ul, ol { padding-left: 1.2em; }
  </style>
</head>
<body>
  ${html}
  <script>
    function post() {
      var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.ReactNativeWebView.postMessage(String(h));
    }
    window.addEventListener('load', post);
    setTimeout(post, 80);
    setTimeout(post, 400);
  </script>
</body>
</html>`;
}

export function HtmlContent({ html }: { html: string }) {
  const [height, setHeight] = useState(160);
  const source = useMemo(() => ({ html: wrapHtml(html || '') }), [html]);

  return (
    <View style={{ height, backgroundColor: colors.bg }}>
      <WebView
        originWhitelist={['*']}
        source={source}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        style={{ backgroundColor: colors.bg, height }}
        onMessage={(e) => {
          const next = Number(e.nativeEvent.data);
          if (Number.isFinite(next) && next > 40) setHeight(Math.ceil(next) + 8);
        }}
      />
    </View>
  );
}
