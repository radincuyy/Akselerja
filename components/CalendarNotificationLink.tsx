"use client";

import type { AppNotification } from "@/lib/notifications";
import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  notificationTitle: string;
  notificationBody: string;
  notificationKey: string;
  children: ReactNode;
};

export default function CalendarNotificationLink({
  href,
  className,
  notificationTitle,
  notificationBody,
  notificationKey,
  children,
}: Props) {
  function handleClick() {
    const notification: AppNotification = {
      id: `calendar-${notificationKey}-${Date.now()}`,
      title: notificationTitle,
      body: notificationBody,
      time: "Baru saja",
      unread: true,
    };
    window.dispatchEvent(
      new CustomEvent("akselerja:notification-created", {
        detail: notification,
      }),
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
