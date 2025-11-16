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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMembers, getWithdrawals, addWithdrawal, updateWithdrawal, deleteWithdrawal, type Withdrawal } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { Plus, Search, Check, X, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    reason: '',
  })

  useEffect(() => {
    loadWithdrawals()
    setMembers(getMembers())
  }, [])

  const loadWithdrawals = () => {
    setWithdrawals(getWithdrawals())
  }

  const handleAddWithdrawal = (e: React.FormEvent) => {
    e.preventDefault()
    const member = members.find(m => m.id === formData.memberId)
    if (!member) return

    addWithdrawal({
      memberId: formData.memberId,
      memberName: member.name,
      amount: parseFloat(formData.amount),
      status: 'pending',
      requestDate: new Date().toISOString(),
      reason: formData.reason,
    })

    loadWithdrawals()
    setIsAddDialogOpen(false)
    setFormData({ memberId: '', amount: '', reason: '' })
    toast({
      title: 'Withdrawal requested',
      description: `Request for ${formatCurrency(parseFloat(formData.amount))} submitted for ${member.name}.`,
    })
  }

  const handleApproveWithdrawal = (id: string) => {
    const withdrawal = withdrawals.find(w => w.id === id)
    if (!withdrawal) return

    const member = members.find(m => m.id === withdrawal.memberId)
    if (!member) return

    if (member.balance < withdrawal.amount) {
      toast({
        title: 'Insufficient balance',
        description: `${member.name} has insufficient balance to approve this withdrawal.`,
        variant: 'destructive',
      })
      return
    }

    updateWithdrawal(id, {
      status: 'approved',
      processedDate: new Date().toISOString(),
    })

    loadWithdrawals()
    setMembers(getMembers())
    toast({
      title: 'Withdrawal approved',
      description: `${formatCurrency(withdrawal.amount)} has been deducted from ${member.name}'s account.`,
    })
  }

  const handleDenyWithdrawal = (id: string) => {
    const withdrawal = withdrawals.find(w => w.id === id)
    if (!withdrawal) return

    updateWithdrawal(id, {
      status: 'denied',
      processedDate: new Date().toISOString(),
    })

    loadWithdrawals()
    toast({
      title: 'Withdrawal denied',
      description: `Request has been denied.`,
      variant: 'destructive',
    })
  }

  const handleDeleteWithdrawal = (id: string) => {
    if (confirm('Are you sure you want to delete this withdrawal request?')) {
      deleteWithdrawal(id)
      loadWithdrawals()
      toast({
        title: 'Withdrawal deleted',
        description: 'Withdrawal request has been removed.',
        variant: 'destructive',
      })
    }
  }

  const filteredWithdrawals = withdrawals.filter(
    (withdrawal) =>
      withdrawal.memberName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingWithdrawals = filteredWithdrawals.filter(w => w.status === 'pending')
  const approvedWithdrawals = filteredWithdrawals.filter(w => w.status === 'approved')
  const deniedWithdrawals = filteredWithdrawals.filter(w => w.status === 'denied')

  const WithdrawalTable = ({ withdrawals, showActions = false }: { withdrawals: Withdrawal[], showActions?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Member</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Request Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                {searchQuery ? 'No withdrawals found matching your search.' : 'No withdrawals in this category.'}
              </td>
            </tr>
          ) : (
            withdrawals.map((withdrawal) => {
              const member = members.find(m => m.id === withdrawal.memberId)
              const canApprove = member && member.balance >= withdrawal.amount
              
              return (
                <tr key={withdrawal.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{withdrawal.memberName}</td>
                  <td className="py-3 px-4 text-sm font-bold text-destructive">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(withdrawal.requestDate).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        withdrawal.status === 'approved'
                          ? 'default'
                          : withdrawal.status === 'denied'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {withdrawal.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                      {withdrawal.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {withdrawal.status === 'denied' && <XCircle className="mr-1 h-3 w-3" />}
                      {withdrawal.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {member ? (
                      <span className={canApprove ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                        {formatCurrency(member.balance)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {showActions && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApproveWithdrawal(withdrawal.id)}
                            disabled={!canApprove}
                            title={!canApprove ? 'Insufficient balance' : 'Approve withdrawal'}
                          >
                            <Check className="h-4 w-4 text-accent" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDenyWithdrawal(withdrawal.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
              <Clock className="h-5 w-5 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {pendingWithdrawals.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {approvedWithdrawals.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Denied
              </CardTitle>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {deniedWithdrawals.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search withdrawals by member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Request Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
                <DialogDescription>
                  Submit a withdrawal request for a member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddWithdrawal} className="space-y-4">
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
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    placeholder="Purpose of withdrawal"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.memberId}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({pendingWithdrawals.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedWithdrawals.length})
                </TabsTrigger>
                <TabsTrigger value="denied">
                  Denied ({deniedWithdrawals.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-6">
                <WithdrawalTable withdrawals={pendingWithdrawals} showActions={true} />
              </TabsContent>
              <TabsContent value="approved" className="mt-6">
                <WithdrawalTable withdrawals={approvedWithdrawals} />
              </TabsContent>
              <TabsContent value="denied" className="mt-6">
                <WithdrawalTable withdrawals={deniedWithdrawals} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
