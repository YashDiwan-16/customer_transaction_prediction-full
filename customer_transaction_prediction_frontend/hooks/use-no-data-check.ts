"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useNoDataCheck() {
  const [showNoDataAlert, setShowNoDataAlert] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  const pathname = usePathname();

  // Don't show alert on upload page
  const isUploadPage = pathname === "/upload";

  useEffect(() => {
    const checkCustomerData = async () => {
      // Skip check if on upload page
      if (isUploadPage) {
        setIsCheckingData(false);
        return;
      }

      try {
        setIsCheckingData(true);
        const response = await fetch("/api/customers?limit=1");
        const data = await response.json();

        // Show alert if no customers found
        if (!data.customers || data.customers.length === 0) {
          setShowNoDataAlert(true);
        }
      } catch (error) {
        console.error("Failed to check customer data:", error);
        // Don't show alert if API call fails
      } finally {
        setIsCheckingData(false);
      }
    };

    checkCustomerData();
  }, [isUploadPage]);

  const closeAlert = () => setShowNoDataAlert(false);

  return {
    showNoDataAlert,
    isCheckingData,
    closeAlert,
    isUploadPage,
  };
}
