'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMembers, getDeposits, getWithdrawals, getSettings } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { DollarSign, TrendingUp, Wallet, AlertCircle, Users, Activity } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalFunds: 0,
    availableBalance: 0,
    withdrawalLimit: 0,
    totalMembers: 0,
    activeMembers: 0,
    pendingWithdrawals: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    const members = getMembers()
    const deposits = getDeposits()
    const withdrawals = getWithdrawals()
    const settings = getSettings()

    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)
    const approvedWithdrawals = withdrawals
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0)
    const totalFunds = totalDeposits - approvedWithdrawals
    const activeMembers = members.filter((m) => m.status === 'active').length
    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length

    setStats({
      totalDeposits,
      totalFunds,
      availableBalance: totalFunds,
      withdrawalLimit: settings.withdrawalLimit,
      totalMembers: members.length,
      activeMembers,
      pendingWithdrawals,
    })

    // Get recent transactions
    const allTransactions = [
      ...deposits.map((d) => ({ ...d, type: 'deposit' })),
      ...withdrawals
        .filter((w) => w.status === 'approved')
        .map((w) => ({ ...w, type: 'withdrawal', amount: -w.amount })),
    ]
      .sort((a, b) => {
        const timeA = 'timestamp' in a ? a.timestamp : new Date(a.requestDate).getTime()
        const timeB = 'timestamp' in b ? b.timestamp : new Date(b.requestDate).getTime()
        return timeB - timeA
      })
      .slice(0, 5)

    setRecentTransactions(allTransactions)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deposits
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalDeposits)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time bank deposits
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Funds
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalFunds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Collected funds balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <Wallet className="h-5 w-5 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.availableBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current liquid funds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Withdrawal Limit
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-chart-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.withdrawalLimit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingWithdrawals} pending requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Member Stats & Recent Transactions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Member Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10">
                <div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold text-accent">{stats.activeMembers}</p>
                </div>
                <Activity className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transactions yet
                  </p>
                ) : (
                  recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {tx.memberName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {tx.type} • {new Date(tx.date || tx.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-accent' : 'text-destructive'}`}
                      >
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
