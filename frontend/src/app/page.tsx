"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  uploadMessages,
  triggerAnalysis,
  getInsights,
  getMessages,
  type AnalysisResult,
  type Topic,
  type Sentiment,
  type ResponseTime,
} from "@/lib/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sentiments, setSentiments] = useState<Sentiment[]>([]);
  const [responseTimes, setResponseTimes] = useState<Record<string, ResponseTime>>({});
  const [hasInsights, setHasInsights] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, []);

  async function loadExistingData() {
    try {
      const [msgs, insights] = await Promise.all([getMessages(), getInsights()]);
      setMessageCount(msgs.length);
      if (insights.length > 0) {
        parseInsights(insights);
        setHasInsights(true);
      }
    } catch {
      // Backend not running yet
    }
  }

  function parseInsights(insights: AnalysisResult[]) {
    for (const insight of insights) {
      switch (insight.analysis_type) {
        case "topics":
          setTopics(insight.result_data.topics || []);
          break;
        case "sentiment":
          setSentiments(insight.result_data.sentiments || []);
          break;
        case "response_time": {
          const times: Record<string, ResponseTime> = {};
          for (const [key, val] of Object.entries(insight.result_data)) {
            if (
              key !== "topics" &&
              key !== "sentiments" &&
              val &&
              typeof val === "object" &&
              "avg_response_minutes" in val
            ) {
              times[key] = val as ResponseTime;
            }
          }
          setResponseTimes(times);
          break;
        }
      }
    }
  }

  async function handleUpload() {
    setLoading(true);
    try {
      const res = await fetch("/sample_messages.json");
      const sampleMessages = await res.json();
      const msgs = await uploadMessages(sampleMessages);
      setMessageCount(msgs.length);
      toast.success(`Loaded ${msgs.length} messages`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const result = await triggerAnalysis();
      parseInsights(result.results);
      setHasInsights(true);
      toast.success("Analysis complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function sentimentColor(s: string) {
    switch (s) {
      case "positive":
        return "text-emerald-400";
      case "negative":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  }

  function sentimentBadgeVariant(
    s: string
  ): "default" | "secondary" | "destructive" | "outline" {
    switch (s) {
      case "positive":
        return "default";
      case "negative":
        return "destructive";
      default:
        return "secondary";
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Communication Insight Extractor
        </h1>
        <p className="text-muted-foreground mt-2">
          Analyze Slack-like messages for topics, sentiment, and response
          patterns
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-10">
        <Button onClick={handleUpload} disabled={loading} variant="outline">
          {loading ? "Loading..." : "Load Sample Data"}
        </Button>
        <Button onClick={handleAnalyze} disabled={analyzing || messageCount === 0}>
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
        {messageCount > 0 && (
          <span className="text-sm text-muted-foreground font-mono">
            {messageCount} messages loaded
          </span>
        )}
      </div>

      {!hasInsights && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Load sample data and run analysis to see insights
          </CardContent>
        </Card>
      )}

      {hasInsights && (
        <div className="space-y-8 animate-fade-in">
          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Key Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map((topic) => (
                  <Card key={topic.name} className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{topic.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {topic.description}
                          </p>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                          {topic.message_count} msgs
                        </span>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        {topic.channels.map((ch) => (
                          <Badge
                            key={ch}
                            variant="outline"
                            className="text-xs"
                          >
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Sentiment by Author
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentiments.map((s) => (
                    <TableRow key={s.author}>
                      <TableCell className="font-medium">{s.author}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sentimentBadgeVariant(s.overall_sentiment)}
                        >
                          <span
                            className={sentimentColor(s.overall_sentiment)}
                          >
                            {s.overall_sentiment}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(s.confidence * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {s.summary}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Response Times */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Response Time Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Avg (min)</TableHead>
                    <TableHead>Min (min)</TableHead>
                    <TableHead>Max (min)</TableHead>
                    <TableHead>Responses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(responseTimes)
                    .sort(
                      ([, a], [, b]) =>
                        a.avg_response_minutes - b.avg_response_minutes
                    )
                    .map(([author, rt]) => (
                      <TableRow key={author}>
                        <TableCell className="font-medium">{author}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {rt.avg_response_minutes}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {rt.min_response_minutes}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {rt.max_response_minutes}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {rt.total_responses}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
