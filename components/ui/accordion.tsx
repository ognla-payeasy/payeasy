"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  data?: Record<string, unknown>;
}

export function Accordion({
  items,
  allowMultiple = false,
  data,
}: AccordionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedIds);
    
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      if (!allowMultiple) {
        newExpanded.clear();
      }
      newExpanded.add(id);
    }
    
    setExpandedIds(newExpanded);
  };

  return (
    <div className="w-full space-y-2" data-testid="accordion" data-qa={data?.qa}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isExpanded={expandedIds.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  );
}

interface AccordionItemComponentProps {
  item: AccordionItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccordionItemComponent({
  item,
  isExpanded,
  onToggle,
}: AccordionItemComponentProps) {
  return (
    <div
      className="border border-white/10 rounded-lg overflow-hidden bg-white/[0.02] hover:border-white/20 transition-colors"
      data-testid={`accordion-item-${item.id}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors text-left"
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${item.id}`}
        data-testid={`accordion-trigger-${item.id}`}
      >
        <h3 className="text-sm font-semibold text-white flex-1">
          {item.title}
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
          aria-hidden="true"
        >
          <ChevronDown className="w-5 h-5 text-dark-500" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            id={`accordion-content-${item.id}`}
          >
            <div className="px-5 py-4 border-t border-white/5 text-sm text-dark-500 leading-relaxed">
              {item.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
