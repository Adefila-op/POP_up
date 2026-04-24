import { useState, useCallback } from "react";
import { IPTokenSimulation, SimulationState, HolderState } from "@/lib/simulation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingDown, TrendingUp, Zap } from "lucide-react";

const SimulationDashboard = () => {
  const [simulation] = useState(() => new IPTokenSimulation());
  const [state, setState] = useState<SimulationState | null>(null);
  const [buyAmount, setBuyAmount] = useState("1000");
  const [sellAmount, setSellAmount] = useState("100");
  const [burnAmount, setBurnAmount] = useState("50");
  const [newInvestorId, setNewInvestorId] = useState("investor_1");

  // Initialize simulation
  const handleCreateIP = useCallback(() => {
    simulation.createIP("creator_alice", "AI Art NFT Collection", 10000, 30);
    setState(simulation.getState());
  }, [simulation]);

  // Buy action
  const handleBuy = useCallback(() => {
    try {
      simulation.executeBuy(newInvestorId, parseFloat(buyAmount));
      setState(simulation.getState());
    } catch (e) {
      alert(`Buy failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }, [simulation, newInvestorId, buyAmount]);

  // Sell action
  const handleSell = useCallback(() => {
    try {
      simulation.executeSell("creator_alice", parseFloat(sellAmount));
      setState(simulation.getState());
    } catch (e) {
      alert(`Sell failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }, [simulation, sellAmount]);

  // Burn action
  const handleBurn = useCallback(() => {
    try {
      simulation.claimBurnShare("creator_alice", parseFloat(burnAmount));
      setState(simulation.getState());
    } catch (e) {
      alert(`Burn failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }, [simulation, burnAmount]);

  // End launch phase
  const handleEndLaunch = useCallback(() => {
    try {
      simulation.endLaunchPhase();
      setState(simulation.getState());
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }, [simulation]);

  // Market crash
  const handleCrash = useCallback(() => {
    simulation.simulateMarketCrash(0.3);
    setState(simulation.getState());
  }, [simulation]);

  // Market recovery
  const handleRecovery = useCallback(() => {
    simulation.simulateMarketRecovery("investor_recovery", 5000);
    setState(simulation.getState());
  }, [simulation]);

  // Reset
  const handleReset = useCallback(() => {
    simulation.reset();
    setState(null);
  }, [simulation]);

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">IP Token Simulation</h1>
            <p className="text-xl text-purple-200">Test the backend logic with interactive scenarios</p>
          </div>

          <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Welcome to Simulator</CardTitle>
              <CardDescription>Click below to create a new IP and start testing</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateIP} size="lg" className="bg-purple-600 hover:bg-purple-700">
                Create New IP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ip = state.ip;
  const liquidityPct = (state.ip.currentLiquidity / state.ip.initialLiquidity) * 100;
  const creator = state.holders.get("creator_alice");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{ip.title}</h1>
          <div className="flex justify-center gap-4 text-sm">
            <span className={`px-3 py-1 rounded-full ${ip.status === "LAUNCH_PHASE" ? "bg-yellow-500/30 text-yellow-200" : "bg-green-500/30 text-green-200"}`}>
              {ip.status}
            </span>
            {state.emergencyBurnActive && (
              <span className="px-3 py-1 rounded-full bg-red-500/30 text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Emergency Burn Active
              </span>
            )}
          </div>
        </div>

        {/* Emergency Alert */}
        {state.emergencyBurnActive && (
          <Alert className="border-red-500 bg-red-500/10">
            <Zap className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-400">Emergency Burn Mechanism Triggered!</AlertTitle>
            <AlertDescription className="text-red-300">
              Liquidity has dropped to {liquidityPct.toFixed(1)}% (threshold: 5%). Holders can now burn tokens to claim their share of remaining liquidity.
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200">Current Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${ip.currentPrice.toFixed(2)}</div>
              <p className="text-xs text-purple-400 mt-1">per token</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200">Liquidity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${ip.currentLiquidity.toFixed(0)}</div>
              <p className={`text-xs mt-1 ${liquidityPct > 50 ? "text-green-400" : liquidityPct > 10 ? "text-yellow-400" : "text-red-400"}`}>
                {liquidityPct.toFixed(1)}% of initial
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${ip.marketCap.toFixed(0)}</div>
              <p className="text-xs text-purple-400 mt-1">Total value</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200">Circulating Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{ip.circulatingSupply.toFixed(0)}</div>
              <p className="text-xs text-purple-400 mt-1">tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Liquidity Meter */}
        <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Liquidity Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-200">Liquidity Level</span>
                <span className={`font-bold ${liquidityPct > 50 ? "text-green-400" : liquidityPct > 10 ? "text-yellow-400" : "text-red-400"}`}>
                  {liquidityPct.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    liquidityPct > 50 ? "bg-green-500" : liquidityPct > 10 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(liquidityPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0%</span>
                <span className="text-red-400 font-bold">5% THRESHOLD</span>
                <span className="text-yellow-400 font-bold">50% MIN</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Tabs defaultValue="trading" className="space-y-4">
          <TabsList className="bg-slate-800/50 border-purple-500/50">
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="burn">Burn Mechanism</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" /> Buy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-purple-200 mb-2 block">Investor ID</label>
                    <Input
                      value={newInvestorId}
                      onChange={(e) => setNewInvestorId(e.target.value)}
                      placeholder="investor_1"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-200 mb-2 block">Amount (USD)</label>
                    <Input
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="1000"
                      type="number"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button onClick={handleBuy} className="w-full bg-green-600 hover:bg-green-700">
                    Execute Buy
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" /> Sell
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-purple-200 mb-2 block">Tokens to Sell</label>
                    <Input
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="100"
                      type="number"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Creator has: {creator?.activeBalance.toFixed(0) || 0} tokens
                  </p>
                  <Button onClick={handleSell} className="w-full bg-red-600 hover:bg-red-700">
                    Execute Sell
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Phase Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleEndLaunch} disabled={ip.status !== "LAUNCH_PHASE"} className="w-full bg-purple-600 hover:bg-purple-700">
                    End Launch Phase
                  </Button>
                  <Button onClick={handleCrash} variant="outline" className="w-full">
                    Market Crash (-30%)
                  </Button>
                  <Button onClick={handleRecovery} variant="outline" className="w-full">
                    Market Recovery (+$5k)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Burn Tab */}
          <TabsContent value="burn" className="space-y-4">
            <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Emergency Burn Claim</CardTitle>
                <CardDescription>Only available when liquidity ≤ 5%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.emergencyBurnActive ? (
                  <div className="space-y-4">
                    <Alert className="border-orange-500 bg-orange-500/10">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <AlertTitle className="text-orange-400">Burn Period Active</AlertTitle>
                      <AlertDescription className="text-orange-300">
                        Holders can burn tokens to claim their proportional share of remaining liquidity.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <label className="text-sm text-purple-200 mb-2 block">Tokens to Burn</label>
                      <Input
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                        placeholder="50"
                        type="number"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded text-sm">
                      <p className="text-purple-200">
                        Burning {parseFloat(burnAmount) || 0} tokens will claim:{" "}
                        <span className="text-green-400 font-bold">
                          ${(state.ip.currentLiquidity * (parseFloat(burnAmount) / state.ip.totalSupply)).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <Button onClick={handleBurn} className="w-full bg-orange-600 hover:bg-orange-700">
                      Claim Burn Share
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Emergency burn mechanism is not active</p>
                    <p className="text-sm text-slate-500 mt-2">Liquidity must drop to ≤5% ({5}% threshold)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-purple-200">Type</TableHead>
                        <TableHead className="text-purple-200">Amount</TableHead>
                        <TableHead className="text-purple-200">Price</TableHead>
                        <TableHead className="text-purple-200">Fee/Share</TableHead>
                        <TableHead className="text-purple-200">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.transactions.slice().reverse().map((tx) => (
                        <TableRow key={tx.id} className="border-slate-700">
                          <TableCell className={`text-sm ${tx.type === "BUY" ? "text-green-400" : tx.type === "SELL" ? "text-red-400" : "text-orange-400"}`}>
                            {tx.type}
                          </TableCell>
                          <TableCell className="text-white">${tx.amountValue.toFixed(2)}</TableCell>
                          <TableCell className="text-white">${tx.pricePerToken.toFixed(4)}</TableCell>
                          <TableCell className="text-white">${(tx.feeToLiquidity || tx.sellerProceeds).toFixed(2)}</TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holders Tab */}
          <TabsContent value="holders" className="space-y-4">
            <Card className="border-purple-500/50 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Token Holders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-purple-200">User</TableHead>
                        <TableHead className="text-purple-200">Active</TableHead>
                        <TableHead className="text-purple-200">Burned</TableHead>
                        <TableHead className="text-purple-200">Avg Price</TableHead>
                        <TableHead className="text-purple-200">Invested</TableHead>
                        <TableHead className="text-purple-200">Claimed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(state.holders.values()).map((holder) => (
                        <TableRow key={holder.userId} className="border-slate-700">
                          <TableCell className="text-white">{holder.userId}</TableCell>
                          <TableCell className="text-white">{holder.activeBalance.toFixed(0)}</TableCell>
                          <TableCell className="text-orange-400">{holder.burnedBalance.toFixed(0)}</TableCell>
                          <TableCell className="text-white">${holder.averageBuyPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-white">${holder.totalInvested.toFixed(2)}</TableCell>
                          <TableCell className="text-green-400">${holder.liquidityClaimed.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="border-purple-500/50">
            Reset Simulation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;
