import React from "react";
import { SensorsSection } from "../components/SensorsSection";
import { LightTimingSection } from "../components/LightTimingSection";

function SettingsModal({ isOpen, onClose }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md ${isOpen ? 'block' : 'hidden'}`}>
      <div className="p-6 rounded-lg shadow-lg w-200 border border-gray-300 rounded overflow-y-auto scrollbar-none max-h-[80vh]">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        
        <SensorsSection />
        <LightTimingSection />

        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
