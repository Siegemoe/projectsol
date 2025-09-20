"use client";

import type React from "react";
import EmailWindow from "@/app/app/tools/email/components/EmailWindow";

export default function EmailPage(): React.ReactElement {
  return (
    <div className="h-full min-h-0">
      <EmailWindow embedded={false} showSidebar />
    </div>
  );
}
