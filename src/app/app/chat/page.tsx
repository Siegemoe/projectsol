import SolChat from "@/components/SolChat";

export default function AppChatPage() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <SolChat title="Sol" apiPath="/api/sol-chat" />
    </div>
  );
}
