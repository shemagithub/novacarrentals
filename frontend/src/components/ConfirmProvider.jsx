import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ConfirmContext = createContext(null);

const INITIAL = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "destructive",
};

/**
 * Promise-based confirm dialog — replaces window.confirm with admin-styled modals.
 *
 * await confirm("Delete this item?");
 * await confirm({ title: "Remove image?", message: "...", confirmLabel: "Remove" });
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(INITIAL);
  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === "string" ? { message: options } : options || {};
    const variant = opts.variant ?? "destructive";
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        title: opts.title ?? (variant === "destructive" ? "Confirm deletion" : "Please confirm"),
        description: opts.message ?? opts.description ?? "",
        confirmLabel:
          opts.confirmLabel ?? (variant === "destructive" ? "Delete" : "Confirm"),
        cancelLabel: opts.cancelLabel ?? "Cancel",
        variant,
      });
    });
  }, []);

  const finish = (result) => {
    const resolve = resolveRef.current;
    if (!resolve) return;
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
    resolve(result);
  };

  const isDestructive = state.variant === "destructive";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <AlertDialogContent data-testid="admin-confirm-dialog">
          <AlertDialogHeader>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {isDestructive ? "Action required" : "Confirmation"}
            </p>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            {state.description ? (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="admin-confirm-cancel">
              {state.cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={isDestructive ? "destructive" : "default"}
              data-testid="admin-confirm-ok"
              onClick={() => finish(true)}
            >
              {state.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
