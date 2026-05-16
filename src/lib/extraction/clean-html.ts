import * as cheerio from "cheerio";
import TurndownService from "turndown";

const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "header",
  "footer",
  "nav",
  "form",
  "[aria-hidden='true']",
  "[role='banner']",
  "[role='navigation']",
  "[role='contentinfo']",
  "[hidden]",
  "link",
  "meta",
];

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

turndown.addRule("imageWithLazySrc", {
  filter: (node) => node.nodeName === "IMG",
  replacement: (_content, node) => {
    const img = node as HTMLImageElement;
    const src =
      img.getAttribute("src") ??
      img.getAttribute("data-src") ??
      img.getAttribute("data-lazy-src");
    const alt = img.getAttribute("alt") ?? "";
    if (!src) return "";
    return `![${alt}](${src})`;
  },
});

export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);

  $(STRIP_SELECTORS.join(", ")).remove();
  $("[style*='display:none']").remove();
  $("[style*='display: none']").remove();

  const main = $("main").first();
  const body = main.length ? main : $("body");

  const cleaned = body.html() ?? html;
  const markdown = turndown.turndown(cleaned);

  return markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function truncateForLLM(markdown: string, maxChars = 80_000): string {
  if (markdown.length <= maxChars) return markdown;
  return `${markdown.slice(0, maxChars)}\n\n[content truncated]`;
}

export type ImageCandidate = { url: string; alt?: string };

function parseSrcset(srcset: string): string[] {
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

export function extractImageCandidates(html: string): ImageCandidate[] {
  const $ = cheerio.load(html);
  const seen = new Map<string, string | undefined>();

  const add = (raw: string | undefined, alt?: string) => {
    if (!raw) return;
    const url = raw.trim();
    if (!/^https?:\/\//i.test(url)) return;
    if (/\.svg($|\?)/i.test(url)) return;
    if (!seen.has(url)) seen.set(url, alt);
  };

  $("img").each((_, el) => {
    const $el = $(el);
    const alt = $el.attr("alt")?.trim() || undefined;
    add($el.attr("src"), alt);
    add($el.attr("data-src"), alt);
    add($el.attr("data-lazy-src"), alt);
    add($el.attr("data-original"), alt);
    const srcset = $el.attr("srcset") ?? $el.attr("data-srcset");
    if (srcset) parseSrcset(srcset).forEach((u) => add(u, alt));
  });

  $("source").each((_, el) => {
    const $el = $(el);
    add($el.attr("src"));
    const srcset = $el.attr("srcset") ?? $el.attr("data-srcset");
    if (srcset) parseSrcset(srcset).forEach((u) => add(u));
  });

  $("meta[property='og:image'], meta[name='twitter:image']").each((_, el) => {
    add($(el).attr("content"));
  });

  return Array.from(seen, ([url, alt]) => (alt ? { url, alt } : { url }));
}
