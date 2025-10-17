import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Globe, Clock, Search, Database, CheckCircle2, ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    title: "Total Searches",
    value: "0",
    change: "+0%",
    icon: Globe,
    trend: "up"
  },
  {
    title: "Leads Found",
    value: "0",
    change: "+0%",
    icon: Users,
    trend: "up"
  },
  {
    title: "Legacy Sites",
    value: "0",
    change: "+0%",
    icon: TrendingUp,
    trend: "up"
  },
  {
    title: "Avg. Response Time",
    value: "0s",
    change: "0s",
    icon: Clock,
    trend: "neutral"
  }
];

export default function Dashboard() {
  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">AI-Powered</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Welcome to LAGACY
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover high-quality leads with AI-powered search. Configure your preferences, execute searches, and manage your leads effortlessly.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/search">
                <Button size="lg" className="gap-2 shadow-lg">
                  <Search className="h-4 w-4" />
                  Start New Search
                </Button>
              </Link>
              <Link to="/settings">
                <Button size="lg" variant="outline" className="gap-2">
                  <Target className="h-4 w-4" />
                  Configure APIs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const colors = [
            { bg: 'bg-blue-500/10', border: 'border-l-blue-500', icon: 'text-blue-500' },
            { bg: 'bg-green-500/10', border: 'border-l-green-500', icon: 'text-green-500' },
            { bg: 'bg-purple-500/10', border: 'border-l-purple-500', icon: 'text-purple-500' },
            { bg: 'bg-orange-500/10', border: 'border-l-orange-500', icon: 'text-orange-500' }
          ];
          const color = colors[idx];

          return (
            <Card 
              key={stat.title} 
              className={`shadow-lg hover:shadow-xl transition-all duration-300 border-0 border-l-4 ${color.border} hover:scale-105 cursor-pointer`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center shadow-inner`}>
                  <stat.icon className={`w-6 h-6 ${color.icon}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="text-xs">
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity & Quick Start Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Card */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
          <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Your latest search operations</CardDescription>
                </div>
              </div>
              <Link to="/recent-searches">
                <Button variant="outline" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <Database className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-muted-foreground">No activity yet</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Start your first search to see your activity history here
                </p>
              </div>
              <Link to="/search">
                <Button className="gap-2 mt-4">
                  <Search className="h-4 w-4" />
                  Create First Search
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide Card */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
          <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 via-purple-500/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Quick Start Guide</CardTitle>
                <CardDescription>Follow these steps to generate leads</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              {[
                {
                  step: 1,
                  title: "Configure API Keys",
                  description: "Add your third-party API keys in Settings",
                  icon: Target,
                  link: "/settings"
                },
                {
                  step: 2,
                  title: "Execute Search",
                  description: "Define your search criteria and discover leads",
                  icon: Search,
                  link: "/search"
                },
                {
                  step: 3,
                  title: "Manage Leads",
                  description: "Review and export your discovered leads",
                  icon: CheckCircle2,
                  link: "/recent-searches"
                }
              ].map((item, idx) => (
                <Link key={idx} to={item.link}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">STEP {item.step}</span>
                      </div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
