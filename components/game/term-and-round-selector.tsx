"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TermAndRoundSelectorProps {
  rounds: number;
  term: "short_term" | "medium_term" | "long_term";
  onRoundsChange: (rounds: number) => void;
  onTermChange: (term: "short_term" | "medium_term" | "long_term") => void;
}

export function TermAndRoundSelector({
  rounds,
  term,
  onRoundsChange,
  onTermChange,
}: TermAndRoundSelectorProps) {
  return (
    <div className="flex gap-6 mb-6 w-full pr-8 pl-8">
      <div className="flex flex-col flex-grow max-w-[300px] w-full">
        <Label htmlFor="rounds-select" className="mb-2 text-white font-medium">
          Number of Top Track
        </Label>
        <Select
          value={rounds.toString()}
          onValueChange={(value) => onRoundsChange(parseInt(value))}
        >
          <SelectTrigger className="w-full h-12 rounded-md border border-gray-600 bg-gray-900 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <SelectValue placeholder="Select number" />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col flex-grow max-w-[300px] w-full">
        <Label htmlFor="term-select" className="mb-2 text-white font-medium">
          Time Range
        </Label>
        <Select
          value={term}
          onValueChange={(value) =>
            onTermChange(value as "short_term" | "medium_term" | "long_term")
          }
        >
          <SelectTrigger className="w-full h-12 rounded-md border border-gray-600 bg-gray-900 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_term">Short Term</SelectItem>
            <SelectItem value="medium_term">Medium Term</SelectItem>
            <SelectItem value="long_term">Long Term</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
