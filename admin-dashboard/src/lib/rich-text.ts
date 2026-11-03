export function renderRichText(source: string) {
  const escaped = source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of escaped.split("\n")) {
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(item[1] ?? "")}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      html.push(`<h3>${inline(heading[1] ?? "")}</h3>`);
      continue;
    }
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return html.join("");
}

function inline(text: string) {
  return text
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}
