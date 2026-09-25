import { useMutation } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";

export interface SendSingleEmailRequest {
  userId: string;
  subject: string;
  message: string;
}

export interface SendSingleEmailResponse {
  sent: number;
}

export interface SendBulkEmailRequest {
  subject: string;
  message: string;
  userIds?: string[];
}

export interface SendBulkEmailResponse {
  sent: number;
  failed: number;
  total: number;
}

export const sendSingleEmail = async (request: SendSingleEmailRequest): Promise<SendSingleEmailResponse> => {
  return customFetch<SendSingleEmailResponse>("/admin/email/single", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
};

export const sendBulkEmail = async (request: SendBulkEmailRequest): Promise<SendBulkEmailResponse> => {
  return customFetch<SendBulkEmailResponse>("/admin/email/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
};

export interface SendTestEmailRequest {
  to?: string;
}

export interface SendTestEmailResponse {
  sent: number;
  to: string;
  id?: string;
}

export const sendTestEmail = async (request: SendTestEmailRequest = {}): Promise<SendTestEmailResponse> => {
  return customFetch<SendTestEmailResponse>("/admin/email/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
};

export const useSendSingleEmail = (
  options?: { mutation?: Parameters<typeof useMutation>[0] }
) => {
  return useMutation({
    mutationFn: sendSingleEmail,
    ...options?.mutation,
  });
};

export const useSendBulkEmail = (
  options?: { mutation?: Parameters<typeof useMutation>[0] }
) => {
  return useMutation({
    mutationFn: sendBulkEmail,
    ...options?.mutation,
  });
};

export const useSendTestEmail = (
  options?: { mutation?: Parameters<typeof useMutation>[0] }
) => {
  return useMutation({
    mutationFn: sendTestEmail,
    ...options?.mutation,
  });
};
