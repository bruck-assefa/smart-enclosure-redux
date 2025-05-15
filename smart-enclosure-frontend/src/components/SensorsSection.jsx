import React from 'react';
import { Sensor } from "./Sensor";

export function SensorsSection({ zone, temperature }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Sensors</h3>
      <Sensor />
      <Sensor />
      <Sensor />
      <Sensor />
      <Sensor />
      <Sensor />
      <Sensor />
      <Sensor />
    </div>
  );
}
