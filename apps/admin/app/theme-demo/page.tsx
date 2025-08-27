"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useThemeSync } from "@/hooks/use-theme-sync";

export default function ThemeDemoPage() {
  const { theme } = useThemeSync();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Demo</h1>
          <p className="text-muted-foreground">
            Showcase of the dark and light theme implementation
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Theme</CardTitle>
            <CardDescription>
              The current theme mode is: <Badge variant="secondary">{theme}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This card demonstrates how components adapt to the current theme.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields and controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-input">Sample Input</Label>
              <Input id="demo-input" placeholder="Type something..." />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="demo-switch" />
              <Label htmlFor="demo-switch">Toggle Switch</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <Button variant="ghost" className="w-full">Ghost Button</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Theme color demonstration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="h-8 bg-primary rounded" />
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-secondary rounded" />
                <p className="text-xs text-muted-foreground">Secondary</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-accent rounded" />
                <p className="text-xs text-muted-foreground">Accent</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-muted rounded" />
                <p className="text-xs text-muted-foreground">Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Text styles and colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <h3 className="text-lg font-semibold">Heading Text</h3>
            <p className="text-sm">Regular paragraph text with normal color.</p>
            <p className="text-sm text-muted-foreground">Muted text for secondary information.</p>
            <p className="text-sm text-primary">Primary colored text for emphasis.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges & Status</CardTitle>
            <CardDescription>Status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Theme Information</CardTitle>
          <CardDescription>How the theme system works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Light Theme</h4>
              <p className="text-sm text-muted-foreground">
                Clean, bright interface with high contrast for daytime use.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dark Theme</h4>
              <p className="text-sm text-muted-foreground">
                Easy on the eyes with reduced brightness for low-light environments.
              </p>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Simple toggle between light and dark themes</li>
              <li>• System theme detection on first visit</li>
              <li>• Persistent theme preference across sessions</li>
              <li>• Smooth transitions between themes</li>
              <li>• Full shadcn/ui component compatibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
