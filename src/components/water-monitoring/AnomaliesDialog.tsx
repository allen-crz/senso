
import React from "react";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Anomaly {
  date: string;
  type: string;
  percentage: string;
  description: string;
}

interface AnomaliesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anomalies: Anomaly[];
}

const AnomaliesDialog: React.FC<AnomaliesDialogProps> = ({
  open,
  onOpenChange,
  anomalies,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md max-w-[90%] w-[500px] mx-auto rounded-xl" 
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DialogTitle>Past Anomalies</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pt-2">
          {anomalies.map((anomaly, index) => {
            // Parse the date string to create a Date object
            const anomalyDate = new Date(anomaly.date);
            // Format the date and time
            const formattedDateTime = anomalyDate.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={index} className="p-4 bg-red-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-red-600">{anomaly.type}</p>
                    <p className="text-sm text-gray-500">{formattedDateTime}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                    {anomaly.percentage}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{anomaly.description}</p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnomaliesDialog;
