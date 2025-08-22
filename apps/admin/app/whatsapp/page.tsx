import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  MessageCircle,
} from "lucide-react";

export default function WhatsAppPage() {
  const features = [
    {
      title: "Chat",
      description: "Direct messaging with your contacts",
      icon: MessageCircle,
      href: "/whatsapp/chat",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Templates",
      description: "Create and manage WhatsApp message templates",
      icon: FileText,
      href: "/whatsapp/templates",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Campaigns",
      description: "Create and send bulk WhatsApp campaigns",
      icon: MessageSquare,
      href: "/whatsapp/campaigns",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Contacts",
      description: "Manage your contact lists and segments",
      icon: Users,
      href: "/whatsapp/contacts",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Analytics",
      description: "View campaign performance and delivery reports",
      icon: BarChart3,
      href: "/whatsapp/templates/analytics",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                {feature.comingSoon ? (
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={feature.href}>Open</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Current Status</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Connected</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Language Support</h4>
                <span className="text-sm text-muted-foreground">
                  English (en_US)
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Message templates with approval workflow</li>
                <li>
                  • Template categories (Utility, Marketing, Authentication)
                </li>
                <li>• Template components (Header, Body, Footer)</li>
                <li>
                  • Variable support (&#123;&#123;1&#125;&#125;,
                  &#123;&#123;2&#125;&#125;, etc.)
                </li>
                <li>• Template status tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
