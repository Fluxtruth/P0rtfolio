"use client";
import { useState, Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { fmtDollar } from "@/lib/formatters";
import { useRebalance } from "@/hooks/useRebalance";
import type { OptimizationResult, RebalanceResult } from "@/types";

interface Props {
  optimizationResult: OptimizationResult;
  accountValue: number;
  onComplete: () => void;
}

export function RebalanceModal({ optimizationResult, accountValue, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [preview, setPreview] = useState<RebalanceResult | null>(null);
  const { loading, error, execute, reset } = useRebalance();

  const handleOpen = async () => {
    reset();
    setPreview(null);
    setOpen(true);
    // Auto-fetch dry-run preview
    const result = await execute({
      weights: optimizationResult.weights,
      accountValue,
      dryRun: true,
    });
    if (result) setPreview(result);
  };

  const handleConfirm = async () => {
    const result = await execute({
      weights: optimizationResult.weights,
      accountValue,
      dryRun: false,
    });
    if (result && !result.dry_run) {
      onComplete();
      setTimeout(() => setOpen(false), 2000);
    }
  };

  const orders = preview?.orders_placed ?? [];

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="primary"
        className="w-full"
        disabled={accountValue <= 0}
      >
        <ArrowsRightLeftIcon className="h-4 w-4" />
        Execute Rebalance
      </Button>

      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <DialogTitle className="text-base font-semibold text-zinc-100">
                      Rebalance Portfolio
                    </DialogTitle>
                    <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {error && <ErrorAlert message={error} />}

                  {loading && !preview && (
                    <div className="flex items-center gap-3 py-4 text-sm text-zinc-400">
                      <Spinner className="h-4 w-4" />
                      Calculating orders…
                    </div>
                  )}

                  {preview && (
                    <>
                      {/* Dry run toggle */}
                      <div className="mb-4 flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-zinc-200">Dry Run Mode</div>
                          <div className="text-xs text-zinc-500">
                            Preview orders without executing
                          </div>
                        </div>
                        <button
                          onClick={() => setDryRun((d) => !d)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            dryRun ? "bg-blue-600" : "bg-zinc-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              dryRun ? "left-0.5" : "left-[22px]"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Orders table */}
                      {orders.length > 0 ? (
                        <div className="mb-4 overflow-hidden rounded-lg border border-zinc-800 max-h-56 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-400">Symbol</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-400">Side</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400">~Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((o, i) => (
                                <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                                  <td className="px-3 py-2 font-mono font-semibold text-zinc-100">{o.symbol}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        o.side === "buy"
                                          ? "bg-green-900/40 text-green-400"
                                          : "bg-red-900/40 text-red-400"
                                      }`}
                                    >
                                      {o.side.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{o.qty}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                                    {fmtDollar(o.estimated_value)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                          No trades needed — portfolio is already balanced.
                        </p>
                      )}

                      {preview.orders_skipped.length > 0 && (
                        <p className="mb-4 text-xs text-zinc-600">
                          Skipped: {preview.orders_skipped.join(", ")}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button
                          variant={dryRun ? "secondary" : "primary"}
                          onClick={handleConfirm}
                          disabled={loading || orders.length === 0}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Placing…
                            </>
                          ) : dryRun ? (
                            "Confirm (Dry Run)"
                          ) : (
                            `Place ${orders.length} Orders`
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
