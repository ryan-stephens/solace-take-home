"use client";

import { useState, useRef, useEffect } from "react";

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const displayText = selectedValues.length === 0
    ? placeholder
    : selectedValues.length === 1
    ? selectedValues[0]
    : `${selectedValues.length} selected`;

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {selectedValues.length > 0 && `(${selectedValues.length})`}
        </label>
      )}
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#1a4d3e] focus:border-transparent outline-none transition-all flex items-center justify-between"
      >
        <span className={selectedValues.length === 0 ? "text-gray-400" : "text-gray-900"}>
          {displayText}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Select All Option */}
          <div
            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200 flex items-center gap-2 sticky top-0 bg-white"
            onClick={handleSelectAll}
          >
            <input
              type="checkbox"
              checked={selectedValues.length === options.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-[#1a4d3e] border-gray-300 rounded focus:ring-[#1a4d3e]"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-medium text-gray-700">
              {selectedValues.length === options.length ? "Deselect All" : "Select All"}
            </span>
          </div>

          {/* Options */}
          {options.map((option) => (
            <div
              key={option}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => handleToggle(option)}
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => handleToggle(option)}
                className="w-4 h-4 text-[#1a4d3e] border-gray-300 rounded focus:ring-[#1a4d3e]"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-gray-700">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
