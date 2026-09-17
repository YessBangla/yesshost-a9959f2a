import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ValidationCode } from "./domain-pricing";
import type { InvoicePaymentStatus, RenewalResult, TransferResult, TransferStatus } from "./domain-tools.server";
export type { InvoicePaymentStatus };

export type ActionFailure = { ok: false; code: ValidationCode | "server_error" };
export type ActionSuccess<T> = { ok: true; data: T };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

type RenewInput = { items: { serviceId: string; years: number }[] };

export const submitDomainRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RenewInput) => {
    if (!data || !Array.isArray(data.items)) throw new Error("items are required");
    return {
      items: data.items.map((i) => ({ serviceId: String(i.serviceId), years: Number(i.years) })),
    };
  })
  .handler(async ({ data, context }): Promise<ActionResult<RenewalResult>> => {
    const { submitRenewal, DomainToolsError } = await import("./domain-tools.server");
    try {
      return { ok: true, data: await submitRenewal(context.supabase, context.userId, data.items) };
    } catch (e) {
      if (e instanceof DomainToolsError) return { ok: false, code: e.code };
      return { ok: false, code: "server_error" };
    }
  });

type TransferInput = {
  domain: string;
  eppCode: string;
  note?: string;
  years?: number;
  acknowledged: boolean;
};

export const submitDomainTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: TransferInput) => {
    if (!data) throw new Error("input is required");
    return {
      domain: String(data.domain ?? ""),
      eppCode: String(data.eppCode ?? ""),
      note: data.note ? String(data.note) : "",
      years: data.years ? Number(data.years) : 1,
      acknowledged: !!data.acknowledged,
    };
  })
  .handler(async ({ data, context }): Promise<ActionResult<TransferResult>> => {
    const { submitTransfer, DomainToolsError } = await import("./domain-tools.server");
    try {
      return { ok: true, data: await submitTransfer(context.supabase, context.userId, data) };
    } catch (e) {
      if (e instanceof DomainToolsError) return { ok: false, code: e.code };
      return { ok: false, code: "server_error" };
    }
  });

export const getTransferTicketStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketNumber: string }) => {
    if (!data?.ticketNumber) throw new Error("ticketNumber is required");
    return { ticketNumber: String(data.ticketNumber) };
  })
  .handler(async ({ data, context }): Promise<TransferStatus | null> => {
    const { transferStatus } = await import("./domain-tools.server");
    return transferStatus(context.supabase, context.userId, data.ticketNumber);
  });

export const getRenewalInvoiceStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceNumber: string }) => {
    if (!data?.invoiceNumber) throw new Error("invoiceNumber is required");
    return { invoiceNumber: String(data.invoiceNumber) };
  })
  .handler(async ({ data, context }) => {
    const { invoicePaymentStatus } = await import("./domain-tools.server");
    return invoicePaymentStatus(context.supabase, context.userId, data.invoiceNumber);
  });

export const sendTransferFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketNumber: string; message: string }) => {
    if (!data?.ticketNumber) throw new Error("ticketNumber is required");
    return { ticketNumber: String(data.ticketNumber), message: String(data.message ?? "") };
  })
  .handler(async ({ data, context }): Promise<ActionResult<{ ticketNumber: string; at: string }>> => {
    const { transferFollowUp, DomainToolsError } = await import("./domain-tools.server");
    try {
      return {
        ok: true,
        data: await transferFollowUp(context.supabase, context.userId, data.ticketNumber, data.message),
      };
    } catch (e) {
      if (e instanceof DomainToolsError) return { ok: false, code: e.code };
      return { ok: false, code: "server_error" };
    }
  });
