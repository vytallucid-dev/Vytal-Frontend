"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MarketEvent } from "@/app/(main)/calendar/page";
import { Bell, Mail, Smartphone } from "lucide-react";

interface ReminderModalProps {
  event: MarketEvent;
  onClose: () => void;
}

export function ReminderModal({ event, onClose }: ReminderModalProps) {
  const [reminders, setReminders] = useState({
    oneDayBefore: true,
    oneHourBefore: true,
    eventDayMorning: false,
    custom: false,
  });

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });

  const [note, setNote] = useState("");

  const formatEventDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleSetReminder = () => {
    // Here you would implement the actual reminder setting logic
    console.log("Setting reminder:", { event, reminders, notifications, note });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Reminder: {event.company.name}</DialogTitle>
          <DialogDescription>
            {event.eventDetails} - {formatEventDate(event.date)} ({event.time})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Remind Me Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">REMIND ME:</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="oneDayBefore"
                  checked={reminders.oneDayBefore}
                  onCheckedChange={(checked) =>
                    setReminders({ ...reminders, oneDayBefore: checked as boolean })
                  }
                />
                <label
                  htmlFor="oneDayBefore"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  1 day before ({formatEventDate(new Date(event.date.getTime() - 86400000))}, 5:00 PM)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="oneHourBefore"
                  checked={reminders.oneHourBefore}
                  onCheckedChange={(checked) =>
                    setReminders({ ...reminders, oneHourBefore: checked as boolean })
                  }
                />
                <label
                  htmlFor="oneHourBefore"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  1 hour before ({formatEventDate(event.date)}, 3:00 PM)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eventDayMorning"
                  checked={reminders.eventDayMorning}
                  onCheckedChange={(checked) =>
                    setReminders({ ...reminders, eventDayMorning: checked as boolean })
                  }
                />
                <label
                  htmlFor="eventDayMorning"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  On event day morning ({formatEventDate(event.date)}, 9:00 AM)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customTime"
                  checked={reminders.custom}
                  onCheckedChange={(checked) =>
                    setReminders({ ...reminders, custom: checked as boolean })
                  }
                />
                <label
                  htmlFor="customTime"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Custom time
                </label>
              </div>
            </div>
          </div>

          {/* Notification Method Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">NOTIFICATION METHOD:</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushNotif"
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked as boolean })
                  }
                />
                <label
                  htmlFor="pushNotif"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Push notification
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotif"
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked as boolean })
                  }
                />
                <label
                  htmlFor="emailNotif"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsNotif"
                  checked={notifications.sms}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, sms: checked as boolean })
                  }
                  disabled
                />
                <label
                  htmlFor="smsNotif"
                  className="text-sm font-medium leading-none cursor-not-allowed opacity-50 flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  SMS (Premium feature)
                </label>
              </div>
            </div>
          </div>

          {/* Add Note Section */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-semibold">
              ADD NOTE (optional):
            </Label>
            <Input
              id="note"
              placeholder="Expected strong results, watch for guidance..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSetReminder}>
            <Bell className="h-4 w-4 mr-2" />
            Set Reminder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
