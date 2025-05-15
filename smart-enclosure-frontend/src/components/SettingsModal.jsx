import React from "react";

function SettingsModal({ isOpen, onClose }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md ${isOpen ? 'block' : 'hidden'}`}>
      <div className="p-6 rounded-lg shadow-lg w-96 border border-gray-300 rounded">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="mb-4">
          <label className="block mb-1">Option 1:</label>
          <input type="text" className="w-full p-2 border border-gray-300 rounded" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Option 2:</label>
          <input type="text" className="w-full p-2 border border-gray-300 rounded" />
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-500 text-white rounded mr-2" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
