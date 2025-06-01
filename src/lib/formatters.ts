import { Address } from "../types/companies-house.js";

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Not available";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/**
 * Format an address object into a human-readable string
 */
export function formatAddress(address: Address): string {
  if (!address) return "Address not available";

  const parts = [
    address.premises,
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.region,
    address.country,
    address.postal_code
  ];

  return parts.filter(Boolean).join("\n");
} 