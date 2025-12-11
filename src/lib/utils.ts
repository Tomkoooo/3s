import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (fullName: string, maxLength: number = 2) => {
  return fullName.split(' ').map(name => name[0]).join('').slice(0, maxLength);
}

export const getRoleTranslation = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Adminisztrátor';
    case 'auditor':
      return 'Auditor';
    case 'fixer':
      return 'Fixer';
    default:
      return 'Felhasználó';
  }
}

export const loopingNumber = ({
  current,
  min,
  max,
  step = 1,
}: {
  current: number;
  min: number;
  max: number;
  step?: number;
}) => {
  const range = max - min + 1;
  const normalizedStep = ((step % range) + range) % range; // Handle negative steps and ensure positive
  
  let result = current + normalizedStep;
  
  // Handle wrapping around the range
  if (result > max) {
    result = min + (result - max - 1);
  } else if (result < min) {
    result = max - (min - result - 1);
  }
  
  return result;
}