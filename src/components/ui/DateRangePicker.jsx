import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "../utils/SettingsContext";
import { formatDate } from "../utils/dateUtils";
import DatePicker from "./DatePicker";

export default function DateRangePicker({ startDate, endDate, onRangeChange }) {
    const { settings } = useSettings();
    const [open, setOpen] = useState(false);
    const [tempStart, setTempStart] = useState(startDate);
    const [tempEnd, setTempEnd] = useState(endDate);

    const handleApply = () => {
        onRangeChange(tempStart, tempEnd);
        setOpen(false);
    };

    const handleCancel = () => {
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CustomButton
                    variant="outline"
                    className="w-full md:w-auto justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                        <span>
                            {formatDate(startDate, settings.dateFormat)} - {formatDate(endDate, settings.dateFormat)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">Pick date range</span>
                    )}
                </CustomButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <DatePicker
                            value={tempStart}
                            onChange={(value) => setTempStart(value)}
                            placeholder="Select start date"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <DatePicker
                            value={tempEnd}
                            onChange={(value) => setTempEnd(value)}
                            placeholder="Select end date"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="flex-1"
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton
                            variant="primary"
                            size="sm"
                            onClick={handleApply}
                            className="flex-1"
                        >
                            Apply
                        </CustomButton>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
