import React from "react";

export function Sensor({ sensorID = "2", zone = "Transition", temp = "22.12", humidity = "41", pressure = "1104.2" }) {
  return (
    <div className="text-white w-full flex justify-between border border-gray-600 pl-1 pr-1">
      <span>Sensor ID: {sensorID}</span>
      <span>Zone: {zone}</span>
      <span>Temperature: {temp}</span>
      <span>Humidity: {humidity}</span>
      <span>Pressure: {pressure}</span>
    </div>
  );
}
