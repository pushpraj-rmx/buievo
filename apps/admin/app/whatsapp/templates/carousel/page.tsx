"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Upload,
  Trash2,
} from "lucide-react";

type CarouselCard = {
  id: string;
  headerFormat: "IMAGE" | "VIDEO";
  headerAssetUrl: string;
  headerAssetHandle?: string;
  bodyText?: string;
  buttons: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
    text: string;
    url?: string;
    phone_number?: string;
  }>;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
  estimatedApprovalTime: string;
  preview: string;
  sampleVariables: Record<string, string>;
};

export default function CarouselTemplatePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [cards, setCards] = useState<CarouselCard[]>([]);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);

  // WhatsApp templates are always in English (en_US)
  const LANGUAGE = "en_US";
  const CATEGORY = "MARKETING" as const;

  const validateTemplate = useCallback(async () => {
    if (!name.trim() || !bodyText.trim() || cards.length < 2) {
      setValidationResult(null);
      return;
    }

    setValidating(true);
    try {
      const components = [
        {
          type: "BODY" as const,
          text: bodyText.trim(),
        },
        {
          type: "CAROUSEL" as const,
          cards: cards.map((card) => ({
            components: [
              {
                type: "HEADER" as const,
                format: card.headerFormat,
                example: card.headerAssetHandle
                  ? {
                      header_handle: [card.headerAssetHandle],
                    }
                  : undefined,
              },
              ...(card.bodyText
                ? [
                    {
                      type: "BODY" as const,
                      text: card.bodyText,
                    },
                  ]
                : []),
              {
                type: "BUTTONS" as const,
                buttons: card.buttons,
              },
            ],
          })),
        },
      ];

      const body = {
        name: name.trim(),
        language: LANGUAGE,
        category: CATEGORY,
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()) : undefined,
        components,
      };

      const res = await fetch("/api/v1/templates/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const result = await res.json();
        setValidationResult(result);
      } else {
        setValidationResult(null);
      }
    } catch {
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  }, [name, bodyText, cards, tags, description]);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name.trim() || bodyText.trim() || cards.length > 0) {
        validateTemplate();
      } else {
        setValidationResult(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [name, bodyText, cards, validateTemplate]);

  async function uploadMedia(
    fileUrl: string,
    type: "image" | "video"
  ): Promise<string | null> {
    try {
      const res = await fetch("/api/v1/templates/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, type }),
      });

      if (res.ok) {
        const result = await res.json();
        return result.handle;
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to upload media");
        return null;
      }
    } catch {
      toast.error("Failed to upload media");
      return null;
    }
  }

  const createTemplate = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (!bodyText.trim()) {
      toast.error("Template body is required");
      return;
    }

    if (cards.length < 2) {
      toast.error("Carousel must have at least 2 cards");
      return;
    }

    if (validationResult && !validationResult.isValid) {
      toast.error("Please fix validation errors before creating template");
      return;
    }

    setCreating(true);
    try {
      const components = [
        {
          type: "BODY" as const,
          text: bodyText.trim(),
        },
        {
          type: "CAROUSEL" as const,
          cards: cards.map((card) => ({
            components: [
              {
                type: "HEADER" as const,
                format: card.headerFormat,
                example: card.headerAssetHandle
                  ? {
                      header_handle: [card.headerAssetHandle],
                    }
                  : undefined,
              },
              ...(card.bodyText
                ? [
                    {
                      type: "BODY" as const,
                      text: card.bodyText,
                    },
                  ]
                : []),
              {
                type: "BUTTONS" as const,
                buttons: card.buttons,
              },
            ],
          })),
        },
      ];

      const body = {
        name: name.trim(),
        language: LANGUAGE,
        category: CATEGORY,
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()) : undefined,
        components,
      };

      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Carousel template submitted for approval");

        // Clear form
        setName("");
        setDescription("");
        setTags("");
        setBodyText("");
        setCards([]);
        setValidationResult(null);
      } else {
        const json = await res.json();
        toast.error(json.message || "Failed to create template");
      }
    } finally {
      setCreating(false);
    }
  }, [name, bodyText, cards, description, tags, validationResult]);

  function addCard() {
    const newCard: CarouselCard = {
      id: `card_${Date.now()}`,
      headerFormat: "IMAGE",
      headerAssetUrl: "",
      bodyText: "",
      buttons: [
        {
          type: "QUICK_REPLY",
          text: "Send me more like this!",
        },
        {
          type: "URL",
          text: "Shop",
          url: "https://example.com/product/{{1}}",
        },
      ],
    };
    setCards([...cards, newCard]);
  }

  function removeCard(cardId: string) {
    setCards(cards.filter((card) => card.id !== cardId));
  }

  function updateCard(cardId: string, updates: Partial<CarouselCard>) {
    setCards(
      cards.map((card) => (card.id === cardId ? { ...card, ...updates } : card))
    );
  }

  function updateCardButton(
    cardId: string,
    buttonIndex: number,
    updates: Partial<CarouselCard["buttons"][0]>
  ) {
    setCards(
      cards.map((card) => {
        if (card.id === cardId) {
          const newButtons = [...card.buttons];
          newButtons[buttonIndex] = { ...newButtons[buttonIndex], ...updates };
          return { ...card, buttons: newButtons };
        }
        return card;
      })
    );
  }

  async function handleMediaUpload(
    cardId: string,
    fileUrl: string,
    type: "image" | "video"
  ) {
    setUploadingMedia(cardId);
    try {
      const handle = await uploadMedia(fileUrl, type);
      if (handle) {
        updateCard(cardId, { headerAssetHandle: handle });
        toast.success("Media uploaded successfully");
      }
    } finally {
      setUploadingMedia(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Carousel Template</h1>
          <p className="text-muted-foreground">
            Create a Media Card Carousel template for your WhatsApp business
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Carousel Template Details
          </CardTitle>
          <CardDescription>
            Configure your Media Card Carousel template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="carousel_product_showcase"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use lowercase with underscores (e.g., carousel_product_showcase)
              </p>
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <Input
                id="template-category"
                value="MARKETING"
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Carousel templates are always in the MARKETING category
              </p>
            </div>
          </div>

          {/* Description and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-description">
                Description (Optional)
              </Label>
              <Input
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product showcase carousel template"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-tags">Tags (Optional)</Label>
              <Input
                id="template-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="carousel, products, showcase"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated tags for organization
              </p>
            </div>
          </div>

          {/* Body Text */}
          <div>
            <Label htmlFor="template-body">Body Text *</Label>
            <Textarea
              id="template-body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Check out our latest products! {{1}}, we have amazing deals for you. Each product is {{2}} with code {{3}}. Shop now and discover unique items!"
              className="mt-1 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Main message content. Use &#123;&#123;1&#125;&#125;,
              &#123;&#123;2&#125;&#125;, etc. for variables
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Carousel Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Carousel Cards ({cards.length}/10)
              </CardTitle>
              <CardDescription>
                Add 2-10 cards to your carousel. Each card must have a header
                image/video and buttons.
              </CardDescription>
            </div>
            <Button
              onClick={addCard}
              disabled={cards.length >= 10}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-4">
                Add at least 2 cards to create your carousel template
              </p>
              <Button onClick={addCard}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Card
              </Button>
            </div>
          ) : (
            cards.map((card, cardIndex) => (
              <div key={card.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Card {cardIndex + 1}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCard(card.id)}
                    disabled={cards.length <= 2}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Header Media */}
                <div className="space-y-2">
                  <Label>Header Media *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      value={card.headerFormat}
                      onValueChange={(value: "IMAGE" | "VIDEO") =>
                        updateCard(card.id, { headerFormat: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <Input
                        placeholder="Media URL (https://example.com/image.jpg)"
                        value={card.headerAssetUrl}
                        onChange={(e) =>
                          updateCard(card.id, {
                            headerAssetUrl: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleMediaUpload(
                            card.id,
                            card.headerAssetUrl,
                            card.headerFormat.toLowerCase() as "image" | "video"
                          )
                        }
                        disabled={
                          !card.headerAssetUrl || uploadingMedia === card.id
                        }
                      >
                        {uploadingMedia === card.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span className="ml-2">Upload Media</span>
                      </Button>
                    </div>
                  </div>
                  {card.headerAssetHandle && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      ✓ Media uploaded
                    </Badge>
                  )}
                </div>

                {/* Card Body Text */}
                <div>
                  <Label>Card Body Text (Optional)</Label>
                  <Textarea
                    value={card.bodyText}
                    onChange={(e) =>
                      updateCard(card.id, { bodyText: e.target.value })
                    }
                    placeholder="Product description or additional information"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If you add body text to one card, all cards must have body
                    text
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <Label>Buttons * (1-2 buttons required)</Label>
                  {card.buttons.map((button, buttonIndex) => (
                    <div
                      key={buttonIndex}
                      className="border rounded p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Button {buttonIndex + 1}
                        </span>
                        <Select
                          value={button.type}
                          onValueChange={(
                            value: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"
                          ) =>
                            updateCardButton(card.id, buttonIndex, {
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUICK_REPLY">
                              Quick Reply
                            </SelectItem>
                            <SelectItem value="URL">URL</SelectItem>
                            <SelectItem value="PHONE_NUMBER">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Button text (max 25 characters)"
                        value={button.text}
                        onChange={(e) =>
                          updateCardButton(card.id, buttonIndex, {
                            text: e.target.value,
                          })
                        }
                        maxLength={25}
                      />
                      {button.type === "URL" && (
                        <Input
                          placeholder="URL (supports {{1}} variable)"
                          value={button.url || ""}
                          onChange={(e) =>
                            updateCardButton(card.id, buttonIndex, {
                              url: e.target.value,
                            })
                          }
                        />
                      )}
                      {button.type === "PHONE_NUMBER" && (
                        <Input
                          placeholder="Phone number (e.g., +1234567890)"
                          value={button.phone_number || ""}
                          onChange={(e) =>
                            updateCardButton(card.id, buttonIndex, {
                              phone_number: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validating && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Validating carousel template...</AlertDescription>
        </Alert>
      )}

      {validationResult && (
        <div className="space-y-4">
          {/* Validation Status */}
          <Alert
            className={
              validationResult.isValid
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }
          >
            {validationResult.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                validationResult.isValid ? "text-green-800" : "text-red-800"
              }
            >
              {validationResult.isValid
                ? "Carousel template is valid"
                : "Carousel template has validation errors"}
            </AlertDescription>
          </Alert>

          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-2">Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="font-medium mb-2">Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Variables */}
          {validationResult.variables.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="font-medium mb-2">Variables detected:</div>
                <div className="flex flex-wrap gap-2">
                  {validationResult.variables.map((variable, index) => (
                    <Badge key={index} variant="outline" className="bg-white">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Time */}
          <Alert className="border-purple-200 bg-purple-50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <div className="font-medium">Estimated approval time:</div>
              <div>{validationResult.estimatedApprovalTime}</div>
            </AlertDescription>
          </Alert>

          {/* Preview Button */}
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Carousel Template
          </Button>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={createTemplate}
          disabled={
            creating ||
            !name.trim() ||
            !bodyText.trim() ||
            cards.length < 2 ||
            (validationResult ? !validationResult.isValid : false)
          }
          className="min-w-[200px]"
        >
          {creating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating Carousel Template...
            </>
          ) : (
            "Create Carousel Template"
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      {showPreview && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Carousel Template Preview</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Template Preview:</h4>
                <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border overflow-auto">
                  {validationResult.preview}
                </pre>
              </div>
              {Object.keys(validationResult.sampleVariables).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Sample Variables:</h4>
                  <div className="space-y-2">
                    {Object.entries(validationResult.sampleVariables).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center bg-white p-2 rounded border"
                        >
                          <span className="font-mono text-sm">{key}</span>
                          <span className="text-sm text-gray-600">{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
