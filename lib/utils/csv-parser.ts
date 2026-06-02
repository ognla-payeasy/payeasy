export interface ParsedEscrow {
  propertyName: string;
  totalRent: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  token: string;
  roommates: string[]; // Roommate Stellar public keys
}

/**
 * Parses a CSV string into an array of ParsedEscrow objects.
 * Handles double-quoted cells (e.g. for roommate addresses).
 */
export function parseCSV(content: string): ParsedEscrow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header row
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
  const results: ParsedEscrow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    const propertyName = row["property_name"] || row["property"] || "";
    const totalRent = row["total_rent"] || row["rent"] || "";
    const deadline = row["deadline"] || "";
    const token = row["token"] || "";
    const roommateStr = row["roommate_addresses"] || row["roommates"] || "";

    // Split roommates by semicolon or space or comma (if they were quoted)
    const roommates = roommateStr
      .split(/[;,\s]+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    results.push({
      propertyName,
      totalRent,
      deadline,
      token,
      roommates,
    });
  }

  return results;
}
