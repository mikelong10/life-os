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
    <div className="flex flex-col h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-2.5rem)]">
      <div className="flex items-center justify-between border-b px-4 py-3">
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
