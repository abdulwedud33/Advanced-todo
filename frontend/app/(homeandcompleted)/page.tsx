"use client";

import { useState, useEffect } from "react";
import ToDoComp from "@/components/ToDoComp";
import { useAuth } from "@/contexts/AuthContext";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchData() {
  const res = await fetch(`${baseUrl}/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.log("Failed to fetch data");
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function Home() {
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const getUserData = async () => {
    try {
      setLoading(true);
      const currentData = await fetchData();
      setData(currentData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      getUserData();
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <>
      {data && data.length > 0 ? (
        <div className="grid justify-center items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-10 mt-4 px-6 mb-15">
          {data?.map((item: any) => (
            <ToDoComp
              value={item._id}
              _id={item._id}
              key={item._id}
              title={item.title}
              content={item.content}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-8">
          <p className="text-gray-500 text-lg">No tasks found. Create your first task!</p>
        </div>
      )}
    </>
  );
}
