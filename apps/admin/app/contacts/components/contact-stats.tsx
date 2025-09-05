"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Tag, MessageSquare, TrendingUp, RefreshCw } from "lucide-react";
import {
  contactApi,
  type ContactStatsType,
  type SegmentStatsType,
} from "@/lib/contact-api";

interface ContactStatsProps {
  onRefresh?: () => void;
}

export function ContactStats({ onRefresh }: ContactStatsProps) {
  const [contactStats, setContactStats] = useState<ContactStatsType | null>(
    null
  );
  const [segmentStats, setSegmentStats] = useState<SegmentStatsType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [contactStatsResponse, segmentStatsResponse] = await Promise.all([
        contactApi.getContactStats(),
        contactApi.getSegmentStats(),
      ]);

      setContactStats(contactStatsResponse.data);
      setSegmentStats(segmentStatsResponse.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
    onRefresh?.();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Contacts",
      value: contactStats?.total || 0,
      subtitle: `${contactStats?.active || 0} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Segments",
      value: segmentStats?.total || 0,
      subtitle: "Contact groups",
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Inactive Contacts",
      value: contactStats?.inactive || 0,
      subtitle: `${Math.round(((contactStats?.inactive || 0) / (contactStats?.total || 1)) * 100)}% of total`,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pending Contacts",
      value: contactStats?.pending || 0,
      subtitle: "Awaiting approval",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contact Analytics</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Breakdown */}
      {segmentStats && segmentStats.segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Segment Distribution</CardTitle>
            <CardDescription>
              Contact distribution across segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {segmentStats.segments
                .sort(
                  (a, b) =>
                    (b._count?.contacts || 0) - (a._count?.contacts || 0)
                )
                .slice(0, 5)
                .map((segment) => {
                  const percentage = contactStats?.total
                    ? Math.round(
                        ((segment._count?.contacts || 0) / contactStats.total) *
                          100
                      )
                    : 0;

                  return (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{segment.name}</Badge>
                        <span className="text-sm text-gray-600">
                          {segment.description || "No description"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {segment._count?.contacts || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
