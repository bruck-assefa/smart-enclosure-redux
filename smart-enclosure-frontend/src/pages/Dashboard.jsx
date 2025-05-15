import React from "react";
import { ZoneAverages } from "../components/ZoneAverages";
import { LightTimes } from "../components/LightTimes";
import { TemperatureChart } from "../components/TemperatureChart";

function Dashboard() {
  const sampleData = [
    { name: "Hot Zone", temperature: 95.5 },
    { name: "Transition Zone", temperature: 85.2 },
    { name: "Cold Zone", temperature: 72.8 },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center gap-4">
      <div className="w-full max-w-xl flex justify-center">
        <ZoneAverages zones={sampleData} />
      </div>
      <div className="w-full max-w-xl flex justify-center">
        <LightTimes onTime="Sunrise (07:00)" offTime="Sunset (21:00)" />
      </div>
      <div className="w-full max-w-xl flex justify-center">
        <div className="w-full">
          <TemperatureChart />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
