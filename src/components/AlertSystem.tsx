'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bus, Clock, AlertTriangle, School, MapPin } from 'lucide-react';

interface AlertSystemProps {
  busId: string;
  fiveMinuteAlert: boolean;
  onFiveMinuteAlertClose: () => void;
  collegeExitAlert: boolean;
  onCollegeExitAlertClose: () => void;
  eta?: number;
  journeyStage?: 'toUser' | 'toCollege';
}

export default function AlertSystem({
  busId,
  fiveMinuteAlert,
  onFiveMinuteAlertClose,
  collegeExitAlert,
  onCollegeExitAlertClose,
  eta = 5,
  journeyStage = 'toUser',
}: AlertSystemProps) {

  React.useEffect(() => {
    console.log('AlertSystem props:', {
      busId,
      fiveMinuteAlert,
      collegeExitAlert,
      eta
    });
  }, [busId, fiveMinuteAlert, collegeExitAlert, eta]);

  return (
    <>

      <AlertDialog open={fiveMinuteAlert} onOpenChange={onFiveMinuteAlertClose}>
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 w-[85vw] sm:w-full max-w-[400px] z-[9999] border-2 border-orange-500 p-5 rounded-xl gap-3">
          <AlertDialogHeader className="space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="w-7 h-7 text-orange-600 dark:text-orange-400 animate-pulse" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold leading-tight">
              {journeyStage === 'toUser' ? 'Bus Approaching!' : 'Reaching Destination'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-sm text-muted-foreground">
                  {journeyStage === 'toUser' ? (
                    <>
                      <span className="font-semibold text-foreground">Bus {busId}</span> is approximately{' '}
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                        {Math.round(eta)} mins
                      </span>{' '}
                      away.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">Bus {busId}</span> will reach the destination in{' '}
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                        {Math.round(eta)} mins
                      </span>.
                    </>
                  )}
                </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {journeyStage === 'toUser' 
                        ? 'Get ready at your pickup point!' 
                        : 'Reaching College soon'}
                    </span>
                  </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={onFiveMinuteAlertClose}
              className="w-full bg-orange-600 hover:bg-orange-700 text-sm font-medium h-10 rounded-lg"
            >
              Got it! I'm Ready 🚶‍♂️
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={collegeExitAlert} onOpenChange={onCollegeExitAlertClose}>
        <AlertDialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 w-[85vw] sm:w-full max-w-[400px] z-[9999] border-2 border-blue-500 p-5 rounded-xl gap-3">
          <AlertDialogHeader className="space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <School className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold leading-tight">
              Bus Left College
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Bus {busId}</span> has departed from{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    MJ College
                  </span>.
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      Heading to pickup locations
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={onCollegeExitAlertClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm font-medium h-10 rounded-lg"
            >
              Track My Bus 📍
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
