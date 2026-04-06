import pkg from 'react';
const {Dispatch, SetStateAction} = pkg;
type Props = {
  openInvest: boolean;
  setOpenInvest: Dispatch<SetStateAction<boolean>>;
  openBorrow: boolean;
  setOpenBorrow: Dispatch<SetStateAction<boolean>>;
  walletAddress: string;
  walletType: "lute" | "pera" | "exodus" | null;
};

export default function FinanceDialog({
  openInvest,
  setOpenInvest,
  openBorrow,
  setOpenBorrow,
  walletAddress,
}: Props) {
  const isOpen = openInvest || openBorrow;

  if (!isOpen) return null;

  const close = () => {
    setOpenInvest(false);
    setOpenBorrow(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* CLICK OUTSIDE TO CLOSE */}
      <div
        className="absolute inset-0"
        onClick={close}
      />

      {/* DIALOG BOX */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-neutral-900 border border-white/10 rounded-xl p-6 shadow-xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-light">
            {openInvest ? "Invest" : "Borrow"}
          </h2>

          <button
            onClick={close}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Wallet: {walletAddress.slice(0, 6)}...
            {walletAddress.slice(-6)}
          </p>

          <input
            type="number"
            placeholder={openInvest ? "Amount to invest" : "Amount to borrow"}
            className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          />

          <button className="w-full py-2 rounded-md bg-white text-black hover:bg-gray-200 transition">
            {openInvest ? "Confirm Investment" : "Confirm Borrow"}
          </button>
        </div>
      </div>
    </div>
  );
}