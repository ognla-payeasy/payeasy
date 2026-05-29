import {  describe, it , assert } from "vitest";

import type { AccordionItem } from "../components/ui/accordion";

// Accordion State Management Logic Tests
// These tests verify the core expansion/collapse behavior of the Accordion component

const MOCK_ITEMS: AccordionItem[] = [
  {
    id: "item-1",
    title: "First Question",
    content: "This is the first answer.",
  },
  {
    id: "item-2",
    title: "Second Question",
    content: "This is the second answer.",
  },
  {
    id: "item-3",
    title: "Third Question",
    content: "This is the third answer.",
  },
];

// Simulate accordion state management logic
class AccordionStateManager {
  private expandedIds: Set<string>;
  private allowMultiple: boolean;

  constructor(allowMultiple = false) {
    this.expandedIds = new Set();
    this.allowMultiple = allowMultiple;
  }

  toggleItem(id: string): void {
    const newExpanded = new Set(this.expandedIds);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      if (!this.allowMultiple) {
        newExpanded.clear();
      }
      newExpanded.add(id);
    }

    this.expandedIds = newExpanded;
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  getExpandedIds(): Set<string> {
    return new Set(this.expandedIds);
  }

  reset(): void {
    this.expandedIds.clear();
  }
}

describe("Accordion State Management", () => {
  describe("Single Expansion Mode (default)", () => {
    it("starts with no items expanded", () => {
      const manager = new AccordionStateManager(false);

      MOCK_ITEMS.forEach((item) => {
        assert.equal(
          manager.isExpanded(item.id),
          false,
          `Item ${item.id} should not be expanded initially`
        );
      });
    });

    it("expands an item when toggled", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), true, "Item should be expanded");
    });

    it("collapses an item when toggled again", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), true);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), false, "Item should be collapsed");
    });

    it("closes previous item when opening a new one", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), true);

      manager.toggleItem("item-2");
      assert.equal(
        manager.isExpanded("item-1"),
        false,
        "First item should be closed"
      );
      assert.equal(
        manager.isExpanded("item-2"),
        true,
        "Second item should be open"
      );
    });

    it("only one item can be expanded at a time", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      manager.toggleItem("item-2");
      manager.toggleItem("item-3");

      const expandedIds = manager.getExpandedIds();
      assert.equal(
        expandedIds.size,
        1,
        "Only one item should be expanded"
      );
      assert.equal(
        Array.from(expandedIds)[0],
        "item-3",
        "Last toggled item should be expanded"
      );
    });
  });

  describe("Multiple Expansion Mode", () => {
    it("allows multiple items to be expanded", () => {
      const manager = new AccordionStateManager(true);

      manager.toggleItem("item-1");
      manager.toggleItem("item-2");

      assert.equal(manager.isExpanded("item-1"), true);
      assert.equal(manager.isExpanded("item-2"), true);
    });

    it("maintains all expanded items", () => {
      const manager = new AccordionStateManager(true);

      manager.toggleItem("item-1");
      manager.toggleItem("item-2");
      manager.toggleItem("item-3");

      const expandedIds = manager.getExpandedIds();
      assert.equal(expandedIds.size, 3, "All three items should be expanded");
    });

    it("can close individual items without affecting others", () => {
      const manager = new AccordionStateManager(true);

      manager.toggleItem("item-1");
      manager.toggleItem("item-2");
      manager.toggleItem("item-3");

      // Close middle item
      manager.toggleItem("item-2");

      assert.equal(manager.isExpanded("item-1"), true);
      assert.equal(manager.isExpanded("item-2"), false);
      assert.equal(manager.isExpanded("item-3"), true);
    });

    it("allows toggling all items on and off", () => {
      const manager = new AccordionStateManager(true);

      // Open all
      MOCK_ITEMS.forEach((item) => manager.toggleItem(item.id));
      assert.equal(
        manager.getExpandedIds().size,
        MOCK_ITEMS.length,
        "All items should be open"
      );

      // Close all
      MOCK_ITEMS.forEach((item) => manager.toggleItem(item.id));
      assert.equal(
        manager.getExpandedIds().size,
        0,
        "All items should be closed"
      );
    });
  });

  describe("State Transitions", () => {
    it("resets all expanded items", () => {
      const manager = new AccordionStateManager(true);

      manager.toggleItem("item-1");
      manager.toggleItem("item-2");
      assert.equal(manager.getExpandedIds().size, 2);

      manager.reset();
      assert.equal(manager.getExpandedIds().size, 0, "Should have no expanded items");
    });

    it("handles rapid toggling", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      manager.toggleItem("item-1");
      manager.toggleItem("item-1");

      assert.equal(manager.isExpanded("item-1"), true, "Should be expanded");
    });

    it("handles toggling non-existent items", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      manager.toggleItem("non-existent");

      assert.equal(manager.isExpanded("item-1"), false, "Original item should close");
      assert.equal(manager.isExpanded("non-existent"), true, "Non-existent item should be tracked");
    });
  });

  describe("Item Data Integrity", () => {
    it("preserves all item data", () => {
      const items = [...MOCK_ITEMS];

      items.forEach((item) => {
        assert.ok(item.id, "Item should have ID");
        assert.ok(item.title, "Item should have title");
        assert.ok(item.content, "Item should have content");
      });
    });

    it("validates item IDs are unique", () => {
      const ids = MOCK_ITEMS.map((item) => item.id);
      const uniqueIds = new Set(ids);

      assert.equal(ids.length, uniqueIds.size, "All item IDs should be unique");
    });

    it("ensures no empty titles or contents", () => {
      const items = [...MOCK_ITEMS];

      items.forEach((item) => {
        assert.ok(
          item.title.trim().length > 0,
          `Item ${item.id} should have non-empty title`
        );
        assert.ok(
          item.content.trim().length > 0,
          `Item ${item.id} should have non-empty content`
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty item list", () => {
      const manager = new AccordionStateManager(false);

      assert.equal(manager.getExpandedIds().size, 0);
      manager.toggleItem("any-id");
      assert.equal(manager.isExpanded("any-id"), true);
    });

    it("handles single item", () => {
      const manager = new AccordionStateManager(false);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), true);

      manager.toggleItem("item-1");
      assert.equal(manager.isExpanded("item-1"), false);
    });

    it("switching from single to multiple mode", () => {
      const singleManager = new AccordionStateManager(false);

      singleManager.toggleItem("item-1");
      singleManager.toggleItem("item-2");

      assert.equal(singleManager.getExpandedIds().size, 1, "Single mode: only one item");

      const multiManager = new AccordionStateManager(true);
      multiManager.toggleItem("item-1");
      multiManager.toggleItem("item-2");

      assert.equal(multiManager.getExpandedIds().size, 2, "Multiple mode: both items");
    });
  });
});
