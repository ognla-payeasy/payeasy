import test from "node:test";
import assert from "node:assert/strict";
import { parseCSV } from "./csv-parser";

test("parseCSV parses valid CSV with multiple roommates correctly", () => {
  const csv = `property_name,total_rent,deadline,token,roommate_addresses
Apartment 4B,1500,2026-06-30,XLM,"GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8;GBY4H334UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8"
Suite 101,2000,2026-07-15,USDC,GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8
`;

  const results = parseCSV(csv);
  
  assert.equal(results.length, 2);
  
  assert.equal(results[0].propertyName, "Apartment 4B");
  assert.equal(results[0].totalRent, "1500");
  assert.equal(results[0].deadline, "2026-06-30");
  assert.equal(results[0].token, "XLM");
  assert.deepEqual(results[0].roommates, [
    "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
    "GBY4H334UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8"
  ]);

  assert.equal(results[1].propertyName, "Suite 101");
  assert.equal(results[1].totalRent, "2000");
  assert.equal(results[1].deadline, "2026-07-15");
  assert.equal(results[1].token, "USDC");
  assert.deepEqual(results[1].roommates, [
    "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8"
  ]);
});

test("parseCSV handles empty input", () => {
  const results = parseCSV("");
  assert.equal(results.length, 0);
});
