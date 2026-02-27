import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DayNavigator } from "@/components/log/DayNavigator";
import { TimeGrid } from "@/components/log/TimeGrid";
import { todayString, getNextDay, getPrevDay } from "@/lib/dateUtils";

export const Route = createFileRoute("/log")({
  component: LogPage,
});

function LogPage() {
  const [date, setDate] = useState(todayString);

  return (
    <div className="flex flex-col h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px))] md:h-full">
      <div className="flex items-center justify-center border-b px-4 py-3 md:justify-between">
        <DayNavigator
          date={date}
          onPrev={() => setDate(getPrevDay(date))}
          onNext={() => setDate(getNextDay(date))}
          onToday={() => setDate(todayString())}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <TimeGrid date={date} />
      </div>
    </div>
  );
}
