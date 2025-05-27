"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Upload } from "lucide-react";

interface NoDataAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NoDataAlert({ isOpen, onClose }: NoDataAlertProps) {
  const router = useRouter();

  const handleGoToUpload = () => {
    onClose();
    router.push("/upload");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>No Customer Data Found</DialogTitle>
          </div>
          <DialogDescription className="mt-3">
            It looks like there`&apos;s no customer data available in the
            system. To get started with risk analysis and dashboard insights,
            you`&apos;ll need to upload your customer transaction data first.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <div className="text-sm text-muted-foreground">
            <strong>What you can upload:</strong>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• CSV files with customer transaction data</li>
            <li>• Excel files (.xlsx, .xls) with customer information</li>
            <li>
              • Data should include customer IDs, invoice amounts, and payment
              history
            </li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Continue Anyway
          </Button>
          <Button onClick={handleGoToUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
