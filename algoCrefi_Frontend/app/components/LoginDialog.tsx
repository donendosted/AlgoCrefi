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

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  password: string;
  setPassword: (password: string) => void;
  errorMessage: string | null;
  onLogin: () => void;
};

export default function LoginDialog({
  open,
  onOpenChange,
  walletAddress,
  password,
  setPassword,
  errorMessage,
  onLogin
}: LoginDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Entrance animation
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
            Enter Password
          </DialogTitle>
        </DialogHeader>

        <div ref={formRef} className="space-y-4">
          <div className="text-xs text-gray-400 text-center truncate px-4">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </div>

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-black text-white rounded-lg border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onLogin()}
            autoFocus
          />

          {errorMessage && (
            <p className="text-red-400 text-sm text-center">
              {errorMessage}
            </p>
          )}

          <Button
            onClick={onLogin}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white h-10"
          >
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
