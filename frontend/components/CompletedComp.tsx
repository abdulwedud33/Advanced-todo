"use client";

import { useRouter } from "next/navigation";

interface CompletedCompProps {
  _id: string;
  value: string;
  title: string;
  content: string;
  onRefresh?: () => void;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
const markTaskAsDelete = async (id: string) => {
  try {
    // Get the JWT token from localStorage (consistent with AuthContext)
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token exists
    if (token) {
      // Ensure token has 'Bearer ' prefix if not already present
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers['Authorization'] = authToken;
    }

    const res = await fetch(`${baseUrl}/completed/delete`, {
      method: "DELETE",
      credentials: "include",
      headers,
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      console.log("Failed to delete task");
      throw new Error("Failed to delete task");
    }
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
};

const CompletedComp: React.FC<CompletedCompProps> = (props) => {
  const handleDelete = async () => {
    const success = await markTaskAsDelete(props._id); // Call the delete function
    if (success) {
      // Call the refresh function passed from parent
      if (props.onRefresh) {
        props.onRefresh();
      }
    } else {
      alert("Failed to delete task. Please try again.");
    }
  };

  return (
    <div className="relative flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-3xl mx-auto my-4 overflow-hidden">
      {/* Header with title */}
      <div className="flex justify-center items-center bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-100 text-center">
        <h1 className="text-lg break-words leading-relaxed whitespace-pre-wrap font-bold text-red-600 text-center truncate">
          {props.title}
        </h1>
      </div>

      {/* Content area */}
      <div className="px-6 py-5 bg-white text-center">
        <p className="text-gray-700 text-center text-base leading-relaxed whitespace-pre-wrap break-words">
          {props.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-sm text-gray-500 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </p>

        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 transition-all duration-300 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default CompletedComp;
