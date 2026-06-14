"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

// Thin single-select wrapper over the base-ui Combobox, used for the small fixed
// enum fields (grade, shape). Layout only — no extra styling.
export default function EnumCombobox({
  options,
  value,
  onValueChange,
  placeholder,
}: {
  options: string[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Combobox
      items={options}
      value={value}
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
    >
      <ComboboxInput placeholder={placeholder} />
      {/* pointer-events-auto: the Radix Dialog sets pointer-events:none on the
          body while open, which the portaled combobox popup would otherwise
          inherit, swallowing mouse clicks (keyboard still works). */}
      <ComboboxContent className="pointer-events-auto">
        <ComboboxList>
          {(option: string) => (
            <ComboboxItem key={option} value={option}>
              {option}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
