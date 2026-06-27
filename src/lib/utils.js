export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(value, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency
  }).format(Number(value || 0));
}

export function formatDate(value, options = {}) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options
  }).format(new Date(value));
}

export function titleCase(value = "") {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || "Something went wrong.";
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function isWithinDays(dateValue, days) {
  const date = new Date(dateValue);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}
