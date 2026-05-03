import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateDeviceId(): string {
  let deviceId = typeof window !== 'undefined' ? localStorage.getItem('ami_soul_device_id') : null;
  
  if (!deviceId) {
    deviceId = uuidv4();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ami_soul_device_id', deviceId);
    }
  }
  
  return deviceId;
}
