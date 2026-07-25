export interface TradeSearch {
  tags: string[];
  date?: string;
  from?: string;
  to?: string;
  text: string;
  errors: string[];
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const tokenPattern = /(?:[^\s"]+|"[^"]*")+/g;

function unquote(value: string): string {
  return value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}

function quote(value: string): string {
  return /\s/.test(value) ? `"${value.replaceAll('"', "")}"` : value;
}

export function parseTradeSearchQuery(query: string): TradeSearch {
  const search: TradeSearch = { tags: [], text: "", errors: [] };
  const text: string[] = [];

  for (const token of query.match(tokenPattern) ?? []) {
    const separator = token.indexOf(":");
    const field = separator > 0 ? token.slice(0, separator).toLowerCase() : "";
    const value = separator > 0 ? unquote(token.slice(separator + 1)) : "";

    if (field === "tag") {
      if (value && !search.tags.includes(value.toLowerCase())) {
        search.tags.push(value.toLowerCase());
      } else if (!value) {
        search.errors.push("A tag filter needs a value.");
      }
      continue;
    }

    if (field === "date" || field === "from" || field === "to") {
      if (!datePattern.test(value)) {
        search.errors.push(`${field}: requires a YYYY-MM-DD date.`);
      } else {
        search[field] = value;
      }
      continue;
    }

    text.push(unquote(token));
  }

  search.text = text.join(" ").trim();
  return search;
}

export function serializeTradeSearch(search: TradeSearch): string {
  return [
    ...search.tags.map((tag) => `tag:${quote(tag)}`),
    search.date ? `date:${search.date}` : "",
    search.from ? `from:${search.from}` : "",
    search.to ? `to:${search.to}` : "",
    search.text,
  ]
    .filter(Boolean)
    .join(" ");
}

export function toggleTradeSearchTag(query: string, tag: string): string {
  const search = parseTradeSearchQuery(query);
  const normalizedTag = tag.trim().toLowerCase();
  search.tags = search.tags.includes(normalizedTag)
    ? search.tags.filter((candidate) => candidate !== normalizedTag)
    : [...search.tags, normalizedTag];
  return serializeTradeSearch(search);
}

export function setTradeSearchDateRange(
  query: string,
  firstDate: string,
  secondDate = firstDate,
): string {
  const search = parseTradeSearchQuery(query);
  const [from, to] = [firstDate, secondDate].sort();
  search.date = from === to ? from : undefined;
  search.from = from === to ? undefined : from;
  search.to = from === to ? undefined : to;
  return serializeTradeSearch(search);
}

export function clearTradeSearchDates(query: string): string {
  const search = parseTradeSearchQuery(query);
  search.date = undefined;
  search.from = undefined;
  search.to = undefined;
  return serializeTradeSearch(search);
}
