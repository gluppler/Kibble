/**
 * Date Picker Component
 * 
 * A cross-browser compatible date and time picker using react-datepicker.
 * Replaces native datetime-local input which has inconsistent icon visibility across browsers.
 * 
 * Features:
 * - Works consistently across all browsers (Chrome, Firefox, Safari, Edge)
 * - Supports both light and dark themes
 * - Mobile-friendly with touch support
 * - Accessible with proper ARIA labels
 * - Popper positioning relative to input (no portal overlay)
 * - Automatic position updates on scroll/resize/hover
 * - Proper z-index layering without blocking the page
 */

"use client";

import { forwardRef, useEffect, useRef, memo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

/**
 * Custom input component for the date picker
 * Provides consistent styling and icon across all browsers
 */
const CustomInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { value?: string; onClick?: () => void }>(
  ({ value, onClick, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          {...props}
          ref={ref}
          type="text"
          value={value}
          onClick={onClick}
          readOnly
          placeholder={placeholder}
          className="w-full px-2.5 sm:px-3 py-2 pr-10 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold cursor-pointer"
        />
        <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar 
            size={16} 
            className="text-black dark:text-white" 
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

interface DatePickerProps {
  /**
   * Current date value (ISO string or Date object)
   */
  value?: string | Date | null;
  /**
   * Callback when date changes
   */
  onChange: (date: Date | null) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Input ID for label association
   */
  id?: string;
  /**
   * Title/tooltip text
   */
  title?: string;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
}

/**
 * DatePicker Component
 * 
 * Cross-browser compatible date and time picker with consistent icon visibility.
 */
export const DatePickerInput = memo(function DatePickerInput({
  value,
  onChange,
  placeholder = "Select date and time",
  id,
  title,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const datePickerRef = useRef<any>(null);
  
  // Convert string value to Date object if needed
  const dateValue = value 
    ? typeof value === "string" 
      ? new Date(value) 
      : value
    : null;

  // Validate date
  const validDate = dateValue && !isNaN(dateValue.getTime()) ? dateValue : null;

  // Update picker position on scroll/resize/hover/mutation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updatePosition = () => {
      // Trigger position recalculation by dispatching resize event
      // This forces react-datepicker's popper to recalculate position
      window.dispatchEvent(new Event("resize"));
    };

    // Listen for scroll events to update position
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    
    // Use MutationObserver to detect layout changes (e.g., column hover animations)
    // Optimized to only watch for style/class changes that affect positioning
    let observer: MutationObserver | null = null;
    
    if (typeof document !== "undefined" && document.body) {
      observer = new MutationObserver((mutations) => {
        // Only update if style or class attributes changed (layout-affecting changes)
        const hasRelevantChanges = mutations.some(mutation => 
          mutation.type === "attributes" && 
          (mutation.attributeName === "style" || mutation.attributeName === "class")
        );
        
        if (hasRelevantChanges) {
          updatePosition();
        }
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["style", "class"],
        childList: false, // Don't watch DOM mutations (too expensive)
        subtree: true, // Watch all descendants for style/class changes
      });
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }, []);

  return (
    <div className="w-full relative" style={{ zIndex: 1 }}>
      <DatePicker
        ref={datePickerRef}
        selected={validDate}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MM/dd/yyyy HH:mm"
        placeholderText={placeholder}
        customInput={<CustomInput />}
        id={id}
        title={title}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        wrapperClassName="w-full"
        popperClassName="date-picker-popper"
        calendarClassName="date-picker-calendar"
        popperPlacement="bottom-start"
        onCalendarOpen={() => {
          // Force position update when calendar opens
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 0);
          }
        }}
        onInputClick={() => {
          // Update position when input is clicked (before calendar opens)
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          }
        }}
      />
    </div>
  );
});

DatePickerInput.displayName = "DatePickerInput";
