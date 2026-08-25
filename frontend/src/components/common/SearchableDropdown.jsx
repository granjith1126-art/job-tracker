import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Check } from 'lucide-react';

export default function SearchableDropdown({
  items = [],
  selectedItems = [],
  onSelect,
  placeholder = "Search and select...",
  buttonLabel = "Add",
  allowCustom = true,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items
  const filteredItems = items.filter(item => {
    const name = typeof item === 'string' ? item : (item.name || item.title || '');
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (item) => {
    const val = typeof item === 'string' ? item : (item.name || item.title || '');
    if (val && !selectedItems.includes(val)) {
      onSelect(val);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomAdd = () => {
    const trimmed = searchTerm.trim();
    if (trimmed && !selectedItems.includes(trimmed)) {
      onSelect(trimmed);
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        const top = filteredItems[0];
        const val = typeof top === 'string' ? top : (top.name || top.title || '');
        if (!selectedItems.includes(val)) {
          handleSelect(top);
        } else if (allowCustom) {
          handleCustomAdd();
        }
      } else if (allowCustom) {
        handleCustomAdd();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2 bg-slate-900/60 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleCustomAdd}
          disabled={!searchTerm.trim() || selectedItems.includes(searchTerm.trim())}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {buttonLabel}
        </button>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 custom-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const name = typeof item === 'string' ? item : (item.name || item.title || '');
              const category = typeof item === 'object' ? item.category : null;
              const isSelected = selectedItems.includes(name);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isSelected && handleSelect(item)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-800/40 text-slate-500 cursor-default'
                      : 'text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 active:bg-indigo-600/30'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{name}</span>
                    {category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 font-normal">
                        {category}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-medium shrink-0 ml-2">
                      <Check className="w-3 h-3" /> Added
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-xs text-slate-400">
              {allowCustom && searchTerm.trim() ? (
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add custom: "{searchTerm.trim()}"
                </button>
              ) : (
                "No matching options found"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

