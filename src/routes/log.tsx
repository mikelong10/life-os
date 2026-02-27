import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { DayNavigator } from "@/components/log/DayNavigator";
import { TimeGrid } from "@/components/log/TimeGrid";
import { todayString, getNextDay, getPrevDay } from "@/lib/dateUtils";

export const Route = createFileRoute("/log")({
  component: LogPage,
});

function LogPage() {
  const [date, setDate] = useState(todayString);
  const goToPrevDay = useCallback(() => {
    setDate((currentDate) => getPrevDay(currentDate));
  }, []);
  const goToNextDay = useCallback(() => {
    setDate((currentDate) => getNextDay(currentDate));
  }, []);
  const goToToday = useCallback(() => {
    setDate(todayString());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevDay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextDay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevDay, goToNextDay]);

  return (
    <div className="flex h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px))] flex-col md:h-full">
      <div className="flex items-center justify-center border-b px-4 py-3 md:justify-between">
        <DayNavigator
          date={date}
          onPrev={goToPrevDay}
          onNext={goToNextDay}
          onToday={goToToday}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <TimeGrid date={date} />
      </div>
    </div>
  );
}
