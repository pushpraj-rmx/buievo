import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Logo size={48} className="text-blue-600 mr-3" showText={true} textClassName="text-4xl font-bold text-gray-900" />
        </div>
        <p className="text-xl text-gray-600 mb-8">WhatsApp Business Suite</p>
        <p className="text-gray-500">Welcome to your WhatsApp management platform</p>
      </div>
    </div>
  );
}
