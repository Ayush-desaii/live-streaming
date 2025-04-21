import React, { useState, useEffect } from "react";

const StreamDetailsPopup = ({ setFormData }) => {
  const [showPopup, setShowPopup] = useState(true);
  const [localData, setLocalData] = useState({ name: "", title: "" });

  const handleChange = (e) => {
    setLocalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    localStorage.setItem("streamDetails", JSON.stringify(localData));
    setFormData(localData);
    setShowPopup(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("streamDetails");
    if (saved) {
      setFormData(JSON.parse(saved));
      setShowPopup(false); // Auto-hide if data already exists
    }
  }, [setFormData]);

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Enter Stream Details</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          value={localData.name}
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <input
          type="text"
          name="title"
          placeholder="Title"
          onChange={handleChange}
          value={localData.title}
          className="w-full mb-4 px-4 py-2 border rounded"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamDetailsPopup;
