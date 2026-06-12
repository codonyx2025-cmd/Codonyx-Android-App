import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useKeywordSuggestions } from "@/hooks/useKeywordSuggestions";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  /** The field_name in keyword_suggestions table to load suggestions from */
  suggestionField?: string;
}

export function TagInput({ value, onChange, placeholder, id, suggestionField }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions } = useKeywordSuggestions(suggestionField || "");

  // Parse comma-separated string into array
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];

  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showOther = inputValue.trim() &&
    !suggestions.some(s => s.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !tags.includes(inputValue.trim());

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      onChange(newTags.join(", "));
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSuggestions = suggestionField && suggestions.length > 0;
  const hasDropdownItems = filteredSuggestions.length > 0 || showOther;

  const colors = [
    "bg-teal-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-sky-400",
    "bg-rose-400",
    "bg-violet-400",
    "bg-orange-400",
    "bg-lime-400",
  ];

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative">
        <div className="relative flex items-center">
          {hasSuggestions && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          )}
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (hasSuggestions) setIsOpen(true);
            }}
            onFocus={() => {
              if (hasSuggestions) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("flex-1", hasSuggestions && "pl-9 pr-9")}
          />
          {hasSuggestions && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && hasSuggestions && hasDropdownItems && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  addTag(suggestion);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-b-0"
              >
                {suggestion}
              </button>
            ))}
            {showOther && (
              <button
                type="button"
                onClick={() => {
                  addTag(inputValue.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-primary font-medium"
              >
                Other: "{inputValue.trim()}"
              </button>
            )}
          </div>
        )}

        {/* If no suggestions configured, show simple Add button */}
        {!hasSuggestions && (
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              disabled={!inputValue.trim()}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => {
            const colorClass = colors[index % colors.length];
            return (
              <Badge
                key={index}
                variant="secondary"
                className={`px-3 py-1 text-sm font-medium gap-1.5 ${colorClass} text-black hover:opacity-90`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-black/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
