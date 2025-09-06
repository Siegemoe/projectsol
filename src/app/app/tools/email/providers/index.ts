"use client";

import type { Provider, ProviderId } from "../types";
import { gmailProvider } from "./gmail";
import { outlookProvider } from "./outlook";

export const providers: Record<ProviderId, Provider> = {
  gmail: gmailProvider,
  outlook: outlookProvider,
};

export const providerList: Provider[] = [gmailProvider, outlookProvider];
