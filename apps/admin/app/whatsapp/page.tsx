import WhatsAppLayout from "@/components/WhatsAppLayout";

export default function Page() {
  return (
    <WhatsAppLayout
      contacts={
        <div className="p-4">
          <h2 className="font-bold mb-2">Contacts</h2>
          <ul className="space-y-2">
            <li className="p-2 bg-gray-100 rounded">Alice</li>
            <li className="p-2 bg-gray-100 rounded">Bob</li>
            <li className="p-2 bg-gray-100 rounded">Charlie</li>
          </ul>
        </div>
      }
      chat={
        <div className="p-4 h-full flex flex-col">
          <h2 className="font-bold mb-2">Chat</h2>
          <div className="flex-1 overflow-y-auto bg-white rounded p-2 mb-2">
            <div className="mb-1 text-right text-green-700">Hi Alice!</div>
            <div className="mb-1 text-left text-gray-700">
              Hello! How are you?
            </div>
            <div className="mb-1 text-right text-green-700">
              I am good, thanks!
            </div>
          </div>
          <input
            className="border rounded p-2"
            placeholder="Type a message..."
          />
        </div>
      }
      info={
        <div className="p-4">
          <h2 className="font-bold mb-2">Contact Info</h2>
          <div className="bg-gray-100 rounded p-2 mb-2">Alice</div>
          <div className="text-sm text-gray-500">Status: Online</div>
        </div>
      }
    />
  );
}
