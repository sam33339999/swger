import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<DialogProps> = ({ children, open, onOpenChange }) => {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
};

const DialogTrigger = RadixDialog.Trigger;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const DialogContent: React.FC<DialogContentProps> = ({ 
  children, 
  className = '',
  showCloseButton = true
}) => {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in z-40" />
      <RadixDialog.Content className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-up ${className}`}>
        {children}
        {showCloseButton && (
          <RadixDialog.Close className="absolute top-4 right-4 rounded-full p-1 hover:bg-gray-800 transition-colors">
            <Cross2Icon className="h-4 w-4 text-gray-400" />
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
};

const DialogClose = RadixDialog.Close;
const DialogTitle = RadixDialog.Title;
const DialogDescription = RadixDialog.Description;

export { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription };
