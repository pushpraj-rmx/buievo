"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IconBrandWhatsapp,
  IconCloud,
  IconBell,
  IconApi,
  IconSettings,
  IconTestPipe,
  IconActivity,
  IconPalette,
  IconLayoutSidebar,
  IconLanguage,
  IconDatabase,
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    config,
    updateWhatsAppConfig,
    updateStorageConfig,
    updateWorkerAreaConfig,
    updateThemeConfig,
    updateSidebarConfig,
    updateLocalizationConfig,
    updateAdvancedStorageConfig,
    testWhatsAppConnection,
  } = useConfig();

  const [whatsappConfig, setWhatsappConfig] = useState(config.whatsapp);
  const [storageConfig, setStorageConfig] = useState(config.storage);
  const [workerAreaConfig, setWorkerAreaConfig] = useState(config.workerArea);
  const [themeConfig, setThemeConfig] = useState(config.theme);
  const [sidebarConfig, setSidebarConfig] = useState(config.sidebar);
  const [localizationConfig, setLocalizationConfig] = useState(
    config.localization,
  );
  const [advancedStorageConfig, setAdvancedStorageConfig] = useState(
    config.advancedStorage,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when config changes
  useEffect(() => {
    setWhatsappConfig(config.whatsapp);
    setStorageConfig(config.storage);
    setWorkerAreaConfig(config.workerArea);
    setThemeConfig(config.theme);
    setSidebarConfig(config.sidebar);
    setLocalizationConfig(config.localization);
    setAdvancedStorageConfig(config.advancedStorage);
  }, [config]);

  const handleSaveWhatsApp = async () => {
    setIsLoading(true);
    try {
      await updateWhatsAppConfig(whatsappConfig);
      toast.success("WhatsApp configuration saved successfully!");
    } catch {
      toast.error("Failed to save WhatsApp configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const isValid = await testWhatsAppConnection();
      if (isValid) {
        toast.success("WhatsApp connection test successful!");
      } else {
        toast.error("WhatsApp connection test failed");
      }
    } catch {
      toast.error("WhatsApp connection test failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your WhatsSuite configuration and preferences
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <IconBrandWhatsapp className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <IconCloud className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <IconApi className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <IconBell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="workerArea" className="flex items-center gap-2">
            <IconActivity className="h-4 w-4" />
            Worker Area
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <IconPalette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="sidebar" className="flex items-center gap-2">
            <IconLayoutSidebar className="h-4 w-4" />
            Sidebar
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <IconLanguage className="h-4 w-4" />
            Language
          </TabsTrigger>
          <TabsTrigger
            value="advancedStorage"
            className="flex items-center gap-2"
          >
            <IconDatabase className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBrandWhatsapp className="h-5 w-5" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Configure your WhatsApp Business API credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    WhatsApp Business API
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your WhatsApp Business API credentials and
                    settings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={whatsappConfig.isEnabled ? "default" : "secondary"}
                  >
                    {whatsappConfig.isEnabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    checked={whatsappConfig.isEnabled}
                    onCheckedChange={(checked) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        isEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    value={whatsappConfig.phoneNumberId}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        phoneNumberId: e.target.value,
                      })
                    }
                    placeholder="Enter your WhatsApp Phone Number ID"
                  />
                </div>
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={whatsappConfig.accessToken}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        accessToken: e.target.value,
                      })
                    }
                    placeholder="Enter your WhatsApp Access Token"
                  />
                </div>
                <div>
                  <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
                  <Input
                    id="wabaId"
                    value={whatsappConfig.wabaId}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        wabaId: e.target.value,
                      })
                    }
                    placeholder="Enter your WABA ID"
                  />
                </div>
                <div>
                  <Label htmlFor="webhookVerifyToken">
                    Webhook Verify Token
                  </Label>
                  <Input
                    id="webhookVerifyToken"
                    value={whatsappConfig.webhookVerifyToken}
                    onChange={(e) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        webhookVerifyToken: e.target.value,
                      })
                    }
                    placeholder="Enter webhook verify token"
                  />
                </div>
                <div>
                  <Label htmlFor="apiVersion">API Version</Label>
                  <Select
                    value={whatsappConfig.apiVersion}
                    onValueChange={(value) =>
                      setWhatsappConfig({
                        ...whatsappConfig,
                        apiVersion: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v21.0">v21.0 (Latest)</SelectItem>
                      <SelectItem value="v20.0">v20.0</SelectItem>
                      <SelectItem value="v19.0">v19.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveWhatsApp}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconTestPipe className="h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCloud className="h-5 w-5" />
                Media Storage Configuration
              </CardTitle>
              <CardDescription>
                Configure how media files are stored and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Storage Provider</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {[
                    {
                      id: "whatsapp",
                      name: "WhatsApp API",
                      description: "Store media directly in WhatsApp",
                    },
                    {
                      id: "local",
                      name: "Local Storage",
                      description: "Store files on your server",
                    },
                    {
                      id: "s3",
                      name: "Amazon S3",
                      description: "Store files in AWS S3",
                    },
                    {
                      id: "gcs",
                      name: "Google Cloud Storage",
                      description: "Store files in Google Cloud",
                    },
                  ].map((provider) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-colors ${
                        storageConfig.provider === provider.id
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setStorageConfig({
                          ...storageConfig,
                          provider: provider.id as
                            | "whatsapp"
                            | "local"
                            | "s3"
                            | "gcs",
                        })
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              storageConfig.provider === provider.id
                                ? "border-primary bg-primary"
                                : "border-gray-300"
                            }`}
                          />
                          <div>
                            <h4 className="font-medium">{provider.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {provider.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={storageConfig.maxFileSize}
                    onChange={(e) =>
                      setStorageConfig({
                        ...storageConfig,
                        maxFileSize: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="retentionDays">Retention Period (Days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={storageConfig.retentionDays}
                    onChange={(e) =>
                      setStorageConfig({
                        ...storageConfig,
                        retentionDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="compression"
                  checked={storageConfig.compressionEnabled}
                  onCheckedChange={(checked) =>
                    setStorageConfig({
                      ...storageConfig,
                      compressionEnabled: checked,
                    })
                  }
                />
                <Label htmlFor="compression">Enable image compression</Label>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateStorageConfig(storageConfig);
                      toast.success(
                        "Storage configuration saved successfully!",
                      );
                    } catch {
                      toast.error("Failed to save storage configuration");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconApi className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API settings, webhooks, and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                API configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workerArea">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Worker Area Settings
              </CardTitle>
              <CardDescription>
                Configure background task management and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoOpen"
                    checked={workerAreaConfig.autoOpen}
                    onCheckedChange={(checked) =>
                      setWorkerAreaConfig({
                        ...workerAreaConfig,
                        autoOpen: checked,
                      })
                    }
                  />
                  <Label htmlFor="autoOpen">
                    Auto-open Worker Area when tasks start
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showNotifications"
                    checked={workerAreaConfig.showNotifications}
                    onCheckedChange={(checked) =>
                      setWorkerAreaConfig({
                        ...workerAreaConfig,
                        showNotifications: checked,
                      })
                    }
                  />
                  <Label htmlFor="showNotifications">
                    Show toast notifications for tasks
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoClearCompleted"
                    checked={workerAreaConfig.autoClearCompleted}
                    onCheckedChange={(checked) =>
                      setWorkerAreaConfig({
                        ...workerAreaConfig,
                        autoClearCompleted: checked,
                      })
                    }
                  />
                  <Label htmlFor="autoClearCompleted">
                    Automatically clear completed tasks
                  </Label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="maxHistoryItems">Maximum History Items</Label>
                  <Input
                    id="maxHistoryItems"
                    type="number"
                    value={workerAreaConfig.maxHistoryItems}
                    onChange={(e) =>
                      setWorkerAreaConfig({
                        ...workerAreaConfig,
                        maxHistoryItems: parseInt(e.target.value),
                      })
                    }
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum number of completed tasks to keep in history
                  </p>
                </div>

                <div>
                  <Label htmlFor="clearAfterDays">Clear After (Days)</Label>
                  <Input
                    id="clearAfterDays"
                    type="number"
                    value={workerAreaConfig.clearAfterDays}
                    onChange={(e) =>
                      setWorkerAreaConfig({
                        ...workerAreaConfig,
                        clearAfterDays: parseInt(e.target.value),
                      })
                    }
                    placeholder="7"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically clear tasks older than this many days
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateWorkerAreaConfig(workerAreaConfig);
                      toast.success(
                        "Worker Area configuration saved successfully!",
                      );
                    } catch {
                      toast.error("Failed to save Worker Area configuration");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPalette className="h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance and color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="themeMode">Theme Mode</Label>
                <Select
                  value={themeConfig.mode}
                  onValueChange={(value) =>
                    setThemeConfig({
                      ...themeConfig,
                      mode: value as "light" | "dark" | "system",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose your preferred theme mode
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        primaryColor: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input
                    id="accentColor"
                    type="color"
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      setThemeConfig({
                        ...themeConfig,
                        accentColor: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateThemeConfig(themeConfig);
                      toast.success("Theme configuration saved successfully!");
                    } catch {
                      toast.error("Failed to save theme configuration");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidebar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLayoutSidebar className="h-5 w-5" />
                Sidebar Settings
              </CardTitle>
              <CardDescription>
                Configure sidebar behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sidebarCollapsible"
                    checked={sidebarConfig.collapsible}
                    onCheckedChange={(checked) =>
                      setSidebarConfig({
                        ...sidebarConfig,
                        collapsible: checked,
                      })
                    }
                  />
                  <Label htmlFor="sidebarCollapsible">
                    Enable sidebar collapsible
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="defaultCollapsed"
                    checked={sidebarConfig.defaultCollapsed}
                    onCheckedChange={(checked) =>
                      setSidebarConfig({
                        ...sidebarConfig,
                        defaultCollapsed: checked,
                      })
                    }
                  />
                  <Label htmlFor="defaultCollapsed">
                    Start with sidebar collapsed
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sidebarWidth">Sidebar Width</Label>
                  <Input
                    id="sidebarWidth"
                    value={sidebarConfig.width}
                    onChange={(e) =>
                      setSidebarConfig({
                        ...sidebarConfig,
                        width: e.target.value,
                      })
                    }
                    placeholder="16rem"
                  />
                </div>
                <div>
                  <Label htmlFor="sidebarPosition">Sidebar Position</Label>
                  <Select
                    value={sidebarConfig.position}
                    onValueChange={(value) =>
                      setSidebarConfig({
                        ...sidebarConfig,
                        position: value as "left" | "right",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateSidebarConfig(sidebarConfig);
                      toast.success(
                        "Sidebar configuration saved successfully!",
                      );
                    } catch {
                      toast.error("Failed to save sidebar configuration");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLanguage className="h-5 w-5" />
                Language & Localization
              </CardTitle>
              <CardDescription>
                Configure language, date, and time formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={localizationConfig.language}
                    onValueChange={(value) =>
                      setLocalizationConfig({
                        ...localizationConfig,
                        language: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={localizationConfig.timezone}
                    onValueChange={(value) =>
                      setLocalizationConfig({
                        ...localizationConfig,
                        timezone: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={localizationConfig.dateFormat}
                    onChange={(e) =>
                      setLocalizationConfig({
                        ...localizationConfig,
                        dateFormat: e.target.value,
                      })
                    }
                    placeholder="MM/dd/yyyy"
                  />
                </div>
                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Input
                    id="timeFormat"
                    value={localizationConfig.timeFormat}
                    onChange={(e) =>
                      setLocalizationConfig({
                        ...localizationConfig,
                        timeFormat: e.target.value,
                      })
                    }
                    placeholder="HH:mm"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateLocalizationConfig(localizationConfig);
                      toast.success(
                        "Localization configuration saved successfully!",
                      );
                    } catch {
                      toast.error("Failed to save localization configuration");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advancedStorage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                Advanced Storage Settings
              </CardTitle>
              <CardDescription>
                Configure fallback storage and advanced options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableFallback"
                    checked={advancedStorageConfig.enableFallback}
                    onCheckedChange={(checked) =>
                      setAdvancedStorageConfig({
                        ...advancedStorageConfig,
                        enableFallback: checked,
                      })
                    }
                  />
                  <Label htmlFor="enableFallback">
                    Enable fallback storage
                  </Label>
                </div>
              </div>

              {advancedStorageConfig.enableFallback && (
                <div>
                  <Label htmlFor="fallbackProvider">Fallback Provider</Label>
                  <Select
                    value={advancedStorageConfig.fallbackProvider || ""}
                    onValueChange={(value) =>
                      setAdvancedStorageConfig({
                        ...advancedStorageConfig,
                        fallbackProvider: value as
                          | "whatsapp"
                          | "local"
                          | "s3"
                          | "gcs"
                          | null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp API</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={advancedStorageConfig.retryAttempts}
                    onChange={(e) =>
                      setAdvancedStorageConfig({
                        ...advancedStorageConfig,
                        retryAttempts: parseInt(e.target.value),
                      })
                    }
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={advancedStorageConfig.retryDelay}
                    onChange={(e) =>
                      setAdvancedStorageConfig({
                        ...advancedStorageConfig,
                        retryDelay: parseInt(e.target.value),
                      })
                    }
                    placeholder="1000"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await updateAdvancedStorageConfig(advancedStorageConfig);
                      toast.success(
                        "Advanced storage configuration saved successfully!",
                      );
                    } catch {
                      toast.error(
                        "Failed to save advanced storage configuration",
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconSettings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
