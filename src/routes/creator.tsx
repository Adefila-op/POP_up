import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Package,
  MessageSquare,
  Eye,
  DollarSign,
  Users,
  Calendar,
  MoreVertical,
  Zap,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState } from "@/lib/use-app-state";
import IPLaunchModal from "@/components/creator/IPLaunchModal";
import DiscoveryPostModal from "@/components/creator/DiscoveryPostModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/creator")({
  head: () => ({
    meta: [
      { title: "Creator Dashboard — Orisale" },
      {
        name: "description",
        content: "Manage your content, IP assets, and creator presence.",
      },
    ],
  }),
  component: CreatorDashboard,
});

interface CreatedIP {
  id: string;
  title: string;
  initialLiquidity: number;
  currentPrice: number;
  holders: number;
  status: "CREATED" | "LAUNCH_PHASE" | "PUBLIC_TRADING" | "MATURE";
  createdAt: Date;
  earnings: number;
}

interface CreatedProduct {
  id: string;
  title: string;
  type: "pdf" | "art" | "tool";
  price: number;
  sales: number;
  earnings: number;
  createdAt: Date;
  views: number;
  rating: number;
}

interface CreatedPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: Date;
  engagement: number;
}

function CreatorDashboard() {
  const { createdContent, createdIpAssets, signedIn, creatorProfileActive, walletConnected } =
    useAppState();
  const [ipModalOpen, setIpModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in production this would come from the app state
  const createdIPs: CreatedIP[] = createdIpAssets.map((ip) => ({
    id: ip.id,
    title: ip.title,
    initialLiquidity: 10000,
    currentPrice: 1.2,
    holders: 245,
    status: "PUBLIC_TRADING",
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    earnings: Math.random() * 50000,
  }));

  const createdProducts: CreatedProduct[] = createdContent.map((content) => ({
    id: content.id,
    title: content.title,
    type: content.type,
    price: content.price,
    sales: content.sales,
    earnings: content.sales * content.price,
    createdAt: new Date(),
    views: content.sales * 3,
    rating: content.rating,
  }));

  const createdPosts: CreatedPost[] = [
    {
      id: "post_1",
      title: "Behind the scenes: Creating digital art",
      content: "Just finished a new collection. The process was incredible...",
      likes: 234,
      comments: 45,
      views: 2341,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      engagement: 12.5,
    },
    {
      id: "post_2",
      title: "Tips for indie creators",
      content: "Here are 5 things I learned from selling digital products...",
      likes: 567,
      comments: 89,
      views: 5432,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      engagement: 14.2,
    },
  ];

  if (!walletConnected || !signedIn || !creatorProfileActive) {
    return (
      <AppShell title="Creator Dashboard">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Creator Access Required</AlertTitle>
            <AlertDescription>
              Connect a wallet and activate a creator profile before using the creator dashboard.
              Collectors can stay wallet-only and review holdings from the portfolio page.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild>
              <Link to="/upload">Set up creator access</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Creator Dashboard" subtitle="Manage your content, IP, and audience">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setIpModalOpen(true)}
            className="h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Zap className="w-5 h-5 mr-2" />
            Launch IP
          </Button>
          <Button
            onClick={() => setPostModalOpen(true)}
            className="h-16 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Repost Product
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                $
                {(
                  createdProducts.reduce((acc, p) => acc + p.earnings, 0) +
                  createdIPs.reduce((acc, ip) => acc + ip.earnings, 0)
                ).toFixed(0)}
              </div>
              <p className="text-xs text-slate-500 mt-2">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(
                  createdProducts.reduce((acc, p) => acc + p.views, 0) +
                  createdPosts.reduce((acc, p) => acc + p.views, 0)
                ).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-2">All products + posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Active IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{createdIPs.length}</div>
              <p className="text-xs text-slate-500 mt-2">
                {createdIPs.filter((ip) => ip.status === "PUBLIC_TRADING").length} in trading
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2.4K</div>
              <p className="text-xs text-slate-500 mt-2">+234 this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ip">IP Assets</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent IP Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent IP Activity</span>
                    <Link to="/creator?tab=ip">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {createdIPs.slice(0, 3).map((ip) => (
                    <div
                      key={ip.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ip.title}</p>
                        <p className="text-xs text-slate-500">
                          {ip.holders} holders • ${ip.currentPrice.toFixed(2)}/token
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-green-600">
                          ${ip.earnings.toFixed(0)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            ip.status === "PUBLIC_TRADING"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Product Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Products</span>
                    <Link to="/creator?tab=products">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {createdProducts.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-xs text-slate-500">
                          {product.sales} sales • {product.views} views
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-blue-600">
                          ${product.earnings.toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-500">⭐ {product.rating}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* IP Assets Tab */}
          <TabsContent value="ip" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdIPs.map((ip) => (
                <Card key={ip.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span>{ip.title}</span>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>Launched {ip.createdAt.toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Current Price</p>
                        <p className="text-lg font-bold">${ip.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Holders</p>
                        <p className="text-lg font-bold">{ip.holders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            ip.status === "PUBLIC_TRADING"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ip.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Earnings</p>
                        <p className="text-lg font-bold text-green-600">
                          ${ip.earnings.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <Link to={`/ip/${ip.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <span>{product.title}</span>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {product.type.toUpperCase()} • ${product.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Sales</p>
                          <p className="font-bold">{product.sales}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Views</p>
                          <p className="font-bold">{product.views}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Earnings</p>
                          <p className="font-bold text-green-600">${product.earnings.toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500">Rating</p>
                          <p className="font-bold">⭐ {product.rating}</p>
                        </div>
                      </div>
                    </div>
                    <Link to={`/content/${product.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        View Product
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <div className="space-y-4">
              {createdPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {post.createdAt.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-700">{post.content}</p>
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{post.likes}</p>
                        <p className="text-xs text-slate-500">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{post.comments}</p>
                        <p className="text-xs text-slate-500">Comments</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{post.views}</p>
                        <p className="text-xs text-slate-500">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{post.engagement.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">Engagement</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      Edit Post
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Revenue breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Products</span>
                      <span className="font-bold">
                        ${createdProducts.reduce((acc, p) => acc + p.earnings, 0).toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (createdProducts.reduce((acc, p) => acc + p.earnings, 0) /
                              (createdProducts.reduce((acc, p) => acc + p.earnings, 0) +
                                createdIPs.reduce((acc, ip) => acc + ip.earnings, 0))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">IP Assets</span>
                      <span className="font-bold">
                        ${createdIPs.reduce((acc, ip) => acc + ip.earnings, 0).toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (createdIPs.reduce((acc, ip) => acc + ip.earnings, 0) /
                              (createdProducts.reduce((acc, p) => acc + p.earnings, 0) +
                                createdIPs.reduce((acc, ip) => acc + ip.earnings, 0))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {ipModalOpen && <IPLaunchModal open={ipModalOpen} onOpenChange={setIpModalOpen} />}
      {postModalOpen && <DiscoveryPostModal open={postModalOpen} onOpenChange={setPostModalOpen} />}
    </AppShell>
  );
}
