'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMembers, getDeposits, addDeposit, deleteDeposit, type Deposit } from '@/lib/storage'
import { Plus, Search, Trash2, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/currency'

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    depositorInfo: '',
  })

  useEffect(() => {
    loadDeposits()
    setMembers(getMembers())
  }, [])

  const loadDeposits = () => {
    setDeposits(getDeposits())
  }

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    const member = members.find(m => m.id === formData.memberId)
    if (!member) return

    addDeposit({
      memberId: formData.memberId,
      memberName: member.name,
      amount: parseFloat(formData.amount),
      depositorInfo: formData.depositorInfo,
      date: new Date().toISOString(),
    })

    loadDeposits()
    setMembers(getMembers()) // Refresh to get updated balances
    setIsAddDialogOpen(false)
    setFormData({ memberId: '', amount: '', depositorInfo: '' })
    toast({
      title: 'Deposit recorded',
      description: `${formatCurrency(parseFloat(formData.amount))} added to ${member.name}'s account.`,
    })
  }

  const handleDeleteDeposit = (id: string) => {
    if (confirm('Are you sure you want to delete this deposit? This will adjust the member balance.')) {
      deleteDeposit(id)
      loadDeposits()
      setMembers(getMembers())
      toast({
        title: 'Deposit deleted',
        description: 'Deposit has been removed and balance adjusted.',
        variant: 'destructive',
      })
    }
  }

  const filteredDeposits = deposits.filter(
    (deposit) =>
      deposit.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.depositorInfo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deposits
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalDeposits)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {deposits.length} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search deposits by member or depositor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Deposit</DialogTitle>
                <DialogDescription>
                  Enter the deposit details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member">Select Member</Label>
                  <Select
                    value={formData.memberId}
                    onValueChange={(value) => setFormData({ ...formData, memberId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {formatCurrency(member.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Rs.)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositor">Depositor Information</Label>
                  <Input
                    id="depositor"
                    placeholder="Name or reference"
                    value={formData.depositorInfo}
                    onChange={(e) => setFormData({ ...formData, depositorInfo: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.memberId}>
                    Record Deposit
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deposit History ({filteredDeposits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDeposits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No deposits found matching your search.' : 'No deposits recorded yet.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Member</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Depositor</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeposits.map((deposit) => (
                        <tr key={deposit.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(deposit.date).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{deposit.memberName}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{deposit.depositorInfo}</td>
                          <td className="py-3 px-4 text-sm font-bold text-accent">
                            {formatCurrency(deposit.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDeposit(deposit.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
