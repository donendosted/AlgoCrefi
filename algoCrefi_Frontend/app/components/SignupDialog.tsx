import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

type SignupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  errorMessage: string | null;
  onSignup: () => void;
};

export default function SignupDialog({
  open,
  onOpenChange,
  walletAddress,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  errorMessage,
  onSignup
}: SignupDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (open && contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, scale: 0.95, rotateX: -2 },
        { 
          opacity: 1, 
          scale: 1, 
          rotateX: 0,
          duration: 0.35, 
          ease: 'power3.out' 
        }
      );

      if (formRef.current) {
        const elements = formRef.current.children;
        gsap.fromTo(elements,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            delay: 0.1,
            ease: 'power2.out'
          }
        );
      }
    }
  }, { dependencies: [open], scope: contentRef });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={contentRef}
        className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-white text-center">
            Create Account
          </DialogTitle>
        </DialogHeader>

        <div ref={formRef} className="space-y-4">
          <div className="text-xs text-gray-400 text-center truncate px-4">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </div>

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-black text-white rounded-lg border border-white/10 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 bg-black text-white rounded-lg border border-white/10 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none transition"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSignup()}
          />

          {errorMessage && (
            <p className="text-red-400 text-sm text-center">
              {errorMessage}
            </p>
          )}

          <Button
            onClick={onSignup}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white h-10"
          >
            Sign Up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
